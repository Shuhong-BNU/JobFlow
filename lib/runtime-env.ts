import fs from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';
import { type RuntimeHealthCode } from './runtime-health-shared';

export const AUTH_SECRET_PLACEHOLDER = 'replace_me_with_a_long_random_string';
const DATABASE_PLACEHOLDERS = ['YOUR_PASSWORD', 'YOUR_PROJECT_REF'] as const;

export type RuntimeIssueCode =
  | 'env_file_missing'
  | 'auth_secret_missing'
  | 'database_url_missing'
  | 'database_url_placeholder';

export type RuntimeIssue = {
  code: RuntimeIssueCode;
  message: string;
};

export type RuntimeHealth = {
  ok: boolean;
  code: RuntimeHealthCode;
  issues: RuntimeIssue[];
};

export function getEnvFilePath(cwd = process.cwd()) {
  return path.join(cwd, '.env');
}

export function hasLocalEnvFile(cwd = process.cwd()) {
  return fs.existsSync(getEnvFilePath(cwd));
}

export function getRuntimeEnvIssues(env = process.env): RuntimeIssue[] {
  const issues: RuntimeIssue[] = [];
  const authSecret = env.AUTH_SECRET?.trim();
  const databaseUrl = env.DATABASE_URL?.trim();

  if (!authSecret || authSecret === AUTH_SECRET_PLACEHOLDER) {
    issues.push({
      code: 'auth_secret_missing',
      message: 'AUTH_SECRET 未设置，或仍然是模板占位符。',
    });
  }

  if (!databaseUrl) {
    issues.push({
      code: 'database_url_missing',
      message: 'DATABASE_URL 未设置。',
    });
  } else if (DATABASE_PLACEHOLDERS.some((marker) => databaseUrl.includes(marker))) {
    issues.push({
      code: 'database_url_placeholder',
      message: 'DATABASE_URL 仍然包含模板占位符，请替换为真实数据库连接串。',
    });
  }

  return issues;
}

export function getRuntimeEnvErrorMessage(issues = getRuntimeEnvIssues()) {
  return issues.map((issue) => issue.message).join(' ');
}

export async function getRuntimeHealth(): Promise<RuntimeHealth> {
  const issues = getRuntimeEnvIssues();
  if (issues.length > 0) {
    return { ok: false, code: 'env_invalid', issues };
  }

  const connectionString = process.env.DATABASE_URL!;
  const sql = postgres(connectionString, {
    max: 1,
    prepare: !connectionString.includes('pgbouncer=true'),
    idle_timeout: 5,
    connect_timeout: 5,
  });

  try {
    await sql`select 1`;
    return { ok: true, code: 'ok', issues: [] };
  } catch {
    return { ok: false, code: 'db_unreachable', issues: [] };
  } finally {
    await sql.end({ timeout: 5 }).catch(() => undefined);
  }
}
