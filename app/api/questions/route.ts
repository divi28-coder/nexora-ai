import { NextResponse } from 'next/server';
import { questionInput } from '@/lib/validation/schemas';
import { demoQuestions } from '@/lib/ai/demo';
import { extractRequirements } from '@/lib/resume-analysis';
import { requireUser } from '@/lib/auth/guard';
import { activeResume } from '@/lib/resume/active';
export async function POST(req: Request) {
  const [u, deny] = await requireUser(); if (deny) return deny;
  const p = questionInput.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: 'Check role, category and count (1-10).' }, { status: 400 });
  const resumeText = p.data.resumeText ?? (await activeResume(u.id))?.text ?? '';
  let qs = demoQuestions(p.data.role, p.data.category, p.data.count, resumeText);
  if (p.data.jobText) {
    const jd = extractRequirements(p.data.jobText).slice(0, 3).map((r, i) => ({ id: `jd${i}`, question: `The job asks for ${r}. Describe where you have used it, or how you would learn it quickly.`, followUps: ['What was the outcome?', 'What would you do differently?'], basedOnResume: false }));
    qs = [...jd, ...qs].slice(0, p.data.count);
  }
  return NextResponse.json({ mode: 'demo', questions: qs, usedResume: !!resumeText });
}
