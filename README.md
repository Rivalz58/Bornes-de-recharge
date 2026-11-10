# API Bornes de recharge

API REST de réservation de bornes de recharge pour véhicules électriques : Node.js, TypeScript, Express, MongoDB, Zod.

## Prérequis

- Docker avec Docker Compose v2
- Git
- Port 3000 libre (modifiable avec `PORT` dans `.env`)
- Node.js 22 uniquement pour développer hors conteneur

## Commandes

| Action | Commande |
|---|---|
| Préparer la configuration | `cp .env.example .env` |
| Lancer | `docker compose up --build` |
| Arrêter, en conservant les données | `docker compose down` |
| Arrêter et effacer les données | `docker compose down -v` |
| Charger les données de démonstration | `docker compose exec mongo mongosh bornes /scripts/seed.js` |
| Voir les index | `docker compose exec mongo mongosh bornes --eval "printjson(db.stations.getIndexes()); printjson(db.reservations.getIndexes())"` |

Une fois lancée, l'API répond sur <http://localhost:3000> :

- documentation interactive : <http://localhost:3000/docs>
- document OpenAPI : <http://localhost:3000/openapi.json>

Le script de démonstration est relançable : il vide les deux collections puis réinsère 4 bornes et 10 réservations. Il cible la base `bornes`, la valeur de `MONGO_DB` dans `.env.example`.

## Architecture

```text
src/
  index.ts      démarrage et arrêt du serveur
  app.ts        assemblage Express
  config.ts     variables d'environnement validées
  errors.ts     erreurs métier et unique traduction en réponses HTTP
  openapi.ts    document OpenAPI généré depuis les schémas Zod
  routes/       lit la requête, appelle un service, répond
  services/     logique métier, sans dépendance à Express
  db/           connexion, types des documents, index
  schemas/      schémas Zod des entrées et des réponses
scripts/seed.js données de démonstration
```

## Modèle de données

### Deux collections

`stations` décrit les bornes et `reservations` les créneaux réservés. Deux collections plutôt que des réservations imbriquées dans la borne, car :

- les réservations s'accumulent sans limite, alors qu'un document MongoDB est limité à 16 Mo ;
- `GET /reservations` les parcourt et les pagine toutes bornes confondues ;
- ajouter ou annuler une réservation ne réécrit pas le document de la borne.

### `stations`

| Champ | Type | Rôle |
|---|---|---|
| `_id` | ObjectId | Identifiant |
| `code` | string | Code métier unique, par exemple `PAR-001` |
| `name`, `address`, `city` | string | Nom et localisation |
| `connectorType` | string | `TYPE2`, `CCS` ou `CHADEMO` |
| `powerKw` | number | Puissance de la borne |
| `inService` | boolean | Borne en service ou non |
| `createdAt` | Date | Date de création |

### `reservations`

| Champ | Type | Rôle |
|---|---|---|
| `_id` | ObjectId | Identifiant |
| `stationId` | ObjectId | Référence vers `stations._id` |
| `driverName`, `vehiclePlate` | string | Conducteur et véhicule |
| `vehicleConnectorType` | string | Connecteur du véhicule |
| `requestedEnergyKwh` | number | Énergie à charger |
| `start`, `end` | Date | Créneau, avec `start < end` |
| `status` | string | `confirmed` ou `cancelled` |
| `createdAt` | Date | Date de création |
| `cancelledAt` | Date ou null | Date d'annulation |

Les références sont des ObjectId et les dates des Date : `$lookup` et les comparaisons de dates opèrent ainsi sur les types natifs. Les champs `connectorType`, `vehicleConnectorType`, `powerKw`, `requestedEnergyKwh` et `inService` préparent les contraintes de la variante, traitées au sprint 2.

### Index

Ils sont créés au démarrage de l'API, dans `src/db/client.ts`.

| Collection | Index | Requête servie |
|---|---|---|
| `stations` | `{ code: 1 }` unique | Le 409 de `POST` et `PATCH /stations` en cas de doublon ; le tri de `GET /stations` |
| `stations` | `{ city: 1, connectorType: 1 }` | `GET /stations?city=…&connectorType=…` |
| `reservations` | `{ stationId: 1, start: 1, _id: 1 }` | `GET /stations/:id/reservations?from&to` ; `GET /reservations?stationId=…` |
| `reservations` | `{ start: 1, _id: 1 }` | Tri et pagination de `GET /reservations` ; filtre de période de `GET /stats/usage` |

`_id` termine les index de réservations pour que le tri reste stable d'une page à l'autre lorsque deux réservations commencent au même instant.

## Décisions techniques

### Annulation : marquer plutôt que supprimer

- **Contexte** : une réservation annulée peut encore intéresser l'exploitant, pour l'historique et le suivi d'usage des bornes.
- **Choix** : `DELETE /reservations/:id` passe `status` à `cancelled` et renseigne `cancelledAt`. Il répond 200 avec la réservation, puis 409 si elle est déjà annulée, et 404 si elle n'existe pas.
- **Justification** : l'historique est conservé. La mise à jour filtre sur `status: "confirmed"`, donc deux annulations simultanées ne peuvent pas réussir toutes les deux.
- **Conséquence** : chaque requête doit tenir compte du statut. `GET /stats/usage` exclut les annulations, les listes les renvoient (`GET /reservations?status=…` permet de filtrer), et la détection de chevauchement du sprint 2 devra les ignorer. La collection grandit sans purge.

## Limites connues

- Pas d'authentification ni de gestion des droits.
- Deux réservations d'une même borne peuvent se chevaucher : la détection arrive au sprint 2.
- Les contraintes de la variante (compatibilité du connecteur, borne en service, etc.) ne sont pas appliquées.
- Le filtre `city` est sensible à la casse et ne fait qu'une comparaison exacte.
- Un identifiant au format invalide renvoie 400 ; un identifiant valide mais inconnu renvoie 404.
- `GET /stats/usage` n'inclut pas les bornes sans réservation confirmée.
- Pas de suppression de borne ni de purge des réservations annulées.
- Pas de tests automatisés : ils arrivent au sprint 2.
