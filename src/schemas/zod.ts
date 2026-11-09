import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// Point d'entrée unique : garantit que .openapi() existe avant tout schéma.
extendZodWithOpenApi(z);

export { z };
