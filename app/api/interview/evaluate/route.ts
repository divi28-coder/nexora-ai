import { NextResponse } from 'next/server';
import { answerInput } from '@/lib/validation/schemas';
import { demoEvaluate } from '@/lib/ai/demo';
import { requireUser } from '@/lib/auth/guard';
import { prisma } from '@/lib/db/prisma';
export async function POST(req: Request) {
  const [u, deny] = await requireUser(); if (deny) return deny;
  const p = answerInput.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: 'Provide a question and an answer.' }, { status: 400 });
  const fb = demoEvaluate(p.data.answer);
  if (p.data.sessionId) {
    const s = await prisma.interviewSession.findFirst({ where: { id: p.data.sessionId, userId: u.id } });
    if (s?.saveTranscriptConsent) await prisma.interviewAnswer.create({ data: { sessionId: s.id, question: p.data.question, answer: p.data.answer, feedback: fb } });
  }
  return NextResponse.json(fb);
}
