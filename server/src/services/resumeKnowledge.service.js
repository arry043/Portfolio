import { PDFParse } from 'pdf-parse';
import ResumeKnowledge from '../models/ResumeKnowledge.js';
import { resumeData } from '../data/resume.data.js';

const DEFAULT_FALLBACK_MESSAGE = "I haven't added that yet, but working on it.";
const AMBIGUOUS_QUERY_MESSAGE =
  'I can answer better if you ask specifically about my projects, skills, experience, or certifications.';
const DEFAULT_SOURCE = 'seed-resume-data';

const STOP_WORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'this',
  'that',
  'you',
  'your',
  'are',
  'was',
  'were',
  'from',
  'into',
  'has',
  'have',
  'had',
  'will',
  'can',
  'not',
  'but',
  'our',
  'their',
  'about',
  'them',
  'they',
  'its',
  'also',
  'more',
  'than',
  'when',
  'where',
  'what',
  'which',
  'how',
  'while',
  'over',
  'under',
  'just',
  'some',
  'such',
  'using',
  'built',
  'build',
]);

const normalizeText = (value) =>
  value
    .replace(/\s+/g, ' ')
    .replace(/[\u0000-\u001f]/g, ' ')
    .trim();

const tokenize = (value) =>
  normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));

const chunkText = (text, chunkSize = 900, overlap = 140) => {
  const normalized = normalizeText(text);

  if (!normalized) {
    return [];
  }

  const chunks = [];
  const step = Math.max(1, chunkSize - overlap);

  for (let start = 0; start < normalized.length; start += step) {
    const end = Math.min(normalized.length, start + chunkSize);
    const chunk = normalized.slice(start, end).trim();

    if (chunk.length < 40) {
      continue;
    }

    chunks.push(chunk);
  }

  return chunks;
};

const AMBIGUOUS_QUERIES = new Set([
  'more',
  'details',
  'help',
  'info',
  'information',
  'tell me more',
  'explain',
  'what about this',
  'what about that',
]);

const isAmbiguousQuery = (query) => {
  const normalized = normalizeText(query).toLowerCase();
  return AMBIGUOUS_QUERIES.has(normalized);
};

const scoreChunk = (queryTokens, chunkTokens, query, chunkTextValue) => {
  if (queryTokens.length === 0 || chunkTokens.length === 0) {
    return 0;
  }

  const chunkTokenSet = new Set(chunkTokens);
  let overlapCount = 0;

  for (const token of queryTokens) {
    if (chunkTokenSet.has(token)) {
      overlapCount += 1;
    }
  }

  let score = overlapCount / Math.sqrt(chunkTokenSet.size);

  if (chunkTextValue.toLowerCase().includes(query.toLowerCase())) {
    score += 0.5;
  }

  return score;
};

const toSeedKnowledgeText = () => {
  const skills = Object.values(resumeData.skills || {})
    .flat()
    .join(', ');

  const experiences = (resumeData.experience || [])
    .map(
      (item) =>
        `${item.role} at ${item.company} (${item.period}): ${(item.highlights || []).join(
          ' '
        )}`
    )
    .join(' ');

  const projects = (resumeData.projects || [])
    .map(
      (project) =>
        `${project.title}: ${project.description}. Tags: ${(project.tags || []).join(
          ', '
        )}.`
    )
    .join(' ');

  const certifications = (resumeData.certifications || [])
    .map((item) => `${item.title} from ${item.issuer}.`)
    .join(' ');

  const achievements = (resumeData.achievements || []).join(' ');

  return [
    resumeData.profile?.summary || '',
    `Skills: ${skills}`,
    experiences,
    projects,
    certifications,
    achievements,
  ]
    .join(' ')
    .trim();
};

const getKnowledgeDocument = async () => {
  const existing = await ResumeKnowledge.findOne({ sourceName: 'resume' });

  if (existing && existing.chunks.length > 0) {
    return existing;
  }

  const seedText = toSeedKnowledgeText();
  const chunks = chunkText(seedText).map((text, index) => ({
    index,
    text,
    tokens: tokenize(text),
  }));

  return {
    sourceName: DEFAULT_SOURCE,
    rawText: seedText,
    chunks,
    updatedAt: new Date(),
  };
};

const parseResumeText = async (file) => {
  if (!file?.buffer) {
    throw new Error('Resume file is required');
  }

  if (file.mimetype === 'application/pdf') {
    const parser = new PDFParse({ data: file.buffer });
    const parsed = await parser.getText();
    await parser.destroy();
    return normalizeText(parsed.text || '');
  }

  return normalizeText(file.buffer.toString('utf-8'));
};

const ensureFirstPersonVoice = (value) => {
  const text = normalizeText(value);

  if (!text) {
    return DEFAULT_FALLBACK_MESSAGE;
  }

  if (/\b(i|my|me)\b/i.test(text)) {
    return text;
  }

  if (text.endsWith('?')) {
    return `I can clarify this better: ${text}`;
  }

  return `I can share this: ${text}`;
};

const trimAnswerLines = (value, maxLines = 4) => {
  const normalized = String(value || '').replace(/\r/g, '').trim();

  if (!normalized) {
    return DEFAULT_FALLBACK_MESSAGE;
  }

  const rawLines = normalized.includes('\n')
    ? normalized.split('\n').map((line) => line.trim()).filter(Boolean)
    : (normalized.match(/[^.!?]+[.!?]?/g) || [normalized]).map((line) => line.trim());

  const finalLines = rawLines.slice(0, maxLines).map((line) => {
    if (line.length <= 160) {
      return line;
    }

    return `${line.slice(0, 157)}...`;
  });

  return finalLines.join('\n');
};

const generateFallbackAnswer = (query, chunks) => {
  if (!chunks || chunks.length === 0) {
    return DEFAULT_FALLBACK_MESSAGE;
  }

  const highlights = chunks
    .slice(0, 3)
    .map((chunk) => {
      const sentence = (chunk.text || '').split(/[.!?]/).find(Boolean) || chunk.text;
      return ensureFirstPersonVoice(sentence);
    })
    .filter(Boolean);

  if (highlights.length === 0) {
    return DEFAULT_FALLBACK_MESSAGE;
  }

  return trimAnswerLines(highlights.join('\n'));
};

const askOpenAI = async (query, context) => {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content:
            "You are Mohd Arif Ansari replying to visitors on his portfolio. Answer only from the provided context. Always write in first person (I/my), friendly and confident, and keep responses within 2-4 short lines. If context is missing, reply exactly: I haven't added that yet, but working on it.",
        },
        {
          role: 'user',
          content: `Question: ${query}\n\nResume Context:\n${context}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error('OpenAI request failed');
  }

  const payload = await response.json();
  return payload?.choices?.[0]?.message?.content?.trim() || null;
};

const askGroq = async (query, context) => {
  if (!process.env.GROQ_API_KEY) {
    return null;
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content:
            "You are Mohd Arif Ansari replying to visitors on his portfolio. Answer only from the provided context. Always write in first person (I/my), friendly and confident, and keep responses within 2-4 short lines. If context is missing, reply exactly: I haven't added that yet, but working on it.",
        },
        {
          role: 'user',
          content: `Question: ${query}\n\nResume Context:\n${context}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error('Groq request failed');
  }

  const payload = await response.json();
  return payload?.choices?.[0]?.message?.content?.trim() || null;
};

const askLLM = async (query, context) => {
  try {
    const openAiResult = await askOpenAI(query, context);
    if (openAiResult) {
      return openAiResult;
    }
  } catch (error) {
    // Gracefully continue to the next provider.
  }

  try {
    const groqResult = await askGroq(query, context);
    if (groqResult) {
      return groqResult;
    }
  } catch (error) {
    // Gracefully continue to fallback response.
  }

  return null;
};

export const indexResumeFromFile = async (file) => {
  const rawText = await parseResumeText(file);

  if (!rawText) {
    throw new Error('Could not extract text from resume');
  }

  const chunkRecords = chunkText(rawText).map((text, index) => ({
    index,
    text,
    tokens: tokenize(text),
  }));

  if (chunkRecords.length === 0) {
    throw new Error('Resume text is too short to index');
  }

  const knowledge = await ResumeKnowledge.findOneAndUpdate(
    { sourceName: 'resume' },
    {
      sourceName: 'resume',
      rawText,
      chunks: chunkRecords,
    },
    { upsert: true, returnDocument: 'after' }
  );

  return {
    sourceName: knowledge.sourceName,
    chunkCount: knowledge.chunks.length,
    updatedAt: knowledge.updatedAt,
  };
};

export const getResumeKnowledgeStatus = async () => {
  const knowledge = await getKnowledgeDocument();

  return {
    hasKnowledge: Array.isArray(knowledge.chunks) && knowledge.chunks.length > 0,
    sourceName: knowledge.sourceName,
    chunkCount: knowledge.chunks.length,
    updatedAt: knowledge.updatedAt,
  };
};

export const answerResumeQuestion = async (query) => {
  if (isAmbiguousQuery(query)) {
    return {
      answer: AMBIGUOUS_QUERY_MESSAGE,
      chunks: [],
    };
  }

  const knowledge = await getKnowledgeDocument();
  const queryTokens = tokenize(query);

  const scoredChunks = (knowledge.chunks || [])
    .map((chunk) => ({
      ...chunk,
      score: scoreChunk(queryTokens, chunk.tokens || [], query, chunk.text || ''),
    }))
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  if (scoredChunks.length === 0) {
    return {
      answer: DEFAULT_FALLBACK_MESSAGE,
      chunks: [],
    };
  }

  const context = scoredChunks.map((chunk) => chunk.text).join('\n\n');
  const modelAnswer = await askLLM(query, context);
  const safeAnswer = modelAnswer
    ? trimAnswerLines(ensureFirstPersonVoice(modelAnswer))
    : generateFallbackAnswer(query, scoredChunks);

  return {
    answer: safeAnswer || DEFAULT_FALLBACK_MESSAGE,
    chunks: scoredChunks.map((chunk) => ({ index: chunk.index, text: chunk.text })),
  };
};
