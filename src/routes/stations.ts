import { Router } from 'express';
import { idParamsSchema, periodQuerySchema } from '../schemas/common';
import { createReservationSchema } from '../schemas/reservation';
import { createStationSchema, stationQuerySchema, updateStationSchema } from '../schemas/station';
import { createReservation, listStationReservations } from '../services/reservations';
import { createStation, getStation, listStations, updateStation } from '../services/stations';

export const stationsRouter = Router();

stationsRouter.get('/', async (req, res) => {
  const query = stationQuerySchema.parse(req.query);
  res.json(await listStations(query));
});

stationsRouter.post('/', async (req, res) => {
  const body = createStationSchema.parse(req.body);
  res.status(201).json(await createStation(body));
});

stationsRouter.get('/:id', async (req, res) => {
  const { id } = idParamsSchema.parse(req.params);
  res.json(await getStation(id));
});

stationsRouter.patch('/:id', async (req, res) => {
  const { id } = idParamsSchema.parse(req.params);
  const body = updateStationSchema.parse(req.body);
  res.json(await updateStation(id, body));
});

stationsRouter.get('/:id/reservations', async (req, res) => {
  const { id } = idParamsSchema.parse(req.params);
  const period = periodQuerySchema.parse(req.query);
  res.json(await listStationReservations(id, period));
});

stationsRouter.post('/:id/reservations', async (req, res) => {
  const { id } = idParamsSchema.parse(req.params);
  const body = createReservationSchema.parse(req.body);
  res.status(201).json(await createReservation(id, body));
});
