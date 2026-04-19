import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";

declare global {
  var __jobflowSql: ReturnType<typeof postgres> | undefined;
  var __jobflowDb: PostgresJsDatabase<typeof schema> | undefined;
}

export function getDb() {
  const connectionString = process.env.DATABASE_URL;
  const maxConnections = Number(process.env.DATABASE_POOL_MAX ?? "10");

  if (!connectionString) {
    throw new Error("DATABASE_URL 未设置，无法连接数据库。");
  }

  if (!globalThis.__jobflowSql) {
    globalThis.__jobflowSql = postgres(connectionString, {
      prepare: false,
      max: Number.isFinite(maxConnections) && maxConnections > 0 ? maxConnections : 10,
    });
  }

  if (!globalThis.__jobflowDb) {
    globalThis.__jobflowDb = drizzle(globalThis.__jobflowSql, { schema });
  }

  return globalThis.__jobflowDb;
}
