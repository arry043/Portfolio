const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
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

const toValidDate = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const formatMonthYear = (value, fallback = 'Date not specified') => {
  const parsed = toValidDate(value);
  if (!parsed) {
    return fallback;
  }

  return `${MONTH_LABELS[parsed.getUTCMonth()]} ${parsed.getUTCFullYear()}`;
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

  const monthIndex = MONTH_INDEX_BY_NAME[match[1].toLowerCase()];
  const year = Number.parseInt(match[2], 10);

  if (monthIndex === undefined || Number.isNaN(year)) {
    return null;
  }

  return new Date(Date.UTC(year, monthIndex, 1));
};

export const formatExperiencePeriod = (
  { dateRange = '', startDate, endDate, isCurrentlyWorking = false, period = '', duration = '' } = {},
  fallback = 'Date not specified'
) => {
  const normalizedDateRange = String(dateRange || '').trim();
  if (normalizedDateRange) {
    return normalizedDateRange;
  }

  const legacyPeriod = String(period || duration || '').trim();
  const startLabel = formatMonthYear(startDate, '');

  if (!startLabel) {
    return legacyPeriod || fallback;
  }

  if (isCurrentlyWorking) {
    return `${startLabel} - Present`;
  }

  const endLabel = formatMonthYear(endDate, '');
  if (endLabel) {
    return `${startLabel} - ${endLabel}`;
  }

  return legacyPeriod || `${startLabel} - Date not specified`;
};
