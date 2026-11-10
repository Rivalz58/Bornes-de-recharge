import { dateInputSchema, objectIdSchema } from './common';
import { z } from './zod';

export const statsQueryBaseSchema = z.object({
  from: dateInputSchema.optional(),
  to: dateInputSchema.optional(),
});

export const statsQuerySchema = statsQueryBaseSchema.refine(
  ({ from, to }) => !from || !to || from < to,
  { path: ['to'], message: 'from doit être strictement antérieur à to' },
);

export const stationUsageSchema = z
  .object({
    stationId: objectIdSchema,
    code: z.string(),
    name: z.string(),
    reservationCount: z.number().int(),
    totalMinutes: z.number(),
    averageMinutes: z.number(),
  })
  .openapi('StationUsage');

export type StatsQuery = z.output<typeof statsQuerySchema>;
export type StationUsage = z.output<typeof stationUsageSchema>;
