import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireUser } from '@/lib/auth/guard';
export async function GET() {
  const [u, deny] = await requireUser(); if (deny) return deny;
  return NextResponse.json({ items: await prisma.activityHistory.findMany({ where: { userId: u.id }, orderBy: { createdAt: 'desc' }, take: 100 }) });
}
