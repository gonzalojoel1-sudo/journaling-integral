import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Forzamos a la terminal a buscar y leer físicamente el archivo .env de la raíz
dotenv.config({
  path: '.env'
});

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'turso', // Cambiado a 'turso' para que inicialice el protocolo de seguridad de internet de forma nativa
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN!,
  },
});
