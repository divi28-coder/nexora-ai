import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/guard';
import { aiProviderStatus } from '@/lib/ai/provider';

export async function GET() {
  const [, deny] = await requireUser();
  if (deny) return deny;
  // Deliberately expose provider names/models only; never return keys or secret values.
  return NextResponse.json(aiProviderStatus());
}
