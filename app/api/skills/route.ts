import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { requireUser } from '@/lib/auth/guard';
const body = z.object({ skill: z.string().min(1).max(60), correct: z.number().int().min(0), total: z.number().int().min(1) });
export async function POST(req: Request) {
  const [u, deny] = await requireUser(); if (deny) return deny;
  const p = body.safeParse(await req.json().catch(() => null));
  if (!p.success || p.data.correct > p.data.total) return NextResponse.json({ error: 'Invalid result.' }, { status: 400 });
  const pct = Math.round((p.data.correct / p.data.total) * 100);
  if (pct >= 70) { // only record evidence when the quiz was passed
    const skill = await prisma.skill.upsert({ where: { name: p.data.skill }, update: {}, create: { name: p.data.skill } });
    await prisma.userSkillEvidence.create({ data: { userId: u.id, skillId: skill.id, level: 'CHALLENGE_DEMONSTRATED', note: `Quiz ${p.data.correct}/${p.data.total}` } });
  }
  await prisma.activityHistory.create({ data: { userId: u.id, type: 'skill', detail: `${p.data.skill} quiz: ${p.data.correct}/${p.data.total}` } });
  return NextResponse.json({ pct, recorded: pct >= 70 });
}
