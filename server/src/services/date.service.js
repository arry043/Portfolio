const SHORT_MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const LEGACY_PROJECT_DATE_PATTERN = /^([A-Za-z]{3,9})-(\d{4})$/;
const MONTH_INDEX_BY_NAME = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

const disallowFutureDates =
  String(process.env.DISALLOW_FUTURE_DATES || '').trim().toLowerCase() === 'true';

const toValidDate = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const normalizeDateValue = (value) => toValidDate(value);

export const isDateInFuture = (value) => {
  const parsed = toValidDate(value);
  if (!parsed) {
    return false;
  }

  return parsed.getTime() > Date.now();
};

export const validateNoFutureDate = (value) => {
  if (!disallowFutureDates) {
    return true;
  }

  return !isDateInFuture(value);
};

export const formatMonthYear = (value, fallback = 'Date not specified') => {
  const parsed = toValidDate(value);
  if (!parsed) {
    return fallback;
  }

  return `${SHORT_MONTH_LABELS[parsed.getUTCMonth()]} ${parsed.getUTCFullYear()}`;
};

export const parseLegacyProjectDate = (value) => {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized === 'ongoing') {
    return null;
  }

  const match = value.trim().match(LEGACY_PROJECT_DATE_PATTERN);
  if (!match) {
    return null;
  }

  const monthName = match[1].toLowerCase();
  const year = Number.parseInt(match[2], 10);
  const monthIndex = MONTH_INDEX_BY_NAME[monthName];

  if (monthIndex === undefined || Number.isNaN(year)) {
    return null;
  }

  return new Date(Date.UTC(year, monthIndex, 1));
};

export const resolveProjectTimelineDate = ({ projectDate, legacyDate } = {}) => {
  const normalizedProjectDate = toValidDate(projectDate);
  if (normalizedProjectDate) {
    return normalizedProjectDate;
  }

  return parseLegacyProjectDate(legacyDate);
};

export const resolveCertificateIssueDate = ({ issueDate, issuedDate } = {}) => {
  if (issueDate === null || issuedDate === null) {
    return null;
  }

  const normalizedIssueDate = toValidDate(issueDate);
  if (normalizedIssueDate) {
    return normalizedIssueDate;
  }

  return toValidDate(issuedDate);
};

export const formatExperiencePeriod = (
  { startDate, endDate, isCurrentlyWorking = false, duration = '' } = {},
  fallback = 'Date not specified'
) => {
  const normalizedDuration = typeof duration === 'string' ? duration.trim() : '';
  const startLabel = formatMonthYear(startDate, '');

  if (!startLabel) {
    return normalizedDuration || fallback;
  }

  if (isCurrentlyWorking) {
    return `${startLabel} - Present`;
  }

  const endLabel = formatMonthYear(endDate, '');
  if (endLabel) {
    return `${startLabel} - ${endLabel}`;
  }

  return normalizedDuration || `${startLabel} - Date not specified`;
};
