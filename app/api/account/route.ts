import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireUser } from '@/lib/auth/guard';
/** GET = export all of the user's data as JSON. DELETE = delete account and everything owned (cascade). */
export async function GET() {
  const [u, deny] = await requireUser(); if (deny) return deny;
  const data = await prisma.user.findUnique({ where: { id: u.id }, select: { id: true, email: true, name: true, createdAt: true, resumes: { include: { versions: true } }, interviews: { include: { answers: true } }, roadmaps: { include: { tasks: true } }, jobAnalyses: true, skills: { include: { skill: true } }, activity: true, consents: true } });
  return new NextResponse(JSON.stringify(data, null, 2), { headers: { 'content-type': 'application/json', 'content-disposition': 'attachment; filename="nexora-data.json"' } });
}
export async function DELETE() {
  const [u, deny] = await requireUser(); if (deny) return deny;
  await prisma.user.delete({ where: { id: u.id } });
  const res = NextResponse.json({ ok: true }); res.cookies.set('nexora_session', '', { path: '/', maxAge: 0 }); return res;
}
