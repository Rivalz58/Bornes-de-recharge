import { Router } from 'express';
import { idParamsSchema } from '../schemas/common';
import { reservationQuerySchema } from '../schemas/reservation';
import { cancelReservation, getReservation, listReservations } from '../services/reservations';

export const reservationsRouter = Router();

reservationsRouter.get('/', async (req, res) => {
  const query = reservationQuerySchema.parse(req.query);
  res.json(await listReservations(query));
});

reservationsRouter.get('/:id', async (req, res) => {
  const { id } = idParamsSchema.parse(req.params);
  res.json(await getReservation(id));
});

reservationsRouter.delete('/:id', async (req, res) => {
  const { id } = idParamsSchema.parse(req.params);
  res.json(await cancelReservation(id));
});
