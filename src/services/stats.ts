import type { Document } from 'mongodb';
import { reservations } from '../db/client';
import type { StationUsage, StatsQuery } from '../schemas/stats';

const MS_PER_MINUTE = 60_000;

export async function getStationUsage({ from, to }: StatsQuery): Promise<StationUsage[]> {
  const match: Document = { status: 'confirmed' };
  if (from || to) {
    match.start = { ...(from && { $gte: from }), ...(to && { $lt: to }) };
  }
  return reservations
    .aggregate<StationUsage>([
      { $match: match },
      {
        $group: {
          _id: '$stationId',
          reservationCount: { $sum: 1 },
          totalMs: { $sum: { $subtract: ['$end', '$start'] } },
        },
      },
      { $lookup: { from: 'stations', localField: '_id', foreignField: '_id', as: 'station' } },
      { $unwind: '$station' },
      {
        $project: {
          _id: 0,
          stationId: { $toString: '$_id' },
          code: '$station.code',
          name: '$station.name',
          reservationCount: 1,
          totalMinutes: { $round: [{ $divide: ['$totalMs', MS_PER_MINUTE] }, 1] },
          averageMinutes: {
            $round: [{ $divide: ['$totalMs', { $multiply: ['$reservationCount', MS_PER_MINUTE] }] }, 1],
          },
        },
      },
      { $sort: { totalMinutes: -1, code: 1 } },
    ])
    .toArray();
}
