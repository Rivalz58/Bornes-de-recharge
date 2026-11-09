import { connectorTypeSchema, dateOutputSchema, objectIdSchema } from './common';
import { z } from './zod';

const stationBodySchema = z
  .object({
    code: z.string().trim().min(1).max(32).openapi({ example: 'PAR-003' }),
    name: z.string().trim().min(1).max(120).openapi({ example: 'Parking République' }),
    address: z.string().trim().min(1).max(200).openapi({ example: '3 place de la République' }),
    city: z.string().trim().min(1).max(120).openapi({ example: 'Paris' }),
    connectorType: connectorTypeSchema,
    powerKw: z.number().positive().max(1000).openapi({ example: 22 }),
    inService: z.boolean().default(true),
  })
  .strict();

export const createStationSchema = stationBodySchema.openapi('CreateStation');

export const updateStationSchema = stationBodySchema
  .partial()
  .refine((body) => Object.keys(body).length > 0, { message: 'Au moins un champ est requis' })
  .openapi('UpdateStation');

export const stationQuerySchema = z.object({
  city: z.string().trim().min(1).optional(),
  connectorType: connectorTypeSchema.optional(),
  minPowerKw: z.coerce.number().min(0).optional(),
  inService: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional()
    .openapi({ type: 'string', enum: ['true', 'false'] }),
});

export const stationSchema = z
  .object({
    id: objectIdSchema,
    code: z.string(),
    name: z.string(),
    address: z.string(),
    city: z.string(),
    connectorType: connectorTypeSchema,
    powerKw: z.number(),
    inService: z.boolean(),
    createdAt: dateOutputSchema,
  })
  .openapi('Station');

export type CreateStation = z.output<typeof createStationSchema>;
export type UpdateStation = z.output<typeof updateStationSchema>;
export type StationQuery = z.output<typeof stationQuerySchema>;
export type Station = z.output<typeof stationSchema>;
