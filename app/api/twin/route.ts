import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireUser } from '@/lib/auth/guard';
export async function GET() {
  const [u, deny] = await requireUser(); if (deny) return deny;
  const [resumes, evidence, sessions, tasks, jobs] = await Promise.all([
    prisma.resume.findMany({ where: { userId: u.id }, include: { versions: { select: { version: true, createdAt: true } } } }),
    prisma.userSkillEvidence.findMany({ where: { userId: u.id }, include: { skill: true }, orderBy: { createdAt: 'desc' } }),
    prisma.interviewSession.count({ where: { userId: u.id } }),
    prisma.roadmapTask.findMany({ where: { roadmap: { userId: u.id } }, select: { done: true } }),
    prisma.jobAnalysis.count({ where: { userId: u.id } })]);
  return NextResponse.json({ resumes, evidence, sessions, jobs, tasksDone: tasks.filter(t => t.done).length, tasksTotal: tasks.length });
}
