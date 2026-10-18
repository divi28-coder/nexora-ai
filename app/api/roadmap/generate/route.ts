import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { requireUser } from '@/lib/auth/guard';
import { activeResume } from '@/lib/resume/active';
import { generateRoadmap } from '@/lib/roadmap';
import { roleCatalog } from '@/lib/demo/data';
const body = z.object({ role: z.string().refine(r => r in roleCatalog, 'Choose a listed role.'), hoursPerWeek: z.number().int().min(1).max(60).default(8) });
/** Replaces ONLY not-yet-completed tasks, keeping completed history. Demo (rule-based) generation. */
export async function POST(req: Request) {
  const [u, deny] = await requireUser(); if (deny) return deny;
  const p = body.safeParse(await req.json().catch(() => null)); if (!p.success) return NextResponse.json({ error: p.error.issues[0]?.message ?? 'Invalid input.' }, { status: 400 });
  const resume = await activeResume(u.id);
  const ev = await prisma.userSkillEvidence.findMany({ where: { userId: u.id }, include: { skill: true } });
  const text = (resume?.text ?? '').toLowerCase();
  const have = [...new Set([...ev.map(e => e.skill.name), ...roleCatalog[p.data.role].filter(s => text.includes(s.toLowerCase()))])];
  const g = generateRoadmap(p.data.role, have, p.data.hoursPerWeek);
  let r = await prisma.careerRoadmap.findFirst({ where: { userId: u.id } });
  r = r ? await prisma.careerRoadmap.update({ where: { id: r.id }, data: { targetRole: p.data.role } }) : await prisma.careerRoadmap.create({ data: { userId: u.id, targetRole: p.data.role } });
  await prisma.$transaction([prisma.roadmapTask.deleteMany({ where: { roadmapId: r.id, done: false } }), prisma.roadmapTask.createMany({ data: g.tasks.map(t => ({ ...t, roadmapId: r!.id })) })]);
  await prisma.user.update({ where: { id: u.id }, data: { targetRole: p.data.role } });
  await prisma.activityHistory.create({ data: { userId: u.id, type: 'roadmap', detail: `Generated roadmap for ${p.data.role}` } });
  return NextResponse.json({ mode: 'demo', missing: g.missing, haveSkills: have, note: g.note, resumeUsed: !!resume });
}
