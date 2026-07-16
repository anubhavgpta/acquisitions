import 'dotenv/config';
import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// Neon Local (used in Docker for development/testing) speaks plain HTTP over
// the local proxy instead of Neon Cloud's HTTPS data API, so the driver
// needs to be pointed at it explicitly. In production this block is skipped
// and the driver talks to Neon Cloud as usual.
if (process.env.NODE_ENV === 'development') {
  const { hostname, port } = new URL(
    process.env.DATABASE_URL.replace('postgres://', 'http://')
  );
  neonConfig.fetchEndpoint = `http://${hostname}:${port || 5432}/sql`;
  neonConfig.useSecureWebSocket = false;
  neonConfig.poolQueryViaFetch = true;
}

const sql = neon(process.env.DATABASE_URL);

const db = drizzle(sql);

export { db, sql };
