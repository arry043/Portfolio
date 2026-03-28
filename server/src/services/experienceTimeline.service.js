import { formatMonthYear, normalizeDateValue } from './date.service.js';

const toUtcMonthStart = (value) =>
  new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1));

const countInclusiveMonths = (startDate, endDate) => {
  return (
    (endDate.getUTCFullYear() - startDate.getUTCFullYear()) * 12 +
    (endDate.getUTCMonth() - startDate.getUTCMonth()) +
    1
  );
};

const formatLinkedInDuration = (months) => {
  if (!Number.isFinite(months) || months <= 0) {
    return '—';
  }

  if (months < 12) {
    return months === 1 ? '1 mo' : `${months} mos`;
  }

  if (months === 12) {
    return '1 yr';
  }

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  const yearsLabel = years === 1 ? '1 yr' : `${years} yrs`;

  if (remainingMonths === 0) {
    return yearsLabel;
  }

  const monthsLabel = remainingMonths === 1 ? '1 mo' : `${remainingMonths} mos`;
  return `${yearsLabel} ${monthsLabel}`;
};

export const buildExperienceTimelineMeta = (
  { startDate, endDate, isCurrentlyWorking = false } = {},
  { now = new Date() } = {}
) => {
  const parsedStart = normalizeDateValue(startDate);
  if (!parsedStart) {
    return null;
  }

  const startMonth = toUtcMonthStart(parsedStart);
  const currentMonth = toUtcMonthStart(normalizeDateValue(now) || new Date());

  if (startMonth.getTime() > currentMonth.getTime()) {
    return null;
  }

  const parsedEnd = normalizeDateValue(endDate);
  const isPresent = Boolean(isCurrentlyWorking || !parsedEnd);
  const endMonth = isPresent ? currentMonth : toUtcMonthStart(parsedEnd);

  if (!endMonth || endMonth.getTime() < startMonth.getTime()) {
    return null;
  }

  const totalMonths = countInclusiveMonths(startMonth, endMonth);
  const startLabel = formatMonthYear(startMonth, '');
  const endLabel = isPresent ? 'Present' : formatMonthYear(endMonth, '');
  const dateRange = startLabel && endLabel ? `${startLabel} - ${endLabel}` : '—';

  return {
    isPresent,
    totalMonths,
    duration: formatLinkedInDuration(totalMonths),
    dateRange,
    startSortMs: startMonth.getTime(),
    endSortMs: endMonth.getTime(),
  };
};

const compareTimelineItems = (leftItem, rightItem) => {
  if (leftItem.isPresent !== rightItem.isPresent) {
    return Number(rightItem.isPresent) - Number(leftItem.isPresent);
  }

  if (leftItem.startSortMs !== rightItem.startSortMs) {
    return rightItem.startSortMs - leftItem.startSortMs;
  }

  if (leftItem.endSortMs !== rightItem.endSortMs) {
    return rightItem.endSortMs - leftItem.endSortMs;
  }

  const leftCreatedAt = normalizeDateValue(leftItem.createdAt);
  const rightCreatedAt = normalizeDateValue(rightItem.createdAt);

  return (rightCreatedAt?.getTime() || 0) - (leftCreatedAt?.getTime() || 0);
};

const mapSingleExperience = (item, options) => {
  const normalizedItem = typeof item?.toObject === 'function' ? item.toObject() : item;
  if (!normalizedItem) {
    return null;
  }

  const timelineMeta = buildExperienceTimelineMeta(
    {
      startDate: normalizedItem.startDate,
      endDate: normalizedItem.endDate,
      isCurrentlyWorking: normalizedItem.isCurrentlyWorking,
    },
    options
  );

  if (!timelineMeta) {
    return null;
  }

  return {
    ...normalizedItem,
    duration: timelineMeta.duration,
    dateRange: timelineMeta.dateRange,
    period: timelineMeta.dateRange,
    isPresent: timelineMeta.isPresent,
    startSortMs: timelineMeta.startSortMs,
    endSortMs: timelineMeta.endSortMs,
    isCurrentlyWorking: timelineMeta.isPresent,
  };
};

export const mapTimelineExperiences = (items = [], options = {}) => {
  const mappedItems = items
    .map((item) => mapSingleExperience(item, options))
    .filter(Boolean)
    .sort(compareTimelineItems);

  return mappedItems.map(({ startSortMs, endSortMs, ...item }) => item);
};
