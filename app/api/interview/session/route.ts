import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { requireUser } from '@/lib/auth/guard';
const body = z.object({ role: z.string().min(2).max(80), category: z.string().max(40), mode: z.enum(['TEXT', 'VOICE', 'VIDEO']).default('TEXT'), saveTranscript: z.boolean().default(false) });
export async function POST(req: Request) {
  const [u, deny] = await requireUser(); if (deny) return deny;
  const p = body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: 'Invalid interview setup.' }, { status: 400 });
  const s = await prisma.interviewSession.create({ data: { userId: u.id, role: p.data.role, category: p.data.category, mode: p.data.mode, status: 'IN_PROGRESS', saveTranscriptConsent: p.data.saveTranscript } });
  await prisma.consentRecord.create({ data: { userId: u.id, kind: 'save-interview-transcript', granted: p.data.saveTranscript } });
  return NextResponse.json({ id: s.id }, { status: 201 });
}
export async function GET() {
  const [u, deny] = await requireUser(); if (deny) return deny;
  return NextResponse.json({ sessions: await prisma.interviewSession.findMany({ where: { userId: u.id }, orderBy: { createdAt: 'desc' }, take: 20, include: { answers: { select: { id: true } } } }) });
}
export async function DELETE(req: Request) {
  const [u, deny] = await requireUser(); if (deny) return deny;
  const id = new URL(req.url).searchParams.get('id');
  const { count } = await prisma.interviewSession.deleteMany({ where: id ? { id, userId: u.id } : { userId: u.id } });
  return NextResponse.json({ deleted: count });
}
