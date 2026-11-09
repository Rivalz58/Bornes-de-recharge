import { createApp } from './app';
import { config } from './config';
import { closeDb, connectDb } from './db/client';

async function main(): Promise<void> {
  await connectDb();
  const server = createApp().listen(config.PORT, () => {
    console.log(`API à l'écoute sur le port ${config.PORT}`);
  });

  const shutdown = () => {
    server.close(() => {
      void closeDb().finally(() => process.exit(0));
    });
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  console.error('Démarrage impossible', err);
  process.exit(1);
});
