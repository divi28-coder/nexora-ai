import { NextResponse } from 'next/server';
import { jobMatchInput } from '@/lib/validation/schemas';
import { scoreMatch } from '@/lib/resume/match';
import { requireUser } from '@/lib/auth/guard';
import { activeResume } from '@/lib/resume/active';
import { prisma } from '@/lib/db/prisma';
export async function POST(req: Request) {
  const [u, deny] = await requireUser(); if (deny) return deny;
  const p = jobMatchInput.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: 'Provide a job description (20+ characters).' }, { status: 400 });
  const resumeText = p.data.resumeText ?? (await activeResume(u.id))?.text;
  if (!resumeText) return NextResponse.json({ error: 'No resume found. Upload one in Resume Intelligence or paste resume text.' }, { status: 400 });
  const r = scoreMatch(resumeText, p.data.jobText);
  const title = p.data.jobText.split('\n')[0].slice(0, 80);
  await prisma.jobAnalysis.create({ data: { userId: u.id, title, description: p.data.jobText, result: r } });
  await prisma.activityHistory.create({ data: { userId: u.id, type: 'job', detail: `Matched resume to "${title}" (${r.score}%)` } });
  return NextResponse.json({ mode: 'demo', isEstimate: true, ...r, summary: `Estimated match ${r.score}%. A missing keyword does not prove you lack the skill, and this is not an ATS result.` });
}
export async function GET() {
  const [u, deny] = await requireUser(); if (deny) return deny;
  return NextResponse.json({ analyses: await prisma.jobAnalysis.findMany({ where: { userId: u.id }, orderBy: { createdAt: 'desc' }, take: 20 }) });
}
