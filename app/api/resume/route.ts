import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireUser } from '@/lib/auth/guard';
import { extractText, validateUpload } from '@/lib/resume/extract';
import { analyzeResume } from '@/lib/ai/provider';

// Include the latest saved resume text so Career Universe can analyze it.
export async function GET() {
  const [u, deny] = await requireUser();
  if (deny) return deny;
  const resumes = await prisma.resume.findMany({
    where: { userId: u.id },
    orderBy: { createdAt: 'desc' },
    include: {
      versions: {
        orderBy: { version: 'desc' },
        take: 1,
        select: { version: true, createdAt: true, content: true, analysis: true },
      },
    },
  });
  return NextResponse.json({ resumes });
}

/** multipart (field "file") or JSON ({title, text}). Creates resume + version 1 + analysis. */
export async function POST(req: Request) {
  const [u, deny] = await requireUser(); if (deny) return deny;
  let title = 'Pasted resume', text = '';
  const ct = req.headers.get('content-type') ?? '';
  try {
    if (ct.includes('multipart/form-data')) {
      const f = (await req.formData()).get('file');
      if (!(f instanceof File)) return NextResponse.json({ error: 'Choose a file to upload.' }, { status: 400 });
      const v = validateUpload(f.name, f.size); if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
      title = f.name; text = await extractText(Buffer.from(await f.arrayBuffer()), v.ext);
    } else {
      const b = await req.json().catch(() => null);
      text = String(b?.text ?? '').trim(); title = String(b?.title ?? title).slice(0, 120);
    }
  } catch { return NextResponse.json({ error: 'Could not read that file. If it is a scanned PDF, paste the text instead.' }, { status: 422 }); }
  if (text.length < 50) return NextResponse.json({ error: 'Not enough text found (need 50+ characters). Scanned PDFs are not supported; paste the text instead.' }, { status: 422 });
  if (text.length > 20000) text = text.slice(0, 20000);
  const analysis = await analyzeResume(text);
  const r = await prisma.resume.create({ data: { userId: u.id, title, isActive: true, versions: { create: { version: 1, content: { text }, analysis } } } });
  await prisma.resume.updateMany({ where: { userId: u.id, id: { not: r.id } }, data: { isActive: false } });
  await prisma.activityHistory.create({ data: { userId: u.id, type: 'resume', detail: `Uploaded and analyzed "${title}"` } });
  return NextResponse.json({ id: r.id }, { status: 201 });
}
