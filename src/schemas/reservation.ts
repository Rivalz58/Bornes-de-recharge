import { connectorTypeSchema, dateInputSchema, dateOutputSchema, objectIdSchema } from './common';
import { z } from './zod';

const reservationStatusSchema = z.enum(['confirmed', 'cancelled']);

export const createReservationSchema = z
  .object({
    driverName: z.string().trim().min(1).max(120).openapi({ example: 'Alice Martin' }),
    vehiclePlate: z.string().trim().min(1).max(20).openapi({ example: 'AA-123-AA' }),
    vehicleConnectorType: connectorTypeSchema,
    requestedEnergyKwh: z.number().positive().max(500).openapi({ example: 30 }),
    start: dateInputSchema,
    end: dateInputSchema,
  })
  .strict()
  .refine((body) => body.start < body.end, {
    path: ['end'],
    message: 'start doit être strictement antérieur à end',
  })
  .openapi('CreateReservation');

export const reservationQuerySchema = z.object({
  stationId: objectIdSchema.optional(),
  status: reservationStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const reservationSchema = z
  .object({
    id: objectIdSchema,
    stationId: objectIdSchema,
    driverName: z.string(),
    vehiclePlate: z.string(),
    vehicleConnectorType: connectorTypeSchema,
    requestedEnergyKwh: z.number(),
    start: dateOutputSchema,
    end: dateOutputSchema,
    status: reservationStatusSchema,
    createdAt: dateOutputSchema,
    cancelledAt: dateOutputSchema.nullable(),
  })
  .openapi('Reservation');

export const reservationPageSchema = z
  .object({
    items: z.array(reservationSchema),
    total: z.number().int(),
    limit: z.number().int(),
    offset: z.number().int(),
  })
  .openapi('ReservationPage');

export type CreateReservation = z.output<typeof createReservationSchema>;
export type ReservationQuery = z.output<typeof reservationQuerySchema>;
export type Reservation = z.output<typeof reservationSchema>;
export type ReservationPage = z.output<typeof reservationPageSchema>;
