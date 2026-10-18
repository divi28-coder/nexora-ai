import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyPassword } from '@/lib/auth/password';
import { loginInput } from '@/lib/validation/auth';
import { setSession } from '@/lib/auth/guard';
import { limited } from '@/lib/security/rate-limit';
export async function POST(req: Request) {
  if (limited('login:' + (req.headers.get('x-forwarded-for') ?? 'local'), 8)) return NextResponse.json({ error: 'Too many attempts. Try again in a minute.' }, { status: 429 });
  const p = loginInput.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: 'Enter a valid email and password.' }, { status: 400 });
  const u = await prisma.user.findUnique({ where: { email: p.data.email } });
  if (!u || !verifyPassword(p.data.password, u.passwordHash)) return NextResponse.json({ error: 'Email or password is incorrect.' }, { status: 401 });
  await prisma.activityHistory.create({ data: { userId: u.id, type: 'login', detail: 'Signed in' } });
  return setSession(NextResponse.json({ ok: true }), u.id);
}
