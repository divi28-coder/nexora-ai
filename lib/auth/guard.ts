import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '../db/prisma';
import { COOKIE, signToken, verifyToken } from './token';

export async function currentUser() {
  const uid = verifyToken(cookies().get(COOKIE)?.value);
  if (!uid) return null;
  return prisma.user.findUnique({ where: { id: uid }, select: { id: true, email: true, name: true, role: true } });
}
/** Use in route handlers: returns [user, null] or [null, 401 response]. */
export async function requireUser() {
  const u = await currentUser();
  return u ? ([u, null] as const) : ([null, NextResponse.json({ error: 'Please sign in.' }, { status: 401 })] as const);
}
export function setSession(res: NextResponse, uid: string) {
  res.cookies.set(COOKIE, signToken(uid), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 7 * 86400 });
  return res;
}
