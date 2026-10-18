import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { hashPassword } from '@/lib/auth/password';
import { registerInput } from '@/lib/validation/auth';
import { setSession } from '@/lib/auth/guard';
import { limited } from '@/lib/security/rate-limit';
export async function POST(req: Request) {
  if (limited('reg:' + (req.headers.get('x-forwarded-for') ?? 'local'), 5)) return NextResponse.json({ error: 'Too many attempts. Try again in a minute.' }, { status: 429 });
  const p = registerInput.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: p.error.issues[0]?.message ?? 'Invalid input.' }, { status: 400 });
  if (await prisma.user.findUnique({ where: { email: p.data.email } })) return NextResponse.json({ error: 'That email is already registered.' }, { status: 409 });
  const u = await prisma.user.create({ data: { name: p.data.name, email: p.data.email, passwordHash: hashPassword(p.data.password) } });
  await prisma.consentRecord.create({ data: { userId: u.id, kind: 'terms-and-ai-disclosure', granted: true } });
  return setSession(NextResponse.json({ ok: true }, { status: 201 }), u.id);
}
