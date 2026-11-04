import {neon} from '@neondatabase/serverless';
import {readMigrationFiles} from 'drizzle-orm/migrator';
if(!process.env.DATABASE_URL_UNPOOLED)throw new Error('Load the Neon environment before migrating.');
const sql=neon(process.env.DATABASE_URL_UNPOOLED);
await sql`CREATE SCHEMA IF NOT EXISTS sheochand_migrations`;
await sql`CREATE TABLE IF NOT EXISTS sheochand_migrations.__drizzle_migrations(id serial PRIMARY KEY, hash text NOT NULL, created_at bigint NOT NULL UNIQUE)`;
const applied=await sql`SELECT hash,created_at FROM sheochand_migrations.__drizzle_migrations`;
for(const migration of readMigrationFiles({migrationsFolder:'./drizzle-postgres'})){
 const previous=applied.find(row=>Number(row.created_at)===migration.folderMillis);
 if(previous){if(previous.hash!==migration.hash)throw new Error('An applied migration was modified.');continue;}
 await sql.transaction([...migration.sql.filter(s=>s.trim()).map(text=>sql.query(text)),sql`INSERT INTO sheochand_migrations.__drizzle_migrations(hash,created_at) VALUES(${migration.hash},${migration.folderMillis})`]);
 console.log('Applied Postgres migration:',migration.folderMillis);
}
console.log('PASS: Postgres schema and stock triggers are up to date.');
