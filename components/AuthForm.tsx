'use client';
import { useState } from 'react';
import Link from 'next/link';
import { post } from '@/lib/api';
export default function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const [f, setF] = useState({ name: '', email: '', password: '' }); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      await post(mode === 'login' ? '/api/auth/login' : '/api/auth/register', f);
      const next = new URLSearchParams(location.search).get('next');
      location.href = next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';
    } catch (e) { setErr((e as Error).message); setBusy(false); }
  }
  const input = 'mt-1 w-full rounded-xl border border-white/20 bg-transparent px-3 py-2';
  return (<main className="mx-auto max-w-sm p-8"><h1 className="text-3xl font-bold">{mode === 'login' ? 'Sign in' : 'Create your account'}</h1>
    <form onSubmit={submit} className="panel mt-6 space-y-4">
      {mode === 'signup' && <label className="block text-sm">Name<input required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} className={input} autoComplete="name" /></label>}
      <label className="block text-sm">Email<input required type="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} className={input} autoComplete="email" /></label>
      <label className="block text-sm">Password<input required type="password" minLength={mode === 'signup' ? 10 : 1} value={f.password} onChange={e => setF({ ...f, password: e.target.value })} className={input} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>
      {mode === 'signup' && <p className="text-xs" style={{ color: 'var(--muted)' }}>By creating an account you agree that the interviewer is an AI and that scores are estimates. Legal pages are not written yet.</p>}
      {err && <p role="alert" className="text-sm text-danger">{err}</p>}
      <button disabled={busy} className="w-full rounded-xl bg-violet px-4 py-2 font-semibold disabled:opacity-50">{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
    </form>
    <p className="mt-4 text-sm">{mode === 'login' ? <>No account? <Link className="underline" href="/signup">Sign up</Link></> : <>Have an account? <Link className="underline" href="/login">Sign in</Link></>}</p>
    <p className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>Password reset and email verification are not implemented.</p></main>);
}
