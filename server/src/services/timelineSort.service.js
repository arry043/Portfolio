const buildTimelineDateExpression = (dateFields = [], fallbackField = 'createdAt') => {
  const normalizedFields = [...dateFields.filter(Boolean), fallbackField].filter(Boolean);

  if (normalizedFields.length === 0) {
    return '$createdAt';
  }

  return normalizedFields.slice(1).reduce((accumulator, field) => {
    return { $ifNull: [accumulator, `$${field}`] };
  }, `$${normalizedFields[0]}`);
};

export const buildTimelineSortStages = (
  dateFields = [],
  { alias = '__timelineSortDate', fallbackField = 'createdAt' } = {}
) => [
  { $addFields: { [alias]: buildTimelineDateExpression(dateFields, fallbackField) } },
  { $sort: { [alias]: -1, createdAt: -1 } },
];

export const hideTimelineSortFieldStage = (alias = '__timelineSortDate') => ({
  $project: { [alias]: 0 },
});
