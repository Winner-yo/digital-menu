import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/response';

export const validate =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (!result.success) {
        const errors: Record<string, string[]> = {};
        result.error.errors.forEach((e) => {
          const key = e.path.join('.');
          if (!errors[key]) errors[key] = [];
          errors[key].push(e.message);
        });
        sendError(res, 'Validation failed', 422, errors);
        return;
      }

      // Attach validated data
      req.body = result.data.body ?? req.body;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        sendError(res, 'Validation failed', 422);
        return;
      }
      next(err);
    }
  };
