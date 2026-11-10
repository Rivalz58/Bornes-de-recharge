import { Router } from 'express';
import { statsQuerySchema } from '../schemas/stats';
import { getStationUsage } from '../services/stats';

export const statsRouter = Router();

statsRouter.get('/usage', async (req, res) => {
  const query = statsQuerySchema.parse(req.query);
  res.json(await getStationUsage(query));
});
