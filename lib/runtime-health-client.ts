import type { RuntimeHealthCode } from './runtime-health-shared';

type RuntimeIssue = {
  code: string;
  message: string;
};

type RuntimeHealth = {
  ok: boolean;
  code: RuntimeHealthCode;
  issues: RuntimeIssue[];
};

export async function fetchRuntimeHealth() {
  const res = await fetch('/api/dev/ready', {
    method: 'GET',
    cache: 'no-store',
  });

  const body = (await res.json().catch(() => null)) as RuntimeHealth | null;
  if (!body) {
    return {
      ok: false,
      code: 'env_invalid',
      issues: [],
    } satisfies RuntimeHealth;
  }

  return body;
}
