import 'server-only';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { getRuntimeEnvErrorMessage, getRuntimeEnvIssues } from '@/lib/runtime-env';

type DbInstance = ReturnType<typeof drizzle>;
type PgClient = ReturnType<typeof postgres>;

let dbInstance: DbInstance | undefined;

const globalForPg = globalThis as unknown as {
  _pgClient?: PgClient;
  _dbClient?: DbInstance;
};

function createDbInstance(): DbInstance {
  const issues = getRuntimeEnvIssues();
  if (issues.length > 0) {
    throw new Error(getRuntimeEnvErrorMessage(issues));
  }

  const connectionString = process.env.DATABASE_URL!;
  const client =
    globalForPg._pgClient ??
    postgres(connectionString, {
      max: 10,
      idle_timeout: 20,
      prepare: !connectionString.includes('pgbouncer=true'),
    });

  if (process.env.NODE_ENV !== 'production') {
    globalForPg._pgClient = client;
  }

  const db = drizzle(client, { schema });
  dbInstance = db;
  if (process.env.NODE_ENV !== 'production') {
    globalForPg._dbClient = db;
  }
  return db;
}

function getDbInstance() {
  return dbInstance ?? globalForPg._dbClient ?? createDbInstance();
}

export const db = new Proxy({} as DbInstance, {
  get(_, prop) {
    const target = getDbInstance() as object;
    const value = Reflect.get(target, prop);
    return typeof value === 'function' ? value.bind(target) : value;
  },
}) as DbInstance;

export { schema };
