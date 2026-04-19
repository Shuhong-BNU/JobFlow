export type RuntimeHealthCode = 'ok' | 'env_invalid' | 'db_unreachable';

export function mapRuntimeHealthCodeToAuthErrorKey(code: RuntimeHealthCode) {
  if (code === 'env_invalid') return 'envInvalid' as const;
  if (code === 'db_unreachable') return 'dbUnavailable' as const;
  return 'serviceUnavailable' as const;
}
