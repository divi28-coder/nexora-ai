import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { requireUser } from '@/lib/auth/guard';
import { analyzeResume } from '@/lib/ai/provider';

async function owned(id: string, userId: string) {
  return prisma.resume.findFirst({ where: { id, userId }, include: { versions: { orderBy: { version: 'desc' } } } });
}
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const [u, deny] = await requireUser(); if (deny) return deny;
  const r = await owned(params.id, u.id);
  if (!r) return NextResponse.json({ error: 'Resume not found.' }, { status: 404 });
  const fmt = new URL(req.url).searchParams.get('export');
  if (fmt === 'txt') {
    const t = (r.versions[0].content as { text: string }).text;
    return new NextResponse(t, { headers: { 'content-type': 'text/plain; charset=utf-8', 'content-disposition': `attachment; filename="resume-v${r.versions[0].version}.txt"` } });
  }
  return NextResponse.json({ resume: r });
}
const save = z.object({ text: z.string().min(50).max(20000) });
/** Saves a new version (originals are never overwritten) and re-analyzes it. */
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const [u, deny] = await requireUser(); if (deny) return deny;
  const p = save.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: 'Resume text must be 50-20000 characters.' }, { status: 400 });
  const r = await owned(params.id, u.id);
  if (!r) return NextResponse.json({ error: 'Resume not found.' }, { status: 404 });
  const v = await prisma.resumeVersion.create({ data: { resumeId: r.id, version: r.versions[0].version + 1, content: { text: p.data.text }, analysis: await analyzeResume(p.data.text) } });
  await prisma.activityHistory.create({ data: { userId: u.id, type: 'resume', detail: `Saved version ${v.version} of "${r.title}"` } });
  return NextResponse.json({ version: v.version });
}
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const [u, deny] = await requireUser(); if (deny) return deny;
  const { count } = await prisma.resume.deleteMany({ where: { id: params.id, userId: u.id } });
  return count ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'Resume not found.' }, { status: 404 });
}
