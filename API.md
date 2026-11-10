# Contrat de l'API

La référence détaillée est servie par l'API sur `/docs` et `/openapi.json`. Les dates sont en ISO 8601 avec fuseau.

| Route | Rôle | Statuts |
|---|---|---|
| `GET /stations?city&connectorType&minPowerKw&inService` | Lister les bornes | 200, 400 |
| `GET /stations/:id` | Lire une borne | 200, 400, 404 |
| `POST /stations` | Créer une borne | 201, 400, 409 |
| `PATCH /stations/:id` | Modifier partiellement une borne | 200, 400, 404, 409 |
| `GET /stations/:id/reservations?from&to` | Réservations commençant dans `[from, to[`, triées | 200, 400, 404 |
| `POST /stations/:id/reservations` | Réserver une borne | 201, 400, 404 |
| `GET /reservations?stationId&status&limit&offset` | Vue globale paginée, `limit` de 1 à 100 (20 par défaut), `offset` ≥ 0 | 200, 400 |
| `GET /reservations/:id` | Lire une réservation | 200, 400, 404 |
| `DELETE /reservations/:id` | Annuler (état `cancelled`) | 200, 400, 404, 409 |
| `GET /stats/usage?from&to` | Nombre de réservations confirmées et durées, par borne | 200, 400 |

## Format des erreurs

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Requête invalide",
    "issues": [{ "path": ["end"], "message": "start doit être strictement antérieur à end", "code": "custom" }]
  }
}
```

`issues` n'apparaît que sur les erreurs de validation. Un 500 ne donne aucun détail.
