import { rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import logger from '../utils/logger.js';

const GITHUB_API_ROOT = 'https://api.github.com';
const MAX_ATTEMPTS = 3;
const RETRYABLE_STATUS_CODES = new Set([408, 409, 429, 500, 502, 503, 504]);
const serviceDirectory = path.dirname(fileURLToPath(import.meta.url));
const LOCAL_STATIC_RESUME_PATH = path.resolve(serviceDirectory, '../../../client/public/resume.pdf');

class GitHubResumePublishError extends Error {
  constructor(message, { statusCode, cause } = {}) {
    super(message, { cause });
    this.name = 'GitHubResumePublishError';
    this.statusCode = statusCode;
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getGitHubConfig = () => {
  const config = {
    token: process.env.GITHUB_TOKEN,
    owner: process.env.GITHUB_OWNER,
    repo: process.env.GITHUB_REPO,
    branch: process.env.GITHUB_BRANCH,
    filePath: process.env.GITHUB_FILE_PATH,
  };

  const missing = Object.entries(config)
    .filter(([, value]) => !String(value || '').trim())
    .map(([key]) => `GITHUB_${key === 'filePath' ? 'FILE_PATH' : key.toUpperCase()}`);

  if (missing.length > 0) {
    throw new GitHubResumePublishError(
      `GitHub resume publishing is not configured (missing: ${missing.join(', ')})`
    );
  }

  return Object.fromEntries(
    Object.entries(config).map(([key, value]) => [key, String(value).trim()])
  );
};

const buildContentsUrl = ({ owner, repo, filePath }) => {
  const encodedPath = filePath
    .split('/')
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join('/');

  if (!encodedPath) {
    throw new GitHubResumePublishError('GITHUB_FILE_PATH must identify a file');
  }

  return `${GITHUB_API_ROOT}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodedPath}`;
};

const githubHeaders = (token) => ({
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${token}`,
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'portfolio-resume-publisher',
});

const isRetryableError = (error) => error?.name === 'TypeError' || error?.cause?.code === 'ECONNRESET';

const fetchWithRetries = async (url, options, operation) => {
  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, options);
      if (!RETRYABLE_STATUS_CODES.has(response.status) || attempt === MAX_ATTEMPTS) {
        return response;
      }

      const retryAfterSeconds = Number(response.headers.get('retry-after'));
      const delay = Number.isFinite(retryAfterSeconds)
        ? Math.min(retryAfterSeconds * 1000, 10_000)
        : attempt * 500;
      logger.warn('[GITHUB_RESUME] Retrying request', { operation, attempt, statusCode: response.status });
      await sleep(delay);
    } catch (error) {
      lastError = error;
      if (!isRetryableError(error) || attempt === MAX_ATTEMPTS) {
        throw error;
      }

      logger.warn('[GITHUB_RESUME] Retrying request after network error', { operation, attempt });
      await sleep(attempt * 500);
    }
  }

  throw lastError;
};

const getErrorDetail = async (response) => {
  try {
    const body = await response.json();
    return body?.message || '';
  } catch {
    return '';
  }
};

const downloadResumePdf = async (fileUrl) => {
  const response = await fetchWithRetries(fileUrl, { headers: { Accept: 'application/pdf' } }, 'download');
  if (!response.ok) {
    throw new GitHubResumePublishError('Unable to download the default resume for publishing', {
      statusCode: response.status,
    });
  }

  const content = Buffer.from(await response.arrayBuffer());
  if (content.length === 0 || content.subarray(0, 4).toString() !== '%PDF') {
    throw new GitHubResumePublishError('The default resume must be a PDF to publish as /resume.pdf');
  }

  return content;
};

const publishDefaultResumeLocally = async ({ fileUrl, resumeId }) => {
  if (!fileUrl) {
    throw new GitHubResumePublishError('A default resume URL is required for local publishing');
  }

  const content = await downloadResumePdf(fileUrl);
  const temporaryPath = `${LOCAL_STATIC_RESUME_PATH}.${process.pid}.tmp`;

  try {
    await writeFile(temporaryPath, content);
    await rename(temporaryPath, LOCAL_STATIC_RESUME_PATH);
  } catch (error) {
    throw new GitHubResumePublishError('Unable to write the local static resume file', { cause: error });
  }

  logger.info('[GITHUB_RESUME] Local static resume updated', {
    environment: process.env.NODE_ENV || 'development',
    resumeId: String(resumeId || ''),
    filePath: 'client/public/resume.pdf',
  });
  return { published: true, skipped: false, target: 'local' };
};

const getExistingFileSha = async (url, config) => {
  const response = await fetchWithRetries(
    `${url}?ref=${encodeURIComponent(config.branch)}`,
    { headers: githubHeaders(config.token) },
    'get-file-sha'
  );

  if (!response.ok) {
    const detail = await getErrorDetail(response);
    throw new GitHubResumePublishError(`Unable to fetch the existing GitHub file SHA${detail ? `: ${detail}` : ''}`, {
      statusCode: response.status,
    });
  }

  const file = await response.json();
  if (!file?.sha) {
    throw new GitHubResumePublishError('GitHub did not return an SHA for the existing resume file');
  }

  return file.sha;
};

/**
 * Replaces the configured static resume with the current default Cloudinary PDF.
 * Callers should treat failures as non-fatal so the primary resume workflow remains available.
 */
export const publishDefaultResumeToGitHub = async ({ fileUrl, resumeId } = {}) => {
  if (process.env.NODE_ENV !== 'production') {
    return publishDefaultResumeLocally({ fileUrl, resumeId });
  }

  const config = getGitHubConfig();
  if (!fileUrl) {
    throw new GitHubResumePublishError('A default resume URL is required for GitHub publishing');
  }

  const url = buildContentsUrl(config);
  const content = await downloadResumePdf(fileUrl);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const sha = await getExistingFileSha(url, config);
    const response = await fetchWithRetries(
      url,
      {
        method: 'PUT',
        headers: { ...githubHeaders(config.token), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Update default resume',
          content: content.toString('base64'),
          branch: config.branch,
          sha,
        }),
      },
      'update-file'
    );

    if (response.ok) {
      logger.info('[GITHUB_RESUME] Static resume published', {
        resumeId: String(resumeId || ''),
        repository: `${config.owner}/${config.repo}`,
        branch: config.branch,
        filePath: config.filePath,
      });
      return { published: true, skipped: false };
    }

    const detail = await getErrorDetail(response);
    if (response.status === 409 && attempt < MAX_ATTEMPTS) {
      logger.warn('[GITHUB_RESUME] SHA conflict; refetching before retry', { attempt, resumeId: String(resumeId || '') });
      continue;
    }

    throw new GitHubResumePublishError(`Unable to update the static resume on GitHub${detail ? `: ${detail}` : ''}`, {
      statusCode: response.status,
    });
  }
};
