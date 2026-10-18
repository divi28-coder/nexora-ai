import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { requireUser } from '@/lib/auth/guard';
const body = z.object({ name: z.string().trim().min(1).max(80), headline: z.string().trim().max(120).nullable(), targetRole: z.string().trim().max(80).nullable(), experienceLevel: z.enum(['student', 'entry', 'mid', 'senior']).nullable(), language: z.enum(['en', 'ta', 'hi', 'te', 'kn', 'ml']).default('en'), theme: z.enum(['dark', 'light', 'system']).default('dark') });
const sel = { name: true, email: true, headline: true, targetRole: true, experienceLevel: true, language: true, theme: true } as const;
export async function GET() { const [u, deny] = await requireUser(); if (deny) return deny; return NextResponse.json({ profile: await prisma.user.findUnique({ where: { id: u.id }, select: sel }) }); }
export async function PUT(req: Request) {
  const [u, deny] = await requireUser(); if (deny) return deny;
  const p = body.safeParse(await req.json().catch(() => null)); if (!p.success) return NextResponse.json({ error: p.error.issues[0]?.message ?? 'Invalid profile.' }, { status: 400 });
  return NextResponse.json({ profile: await prisma.user.update({ where: { id: u.id }, data: p.data, select: sel }) });
}
