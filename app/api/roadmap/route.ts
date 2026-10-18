import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { requireUser } from '@/lib/auth/guard';
import { defaultTasks } from '@/lib/roadmap-defaults';
const order = [{ week: 'asc' as const }, { id: 'asc' as const }];
export async function GET() {
  const [u, deny] = await requireUser(); if (deny) return deny;
  let r = await prisma.careerRoadmap.findFirst({ where: { userId: u.id }, include: { tasks: { orderBy: order } } });
  if (!r) r = await prisma.careerRoadmap.create({ data: { userId: u.id, targetRole: 'Data Analyst', tasks: { create: defaultTasks } }, include: { tasks: { orderBy: order } } });
  return NextResponse.json({ roadmap: r });
}
const fields = { title: z.string().trim().min(1).max(200), week: z.number().int().min(1).max(52), deliverable: z.string().max(300).nullable(), notes: z.string().max(1000).nullable(), priority: z.enum(['LOW', 'MEDIUM', 'HIGH']), dueDate: z.string().refine((v: string) => !Number.isNaN(Date.parse(v))).nullable(), hours: z.number().int().min(0).max(100).nullable(), done: z.boolean() };
const create = z.object({ title: fields.title, week: fields.week.default(1), priority: fields.priority.default('MEDIUM'), dueDate: fields.dueDate.optional() });
const patch = z.object({ id: z.string() }).extend(Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v.optional()])) as { [K in keyof typeof fields]: z.ZodOptional<(typeof fields)[K]> });
async function myRoadmap(userId: string) { return prisma.careerRoadmap.findFirst({ where: { userId } }); }
export async function POST(req: Request) { // add a task
  const [u, deny] = await requireUser(); if (deny) return deny;
  const p = create.safeParse(await req.json().catch(() => null)); if (!p.success) return NextResponse.json({ error: 'Enter a task title (max 200 characters).' }, { status: 400 });
  const r = await myRoadmap(u.id); if (!r) return NextResponse.json({ error: 'Open the roadmap first.' }, { status: 404 });
  const t = await prisma.roadmapTask.create({ data: { roadmapId: r.id, title: p.data.title, week: p.data.week, priority: p.data.priority, dueDate: p.data.dueDate ? new Date(p.data.dueDate) : null } });
  return NextResponse.json({ id: t.id }, { status: 201 });
}
export async function PATCH(req: Request) {
  const [u, deny] = await requireUser(); if (deny) return deny;
  const p = patch.safeParse(await req.json().catch(() => null)); if (!p.success) return NextResponse.json({ error: 'Invalid update.' }, { status: 400 });
  const { id, dueDate, ...rest } = p.data;
  const data = { ...rest, ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}) };
  if (dueDate && isNaN(new Date(dueDate).getTime())) return NextResponse.json({ error: 'Invalid date.' }, { status: 400 });
  const { count } = await prisma.roadmapTask.updateMany({ where: { id, roadmap: { userId: u.id } }, data });
  if (!count) return NextResponse.json({ error: 'Task not found.' }, { status: 404 });
  if (rest.done) await prisma.activityHistory.create({ data: { userId: u.id, type: 'roadmap', detail: 'Completed a roadmap task' } });
  return NextResponse.json({ ok: true });
}
export async function DELETE(req: Request) {
  const [u, deny] = await requireUser(); if (deny) return deny;
  const id = new URL(req.url).searchParams.get('id') ?? '';
  const { count } = await prisma.roadmapTask.deleteMany({ where: { id, roadmap: { userId: u.id } } });
  return count ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'Task not found.' }, { status: 404 });
}
