import { ObjectId, type Filter, type WithId } from 'mongodb';
import { reservations, type ReservationDoc } from '../db/client';
import { ConflictError, NotFoundError } from '../errors';
import type {
  CreateReservation,
  Reservation,
  ReservationPage,
  ReservationQuery,
} from '../schemas/reservation';
import { getStation } from './stations';

function toReservation(doc: WithId<ReservationDoc>): Reservation {
  return {
    id: doc._id.toHexString(),
    stationId: doc.stationId.toHexString(),
    driverName: doc.driverName,
    vehiclePlate: doc.vehiclePlate,
    vehicleConnectorType: doc.vehicleConnectorType,
    requestedEnergyKwh: doc.requestedEnergyKwh,
    start: doc.start.toISOString(),
    end: doc.end.toISOString(),
    status: doc.status,
    createdAt: doc.createdAt.toISOString(),
    cancelledAt: doc.cancelledAt?.toISOString() ?? null,
  };
}

export async function listStationReservations(
  stationId: string,
  period: { from: Date; to: Date },
): Promise<Reservation[]> {
  await getStation(stationId);
  const docs = await reservations
    .find({ stationId: new ObjectId(stationId), start: { $gte: period.from, $lt: period.to } })
    .sort({ start: 1, _id: 1 })
    .toArray();
  return docs.map(toReservation);
}

export async function createReservation(
  stationId: string,
  body: CreateReservation,
): Promise<Reservation> {
  await getStation(stationId);
  const doc: ReservationDoc = {
    ...body,
    stationId: new ObjectId(stationId),
    status: 'confirmed',
    createdAt: new Date(),
    cancelledAt: null,
  };
  const { insertedId } = await reservations.insertOne(doc);
  return toReservation({ ...doc, _id: insertedId });
}

export async function listReservations(query: ReservationQuery): Promise<ReservationPage> {
  const filter: Filter<ReservationDoc> = {};
  if (query.stationId !== undefined) filter.stationId = new ObjectId(query.stationId);
  if (query.status !== undefined) filter.status = query.status;
  const [docs, total] = await Promise.all([
    reservations.find(filter).sort({ start: 1, _id: 1 }).skip(query.offset).limit(query.limit).toArray(),
    reservations.countDocuments(filter),
  ]);
  return { items: docs.map(toReservation), total, limit: query.limit, offset: query.offset };
}

export async function getReservation(id: string): Promise<Reservation> {
  const doc = await reservations.findOne({ _id: new ObjectId(id) });
  if (!doc) throw new NotFoundError(`Réservation ${id} introuvable`);
  return toReservation(doc);
}

export async function cancelReservation(id: string): Promise<Reservation> {
  const _id = new ObjectId(id);
  // Le filtre sur status rend l'annulation atomique : une seule requête concurrente gagne.
  const doc = await reservations.findOneAndUpdate(
    { _id, status: 'confirmed' },
    { $set: { status: 'cancelled', cancelledAt: new Date() } },
    { returnDocument: 'after' },
  );
  if (doc) return toReservation(doc);
  await getReservation(id);
  throw new ConflictError(`La réservation ${id} est déjà annulée`);
}
