import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Create a PostgreSQL connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:12345@localhost:5432/docscanpro",
});

// Create a Drizzle instance
export const db = drizzle(pool, { schema });

// Export schema for use in other files
export { schema };