import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const databaseUrl = process.env.DATABASE_URL;
const directDatabaseUrl = process.env.DIRECT_URL ?? databaseUrl;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  ...(directDatabaseUrl
    ? {
        datasource: {
          url: directDatabaseUrl,
        },
      }
    : {}),
});
