import { NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';
import { getRuntimeHealth } from '@/lib/runtime-env';

export const dynamic = 'force-dynamic';

export async function GET() {
  noStore();
  const health = await getRuntimeHealth();
  return NextResponse.json(health, {
    status: health.ok ? 200 : 503,
  });
}

