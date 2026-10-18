// Edge middleware: cheap redirect for signed-out visitors. Real verification happens server-side in lib/auth/guard.ts.
import { NextRequest, NextResponse } from 'next/server';
const PROTECTED = ['/dashboard', '/assistant', '/resume', '/job-matcher', '/question-forge', '/interview-studio', '/career-roadmap', '/career-universe', '/skill-arena', '/opportunity-radar', '/career-twin', '/settings', '/activity'];
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PROTECTED.some(p => pathname === p || pathname.startsWith(p + '/')) && !req.cookies.get('nexora_session')) {
    const url = req.nextUrl.clone(); url.pathname = '/login'; url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}
export const config = { matcher: ['/((?!_next|api|favicon.ico).*)'] };
