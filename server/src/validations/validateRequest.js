import { z } from 'zod';

const mapZodIssues = (issues) =>
  issues.map((issue) => ({
    field: issue.path.join('.') || 'root',
    message: issue.message,
  }));

export const validateRequest = (schema) => (req, res, next) => {
  const parsed = schema.safeParse({
    body: req.body ?? {},
    query: req.query ?? {},
    params: req.params ?? {},
  });

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: mapZodIssues(parsed.error.issues),
    });
  }

  req.validated = parsed.data;
  return next();
};

export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, {
  message: 'Invalid resource id',
});
