// Jeu de démonstration, relançable : vide les collections puis réinsère.
// Usage : docker compose exec mongo mongosh bornes /scripts/seed.js
db.reservations.deleteMany({});
db.stations.deleteMany({});

const createdAt = ISODate("2026-11-01T09:00:00Z");

const stations = [
  { code: "PAR-001", name: "Parking Bercy", address: "12 rue de Bercy", city: "Paris", connectorType: "TYPE2", powerKw: 22, inService: true, createdAt },
  { code: "PAR-002", name: "Gare de Lyon rapide", address: "20 boulevard Diderot", city: "Paris", connectorType: "CCS", powerKw: 150, inService: true, createdAt },
  { code: "LYO-001", name: "Part-Dieu", address: "5 place Béraudier", city: "Lyon", connectorType: "CCS", powerKw: 50, inService: true, createdAt },
  { code: "NEV-001", name: "Centre-ville Nevers", address: "1 place Carnot", city: "Nevers", connectorType: "CHADEMO", powerKw: 50, inService: false, createdAt },
].map((station) => ({ _id: new ObjectId(), ...station }));

db.stations.insertMany(stations);

const reservation = (station, driverName, vehiclePlate, requestedEnergyKwh, start, end, cancelled) => ({
  stationId: station._id,
  driverName,
  vehiclePlate,
  vehicleConnectorType: station.connectorType,
  requestedEnergyKwh,
  start: ISODate(start),
  end: ISODate(end),
  status: cancelled ? "cancelled" : "confirmed",
  createdAt,
  cancelledAt: cancelled ? ISODate("2026-11-02T10:00:00Z") : null,
});

const [bercy, lyonGare, partDieu, nevers] = stations;

db.reservations.insertMany([
  reservation(bercy, "Alice Martin", "AA-123-AA", 30, "2026-11-16T08:00:00Z", "2026-11-16T10:00:00Z"),
  reservation(bercy, "Bilal Haddad", "BB-234-BB", 20, "2026-11-16T10:30:00Z", "2026-11-16T11:30:00Z"),
  reservation(bercy, "Chloé Petit", "CC-345-CC", 40, "2026-11-17T14:00:00Z", "2026-11-17T16:00:00Z"),
  reservation(lyonGare, "David Nguyen", "DD-456-DD", 45, "2026-11-16T09:00:00Z", "2026-11-16T09:30:00Z"),
  reservation(lyonGare, "Emma Leroy", "EE-567-EE", 60, "2026-11-16T09:15:00Z", "2026-11-16T09:45:00Z"), // chevauchement toléré au sprint 1
  reservation(lyonGare, "Farid Benali", "FF-678-FF", 35, "2026-11-18T18:00:00Z", "2026-11-18T18:30:00Z", true),
  reservation(partDieu, "Gaëlle Morel", "GG-789-GG", 25, "2026-11-16T12:00:00Z", "2026-11-16T13:00:00Z"),
  reservation(partDieu, "Hugo Roux", "HH-890-HH", 30, "2026-11-17T07:30:00Z", "2026-11-17T08:30:00Z"),
  reservation(partDieu, "Inès Faure", "II-901-II", 15, "2026-11-19T17:00:00Z", "2026-11-19T17:30:00Z"),
  reservation(nevers, "Jules Blanc", "JJ-012-JJ", 20, "2026-11-20T11:00:00Z", "2026-11-20T12:00:00Z", true),
]);

print(`Données chargées : ${db.stations.countDocuments()} bornes, ${db.reservations.countDocuments()} réservations`);
