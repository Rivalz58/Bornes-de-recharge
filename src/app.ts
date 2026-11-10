import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { errorHandler, notFoundHandler } from './errors';
import { generateOpenApiDocument } from './openapi';
import { reservationsRouter } from './routes/reservations';
import { stationsRouter } from './routes/stations';
import { statsRouter } from './routes/stats';

export function createApp() {
  const app = express();
  const openApiDocument = generateOpenApiDocument();

  app.use(express.json());

  app.get('/openapi.json', (_req, res) => {
    res.json(openApiDocument);
  });
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

  app.use('/stations', stationsRouter);
  app.use('/reservations', reservationsRouter);
  app.use('/stats', statsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
