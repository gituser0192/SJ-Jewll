import {defineConfig} from 'drizzle-kit';
export default defineConfig({out:'./drizzle-postgres',schema:'./db/schema.ts',dialect:'postgresql',schemaFilter:['sheochand'],dbCredentials:{url:process.env.DATABASE_URL_UNPOOLED??''}});
