import { MongoServerError, ObjectId, type Filter, type WithId } from 'mongodb';
import { stations, type StationDoc } from '../db/client';
import { ConflictError, NotFoundError } from '../errors';
import type { CreateStation, Station, StationQuery, UpdateStation } from '../schemas/station';

function toStation({ _id, createdAt, ...fields }: WithId<StationDoc>): Station {
  return { id: _id.toHexString(), ...fields, createdAt: createdAt.toISOString() };
}

function isDuplicateKey(err: unknown): boolean {
  return err instanceof MongoServerError && err.code === 11000;
}

function duplicateCode(code: string | undefined): ConflictError {
  return new ConflictError(`Une borne utilise déjà le code ${code ?? 'demandé'}`);
}

export async function listStations(query: StationQuery): Promise<Station[]> {
  const filter: Filter<StationDoc> = {};
  if (query.city !== undefined) filter.city = query.city;
  if (query.connectorType !== undefined) filter.connectorType = query.connectorType;
  if (query.inService !== undefined) filter.inService = query.inService;
  if (query.minPowerKw !== undefined) filter.powerKw = { $gte: query.minPowerKw };
  const docs = await stations.find(filter).sort({ code: 1 }).toArray();
  return docs.map(toStation);
}

export async function getStation(id: string): Promise<Station> {
  const doc = await stations.findOne({ _id: new ObjectId(id) });
  if (!doc) throw new NotFoundError(`Borne ${id} introuvable`);
  return toStation(doc);
}

export async function createStation(body: CreateStation): Promise<Station> {
  const doc: StationDoc = { ...body, createdAt: new Date() };
  try {
    const { insertedId } = await stations.insertOne(doc);
    return toStation({ ...doc, _id: insertedId });
  } catch (err) {
    if (isDuplicateKey(err)) throw duplicateCode(body.code);
    throw err;
  }
}

export async function updateStation(id: string, body: UpdateStation): Promise<Station> {
  try {
    const doc = await stations.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: body },
      { returnDocument: 'after' },
    );
    if (!doc) throw new NotFoundError(`Borne ${id} introuvable`);
    return toStation(doc);
  } catch (err) {
    if (isDuplicateKey(err)) throw duplicateCode(body.code);
    throw err;
  }
}
