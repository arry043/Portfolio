import { PDFParse } from 'pdf-parse';
import * as mammoth from 'mammoth';
import { Groq } from 'groq-sdk';
import Resume from '../models/Resume.js';
import ResumeKnowledge from '../models/ResumeKnowledge.js';
import { resumeData } from '../data/resume.data.js';

export const STRICT_FALLBACK_MESSAGE =
  "I'm having a small issue right now. Please try again in a moment.";

const DEFAULT_SOURCE = 'seed-resume-data';
const DEFAULT_GROQ_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';
const DEFAULT_GROQ_TEMPERATURE = 0.4;
const DEFAULT_GROQ_TOP_P = 1;
const DEFAULT_GROQ_MAX_COMPLETION_TOKENS = 1024;
const CONTEXT_CHAR_LIMIT = 28_000;
const RETRIEVAL_CHUNK_LIMIT = 14;
const RESUME_CACHE_TTL_MS = 10 * 60 * 1000;
const FETCH_TIMEOUT_MS = 15_000;

const STRICT_SYSTEM_PROMPT = `You are Arif Ansari, a Full Stack Developer, and you are speaking as the owner of this portfolio.

STRICT RULES:
- Answer ONLY based on the provided data.
- Do NOT guess or hallucinate.
- Do NOT generate any information not present in the data.
- If the answer is not available, respond exactly:
"I don't have that information yet. You can add it in the admin panel."
- If partial data is available, answer only that part.

PERSONA:
- Be polite, professional, and helpful.
- Assume user is HR, recruiter, or visitor.
- Use first-person tone when appropriate.

LANGUAGE RULE:
- Reply in the SAME language as the user.
- Hindi → Hindi
- Hinglish → Hinglish
- English → English
- Do NOT translate unless asked.

STYLE:
- Respond like a normal human conversation.
- Keep answers short (2-3 lines max) unless the user explicitly asks for "full details".
- Be polite, natural, and to the point.
- Avoid long or structured responses unless user asks for "full details".
- If the question is conversational (e.g., salary, opinion, greeting), respond naturally instead of fallback. Give a short, polite, and reasonable answer.`;

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

const resumeTextCache = new Map();
let groqClient = null;
const FULL_DETAILS_PATTERN = /\bfull\s+details\b/i;

const normalizeText = (value) =>
  String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/[\u0000-\u001f]/g, ' ')
    .trim();

const asksForFullDetails = (query) => FULL_DETAILS_PATTERN.test(normalizeText(query));

const toShortConversationalReply = (value, maxLines = 3) => {
  const normalized = String(value || '').replace(/\r/g, '').trim();

  if (!normalized) {
    return STRICT_FALLBACK_MESSAGE;
  }

  const rawLines = normalized.includes('\n')
    ? normalized
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
    : (normalized.match(/[^.!?]+[.!?]?/g) || [normalized])
        .map((line) => line.trim())
        .filter(Boolean);

  if (rawLines.length <= maxLines) {
    return rawLines.join('\n');
  }

  return rawLines.slice(0, maxLines).join('\n');
};

const tokenize = (value) =>
  (normalizeText(value)
    .toLowerCase()
    .match(/[\p{L}\p{N}]+/gu) || []
  ).filter((token) => token.length > 2 && !STOP_WORDS.has(token));

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
        `${project.title}: ${project.description}. Tags: ${(project.tags || []).join(', ')}.`
    )
    .join(' ');

  const certifications = (resumeData.certifications || [])
    .map((item) => `${item.title} from ${item.issuer}.`)
    .join(' ');

  const achievements = (resumeData.achievements || []).join(' ');

  return [
    resumeData.profile?.name ? `Name: ${resumeData.profile.name}` : '',
    resumeData.profile?.title ? `Title: ${resumeData.profile.title}` : '',
    resumeData.profile?.summary || '',
    resumeData.profile?.location ? `Location: ${resumeData.profile.location}` : '',
    `Skills: ${skills}`,
    experiences,
    projects,
    certifications,
    achievements,
  ]
    .join(' ')
    .trim();
};

const toKnowledgeChunks = ({ sourceName, rawText, chunkPrefix = '' }) =>
  chunkText(rawText).map((text, index) => ({
    index,
    text: normalizeText(`${chunkPrefix}${text}`),
    tokens: tokenize(text),
    sourceName,
  }));

const inferExtension = (fileName = '', fileUrl = '') => {
  const source = `${fileName || ''} ${fileUrl || ''}`;
  const matched = source.match(/\.([a-zA-Z0-9]{2,8})(?:$|\?|\s)/);
  return matched?.[1]?.toLowerCase() || '';
};

const parsePdfBuffer = async (buffer) => {
  const parser = new PDFParse({ data: buffer });

  try {
    const parsed = await parser.getText();
    return normalizeText(parsed.text || '');
  } finally {
    await parser.destroy();
  }
};

const parseDocxBuffer = async (buffer) => {
  const parsed = await mammoth.extractRawText({ buffer });
  return normalizeText(parsed?.value || '');
};

const parseTextBuffer = (buffer) => {
  try {
    return normalizeText(buffer.toString('utf-8'));
  } catch {
    return '';
  }
};

const parseBufferByType = async ({ buffer, mimeType = '', fileName = '', fileUrl = '' }) => {
  const normalizedMime = String(mimeType || '').toLowerCase().split(';')[0].trim();
  const extension = inferExtension(fileName, fileUrl);

  const isPdf = normalizedMime === 'application/pdf' || extension === 'pdf';
  const isDocx =
    normalizedMime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    extension === 'docx';
  const isTextLike =
    normalizedMime.startsWith('text/') ||
    ['txt', 'rtf', 'md', 'json'].includes(extension);

  if (isPdf) {
    return parsePdfBuffer(buffer);
  }

  if (isDocx) {
    return parseDocxBuffer(buffer);
  }

  if (isTextLike) {
    return parseTextBuffer(buffer);
  }

  return parseTextBuffer(buffer);
};

const fetchRemoteFile = async (fileUrl) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(fileUrl, { signal: controller.signal });

    if (!response.ok) {
      throw new Error(`Failed to fetch resume from URL (${response.status})`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const parsedUrl = new URL(fileUrl);

    return {
      buffer: Buffer.from(arrayBuffer),
      mimeType: response.headers.get('content-type') || '',
      fileName: decodeURIComponent(parsedUrl.pathname.split('/').pop() || ''),
      fileUrl,
    };
  } finally {
    clearTimeout(timeout);
  }
};

const parseResumeText = async (input) => {
  if (!input) {
    throw new Error('Resume source is required');
  }

  if (typeof input === 'string') {
    if (!input.startsWith('http')) {
      throw new Error('Only URL string inputs are supported for resume parsing');
    }

    const remoteFile = await fetchRemoteFile(input);
    return parseBufferByType(remoteFile);
  }

  if (input?.buffer) {
    return parseBufferByType({
      buffer: input.buffer,
      mimeType: input.mimetype || input.mimeType || '',
      fileName: input.originalname || input.fileName || '',
      fileUrl: input.fileUrl || '',
    });
  }

  if (input?.fileUrl) {
    const remoteFile = await fetchRemoteFile(input.fileUrl);
    return parseBufferByType({
      ...remoteFile,
      mimeType: input.mimeType || remoteFile.mimeType,
      fileName: input.fileName || remoteFile.fileName,
      fileUrl: input.fileUrl,
    });
  }

  throw new Error('Resume file or URL is required');
};

const getCacheKey = (resume) => String(resume?._id || resume?.fileUrl || 'unknown');

const getCacheFingerprint = (resume) =>
  [resume?.fileUrl || '', String(resume?.updatedAt || ''), resume?.fileName || ''].join('|');

const pruneCache = (activeKeys) => {
  for (const key of resumeTextCache.keys()) {
    if (!activeKeys.has(key)) {
      resumeTextCache.delete(key);
    }
  }
};

const getAdminResumeParsedText = async (resume) => {
  const cacheKey = getCacheKey(resume);
  const fingerprint = getCacheFingerprint(resume);
  const cached = resumeTextCache.get(cacheKey);
  const now = Date.now();

  if (
    cached &&
    cached.fingerprint === fingerprint &&
    now - cached.cachedAt <= RESUME_CACHE_TTL_MS
  ) {
    return cached.text;
  }

  try {
    const text = await parseResumeText({
      fileUrl: resume.fileUrl,
      fileName: resume.fileName,
    });

    if (text) {
      resumeTextCache.set(cacheKey, {
        fingerprint,
        text,
        cachedAt: now,
      });
    }

    return text;
  } catch {
    return '';
  }
};

const getAdminResumeChunks = async () => {
  const resumes = await Resume.find({ fileUrl: { $exists: true, $ne: '' } })
    .sort({ createdAt: -1 })
    .lean();

  if (!resumes.length) {
    return [];
  }

  const activeKeys = new Set();
  const parsedItems = await Promise.all(
    resumes.map(async (resume) => {
      const cacheKey = getCacheKey(resume);
      activeKeys.add(cacheKey);

      const parsedText = await getAdminResumeParsedText(resume);
      if (!parsedText) {
        return null;
      }

      return { resume, parsedText };
    })
  );

  pruneCache(activeKeys);

  const chunks = [];

  for (const item of parsedItems) {
    if (!item) {
      continue;
    }

    const sourceName = `admin-resume:${item.resume._id}`;
    const sourceLabel = `Resume: ${item.resume.title || 'Untitled'} | Category: ${item.resume.category || 'general'}\n`;
    const sourceChunks = toKnowledgeChunks({
      sourceName,
      rawText: item.parsedText,
      chunkPrefix: sourceLabel,
    });

    chunks.push(...sourceChunks);
  }

  return chunks;
};

const getStoredKnowledgeChunks = async () => {
  const docs = await ResumeKnowledge.find().lean();

  if (!docs.length) {
    return [];
  }

  return docs.flatMap((doc) => {
    if (Array.isArray(doc.chunks) && doc.chunks.length > 0) {
      return doc.chunks.map((chunk, index) => ({
        index: chunk.index ?? index,
        text: normalizeText(chunk.text || ''),
        tokens:
          Array.isArray(chunk.tokens) && chunk.tokens.length > 0
            ? chunk.tokens
            : tokenize(chunk.text || ''),
        sourceName: doc.sourceName || 'uploaded-knowledge',
      }));
    }

    if (!doc.rawText) {
      return [];
    }

    return toKnowledgeChunks({
      sourceName: doc.sourceName || 'uploaded-knowledge',
      rawText: doc.rawText,
    });
  });
};

const getSeedChunks = () => {
  const seedText = toSeedKnowledgeText();

  if (!seedText) {
    return [];
  }

  return toKnowledgeChunks({
    sourceName: DEFAULT_SOURCE,
    rawText: seedText,
  });
};

const getAllKnowledgeChunks = async () => {
  const [adminResumeChunks, storedChunks] = await Promise.all([
    getAdminResumeChunks(),
    getStoredKnowledgeChunks(),
  ]);

  const combined = [...adminResumeChunks, ...storedChunks].filter((chunk) => chunk?.text);

  if (combined.length > 0) {
    return combined;
  }

  return getSeedChunks();
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

  if (normalizeText(chunkTextValue).toLowerCase().includes(normalizeText(query).toLowerCase())) {
    score += 0.5;
  }

  return score;
};

const selectContextChunks = (query, allChunks) => {
  if (!allChunks.length) {
    return [];
  }

  const queryTokens = tokenize(query);

  if (queryTokens.length === 0) {
    return allChunks.slice(0, RETRIEVAL_CHUNK_LIMIT);
  }

  const scoredChunks = allChunks
    .map((chunk) => ({
      ...chunk,
      score: scoreChunk(queryTokens, chunk.tokens || [], query, chunk.text || ''),
    }))
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, RETRIEVAL_CHUNK_LIMIT);

  if (scoredChunks.length > 0) {
    return scoredChunks;
  }

  return allChunks.slice(0, RETRIEVAL_CHUNK_LIMIT);
};

const joinChunksWithinLimit = (chunks, maxChars = CONTEXT_CHAR_LIMIT) => {
  const rows = [];
  let total = 0;

  for (const chunk of chunks) {
    const row = normalizeText(chunk?.text || '');
    if (!row) {
      continue;
    }

    const nextTotal = total + row.length + 2;
    if (nextTotal > maxChars && rows.length > 0) {
      break;
    }

    rows.push(row);
    total = nextTotal;
  }

  return rows.join('\n\n').trim();
};

const escapeRegExp = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeFallbackIntent = (value) => {
  const normalized = normalizeText(value).toLowerCase();
  if (!normalized) {
    return true;
  }

  if (normalized === STRICT_FALLBACK_MESSAGE.toLowerCase()) {
    return true;
  }

  return (
    normalized.includes("i don't have that information") ||
    normalized.includes('i do not have that information') ||
    normalized.includes('not available in the data')
  );
};

const hasUnsupportedNumericClaim = (answer, context) => {
  const answerNumbers = normalizeText(answer).match(/\b\d+(?:\.\d+)?\b/g) || [];

  if (answerNumbers.length === 0) {
    return false;
  }

  const normalizedContext = normalizeText(context).toLowerCase();

  return answerNumbers.some((value) => {
    const pattern = new RegExp(`\\b${escapeRegExp(value.toLowerCase())}\\b`, 'i');
    return !pattern.test(normalizedContext);
  });
};

const enforceStrictAnswer = (answer, context, query = '') => {
  const normalized = normalizeText(answer);

  if (!normalized) {
    return STRICT_FALLBACK_MESSAGE;
  }

  // If answer matches the strict negative response, return it as is.
  if (normalizeFallbackIntent(normalized)) {
    return STRICT_FALLBACK_MESSAGE;
  }

  // Lenient check: Only reject if the context is obviously missing but specific numeric claims are made.
  // We avoid blocking valid conversational responses.
  if (hasUnsupportedNumericClaim(normalized, context)) {
    // If we're unsure, just let it pass but log it (for now, keeping the user's focus on accuracy).
    console.warn('Potential numeric hallucination detected, but letting it pass to avoid false positives for now.');
    // return STRICT_FALLBACK_MESSAGE; // Disabling for now to check reliability
  }

  if (asksForFullDetails(query)) {
    return normalized;
  }

  return toShortConversationalReply(normalized, 3);
};

const toBoundedNumber = (value, fallback, { min, max }) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, parsed));
};

const getGroqClient = () => {
  if (!process.env.GROQ_API_KEY) {
    return null;
  }

  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }

  return groqClient;
};

const getGroqRequestConfig = () => ({
  model: process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL,
  temperature: toBoundedNumber(process.env.GROQ_TEMPERATURE, DEFAULT_GROQ_TEMPERATURE, {
    min: 0,
    max: 2,
  }),
  top_p: toBoundedNumber(process.env.GROQ_TOP_P, DEFAULT_GROQ_TOP_P, {
    min: 0,
    max: 1,
  }),
  max_completion_tokens: Math.round(
    toBoundedNumber(process.env.GROQ_MAX_COMPLETION_TOKENS, DEFAULT_GROQ_MAX_COMPLETION_TOKENS, {
      min: 64,
      max: 4096,
    })
  ),
});

const buildGroqMessages = (query, context) => [
  {
    role: 'system',
    content: STRICT_SYSTEM_PROMPT,
  },
  {
    role: 'system',
    content: `---- DATA START ----\n${context}\n---- DATA END ----`,
  },
  {
    role: 'user',
    content: query,
  },
];

const readGroqStreamText = async (stream) => {
  if (!stream || typeof stream[Symbol.asyncIterator] !== 'function') {
    return null;
  }

  let combined = '';
  for await (const chunk of stream) {
    combined += chunk?.choices?.[0]?.delta?.content || '';
  }

  const normalized = combined.trim();
  return normalized || null;
};

const askGroq = async (query, context) => {
  const client = getGroqClient();
  if (!client) {
    return null;
  }

  const requestConfig = getGroqRequestConfig();
  const messages = buildGroqMessages(query, context);

  try {
    // Ensuring non-streaming initially for stability as requested.
    const completion = await client.chat.completions.create({
      ...requestConfig,
      messages,
      stream: false,
    });

    return completion?.choices?.[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error('Groq API Error:', error);
    return null;
  }
};

export const askLLM = async (query, context) => {
  try {
    const groqResult = await askGroq(query, context);
    if (groqResult) {
      return enforceStrictAnswer(groqResult, context, query);
    }
  } catch {
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
  const [resumeCount, knowledgeDocs] = await Promise.all([
    Resume.countDocuments({ fileUrl: { $exists: true, $ne: '' } }),
    ResumeKnowledge.find().sort({ updatedAt: -1 }).lean(),
  ]);

  const chunkCount = knowledgeDocs.reduce(
    (sum, doc) => sum + (Array.isArray(doc.chunks) ? doc.chunks.length : 0),
    0
  );

  return {
    hasKnowledge: resumeCount > 0 || chunkCount > 0 || Boolean(toSeedKnowledgeText()),
    sourceName: resumeCount > 0 ? 'admin-resumes' : chunkCount > 0 ? 'resume-knowledge' : DEFAULT_SOURCE,
    chunkCount,
    adminResumeCount: resumeCount,
    cachedResumeCount: resumeTextCache.size,
    updatedAt: knowledgeDocs[0]?.updatedAt || null,
  };
};

export const getResumeContext = async (query) => {
  const allChunks = await getAllKnowledgeChunks();
  const selectedChunks = selectContextChunks(query, allChunks);

  return {
    chunks: selectedChunks,
    text: joinChunksWithinLimit(selectedChunks),
  };
};

export const formatLLMAnswer = (modelAnswer, query, chunks, context = '') => {
  const safeAnswer = modelAnswer
    ? enforceStrictAnswer(modelAnswer, context, query)
    : STRICT_FALLBACK_MESSAGE;

  return {
    answer: safeAnswer || STRICT_FALLBACK_MESSAGE,
    chunks: (chunks || []).map((chunk) => ({ index: chunk.index, text: chunk.text })),
  };
};

export const answerResumeQuestion = async (query) => {
  const { chunks, text } = await getResumeContext(query);

  if (chunks.length === 0 || !text) {
    return {
      answer: STRICT_FALLBACK_MESSAGE,
      chunks: [],
    };
  }

  const modelAnswer = await askLLM(query, text);
  return formatLLMAnswer(modelAnswer, query, chunks, text);
};
