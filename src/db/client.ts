import { MongoClient, type ObjectId } from 'mongodb';
import { config } from '../config';

export type ConnectorType = 'TYPE2' | 'CCS' | 'CHADEMO';
export type ReservationStatus = 'confirmed' | 'cancelled';

export interface StationDoc {
  code: string;
  name: string;
  address: string;
  city: string;
  connectorType: ConnectorType;
  powerKw: number;
  inService: boolean;
  createdAt: Date;
}

export interface ReservationDoc {
  stationId: ObjectId;
  driverName: string;
  vehiclePlate: string;
  vehicleConnectorType: ConnectorType;
  requestedEnergyKwh: number;
  start: Date;
  end: Date;
  status: ReservationStatus;
  createdAt: Date;
  cancelledAt: Date | null;
}

const client = new MongoClient(config.MONGO_URL);
const db = client.db(config.MONGO_DB);

export const stations = db.collection<StationDoc>('stations');
export const reservations = db.collection<ReservationDoc>('reservations');

export async function connectDb(): Promise<void> {
  await client.connect();
  await Promise.all([
    stations.createIndex({ code: 1 }, { unique: true, name: 'code_unique' }),
    stations.createIndex({ city: 1, connectorType: 1 }, { name: 'city_connector' }),
    reservations.createIndex({ stationId: 1, start: 1, _id: 1 }, { name: 'station_start' }),
    reservations.createIndex({ start: 1, _id: 1 }, { name: 'start' }),
  ]);
}

export async function closeDb(): Promise<void> {
  await client.close();
}
