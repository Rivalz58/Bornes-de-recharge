import {
  OpenAPIRegistry,
  OpenApiGeneratorV31,
  type RouteConfig,
} from '@asteasolutions/zod-to-openapi';
import type { ZodTypeAny } from 'zod';
import { errorResponseSchema, idParamsSchema, periodQueryBaseSchema } from './schemas/common';
import {
  createReservationSchema,
  reservationPageSchema,
  reservationQuerySchema,
  reservationSchema,
} from './schemas/reservation';
import {
  createStationSchema,
  stationQuerySchema,
  stationSchema,
  updateStationSchema,
} from './schemas/station';
import { stationUsageSchema, statsQueryBaseSchema } from './schemas/stats';
import { z } from './schemas/zod';

const registry = new OpenAPIRegistry();

const json = (description: string, schema: ZodTypeAny) => ({
  description,
  content: { 'application/json': { schema } },
});

const body = (schema: ZodTypeAny) => ({
  required: true,
  content: { 'application/json': { schema } },
});

const error = (description: string) => json(description, errorResponseSchema);

const invalid = error('Requête invalide : le détail est dans error.issues');
const internal = error('Erreur interne, sans détail');
const stationNotFound = error('Borne inconnue');
const reservationNotFound = error('Réservation inconnue');

const paths: RouteConfig[] = [
  {
    method: 'get',
    path: '/stations',
    tags: ['Bornes'],
    summary: 'Lister les bornes, triées par code',
    request: { query: stationQuerySchema },
    responses: {
      200: json('Les bornes correspondant aux filtres', z.array(stationSchema)),
      400: invalid,
      500: internal,
    },
  },
  {
    method: 'post',
    path: '/stations',
    tags: ['Bornes'],
    summary: 'Créer une borne',
    request: { body: body(createStationSchema) },
    responses: {
      201: json('Borne créée', stationSchema),
      400: invalid,
      409: error('Code de borne déjà utilisé'),
      500: internal,
    },
  },
  {
    method: 'get',
    path: '/stations/{id}',
    tags: ['Bornes'],
    summary: 'Lire une borne',
    request: { params: idParamsSchema },
    responses: {
      200: json('La borne', stationSchema),
      400: invalid,
      404: stationNotFound,
      500: internal,
    },
  },
  {
    method: 'patch',
    path: '/stations/{id}',
    tags: ['Bornes'],
    summary: 'Modifier partiellement une borne',
    request: { params: idParamsSchema, body: body(updateStationSchema) },
    responses: {
      200: json('La borne modifiée', stationSchema),
      400: invalid,
      404: stationNotFound,
      409: error('Code de borne déjà utilisé'),
      500: internal,
    },
  },
  {
    method: 'get',
    path: '/stations/{id}/reservations',
    tags: ['Réservations'],
    summary: 'Lister les réservations commençant dans la période [from, to[, triées par début',
    request: { params: idParamsSchema, query: periodQueryBaseSchema },
    responses: {
      200: json('Les réservations, annulées comprises', z.array(reservationSchema)),
      400: invalid,
      404: stationNotFound,
      500: internal,
    },
  },
  {
    method: 'post',
    path: '/stations/{id}/reservations',
    tags: ['Réservations'],
    summary: 'Réserver une borne',
    request: { params: idParamsSchema, body: body(createReservationSchema) },
    responses: {
      201: json('Réservation créée', reservationSchema),
      400: invalid,
      404: stationNotFound,
      500: internal,
    },
  },
  {
    method: 'get',
    path: '/reservations',
    tags: ['Réservations'],
    summary: 'Vue globale paginée des réservations, triées par début',
    request: { query: reservationQuerySchema },
    responses: {
      200: json('Une page de réservations', reservationPageSchema),
      400: invalid,
      500: internal,
    },
  },
  {
    method: 'get',
    path: '/reservations/{id}',
    tags: ['Réservations'],
    summary: 'Lire une réservation',
    request: { params: idParamsSchema },
    responses: {
      200: json('La réservation', reservationSchema),
      400: invalid,
      404: reservationNotFound,
      500: internal,
    },
  },
  {
    method: 'delete',
    path: '/reservations/{id}',
    tags: ['Réservations'],
    summary: 'Annuler une réservation (marquée cancelled, conservée en base)',
    request: { params: idParamsSchema },
    responses: {
      200: json('La réservation annulée', reservationSchema),
      400: invalid,
      404: reservationNotFound,
      409: error('Réservation déjà annulée'),
      500: internal,
    },
  },
  {
    method: 'get',
    path: '/stats/usage',
    tags: ['Statistiques'],
    summary: "Usage par borne : réservations confirmées et durées, du plus grand temps d'usage au plus petit",
    request: { query: statsQueryBaseSchema },
    responses: {
      200: json("L'usage des bornes ayant au moins une réservation confirmée", z.array(stationUsageSchema)),
      400: invalid,
      500: internal,
    },
  },
];

paths.forEach((route) => registry.registerPath(route));

export function generateOpenApiDocument() {
  return new OpenApiGeneratorV31(registry.definitions).generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'API Bornes de recharge',
      version: '1.0.0',
      description: 'Réservation de bornes de recharge pour véhicules électriques.',
    },
    servers: [{ url: '/' }],
  });
}
