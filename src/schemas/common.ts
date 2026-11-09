import { z } from './zod';

export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'ObjectId invalide (24 caractères hexadécimaux attendus)')
  .openapi({ example: '6730f1a2b3c4d5e6f7a8b9c0' });

export const idParamsSchema = z.object({ id: objectIdSchema });

/** Date reçue en ISO 8601 avec fuseau, convertie en Date. */
export const dateInputSchema = z
  .string()
  .datetime({ offset: true, message: 'Date ISO 8601 avec fuseau attendue' })
  .transform((value) => new Date(value))
  .openapi({ type: 'string', format: 'date-time', example: '2026-11-16T08:00:00Z' });

/** Date renvoyée par l'API. */
export const dateOutputSchema = z
  .string()
  .datetime()
  .openapi({ type: 'string', format: 'date-time', example: '2026-11-16T08:00:00.000Z' });

export const connectorTypeSchema = z.enum(['TYPE2', 'CCS', 'CHADEMO']);

export const periodQueryBaseSchema = z.object({
  from: dateInputSchema,
  to: dateInputSchema,
});

export const periodQuerySchema = periodQueryBaseSchema.refine((period) => period.from < period.to, {
  path: ['to'],
  message: 'from doit être strictement antérieur à to',
});

export const errorResponseSchema = z
  .object({
    error: z.object({
      code: z.string(),
      message: z.string(),
      issues: z
        .array(
          z.object({
            path: z.array(z.union([z.string(), z.number()])),
            message: z.string(),
            code: z.string(),
          }),
        )
        .optional(),
    }),
  })
  .openapi('Error');
