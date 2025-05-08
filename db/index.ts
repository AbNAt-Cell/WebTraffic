import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from '@shared/schema';
import ws from 'ws';

// This is the correct way neon config - DO NOT change this
neonConfig.webSocketConstructor = ws;

// if (!process.env.DATABASE_URL) {
//   throw new Error(
//     'DATABASE_URL must be set. Did you forget to provision a database?'
//   );
// }

export const pool = new Pool({
  connectionString:
    'postgresql://temp_postgres:temp_postgres@69.62.65.15:5411/temp_postgres',
});
export const db = drizzle({ client: pool, schema });
