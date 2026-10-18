'use client';
import { useEffect, useState } from 'react';
import { applyTheme, Theme } from '@/lib/theme';
import Nav from '@/components/Nav';
import { languages } from '@/lib/i18n';
export default function Settings() {
  const [msg, setMsg] = useState(''); const [aiStatus, setAiStatus] = useState<{ mode: string; activeProvider: string; providers: { provider: string; model: string }[] } | null>(null);
  const [f, setF] = useState({ name: '', headline: '', targetRole: '', experienceLevel: '', language: 'en', theme: 'dark' as Theme });
  useEffect(() => { fetch('/api/profile').then(r => r.json()).then(j => j.profile && setF({ name: j.profile.name ?? '', headline: j.profile.headline ?? '', targetRole: j.profile.targetRole ?? '', experienceLevel: j.profile.experienceLevel ?? '', language: j.profile.language ?? 'en', theme: j.profile.theme })); fetch('/api/ai/status').then(r => r.ok ? r.json() : null).then(setAiStatus).catch(() => {}); }, []);
  async function saveProfile(e: React.FormEvent) {
    e.preventDefault(); const r = await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...f, headline: f.headline || null, targetRole: f.targetRole || null, experienceLevel: f.experienceLevel || null }) });
    const j = await r.json(); if (r.ok) { applyTheme(f.theme); localStorage.setItem('nexora_language', f.language); setMsg('Profile saved.'); } else setMsg(j.error || 'Could not save.');
  }
  const inp = 'ml-2 rounded-lg border border-white/20 bg-transparent px-2 py-1';
  async function delInterviews() { if (!confirm('Delete all saved interview sessions and transcripts?')) return; const r = await (await fetch('/api/interview/session', { method: 'DELETE' })).json(); setMsg(`Deleted ${r.deleted} session(s).`); }
  async function delAccount() { if (!confirm('Permanently delete your account and all data? This cannot be undone.')) return; const r = await fetch('/api/account', { method: 'DELETE' }); if (r.ok) location.href = '/'; else setMsg('Could not delete the account.'); }
  return (<><Nav /><main className="mx-auto max-w-2xl p-6"><h1 className="text-3xl font-bold">Settings and privacy</h1>
    <form onSubmit={saveProfile} className="panel mt-4 space-y-3 text-sm"><b>Profile and appearance</b>
      <label className="block">Name<input required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} className={inp} /></label>
      <label className="block">Headline<input value={f.headline} onChange={e => setF({ ...f, headline: e.target.value })} className={inp} /></label>
      <label className="block">Target role<input value={f.targetRole} onChange={e => setF({ ...f, targetRole: e.target.value })} className={inp} /></label>
      <label className="block">Experience<select value={f.experienceLevel} onChange={e => setF({ ...f, experienceLevel: e.target.value })} className={inp + ' bg-[#111827]'}><option value="">Not set</option><option value="student">Student</option><option value="entry">Entry</option><option value="mid">Mid</option><option value="senior">Senior</option></select></label>
      <label className="block">Interface language<select value={f.language} onChange={e => setF({ ...f, language: e.target.value })} className={inp + " bg-[#111827]"}>{languages.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}</select></label>
      <label className="block">Theme<select value={f.theme} onChange={e => { const t = e.target.value as Theme; setF({ ...f, theme: t }); applyTheme(t); }} className={inp + ' bg-[#111827]'}><option value="dark">Dark</option><option value="light">Light</option><option value="system">System</option></select></label>
      <button className="rounded-xl bg-violet px-4 py-2 font-semibold">Save profile</button><p className="text-xs" style={{ color: 'var(--muted)' }}>Language preference is saved to your profile. Navigation labels are translated; detailed module content and AI responses may remain in English.</p></form>
    <section className="panel mt-4"><b>AI provider status</b><p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>{aiStatus ? (aiStatus.mode === 'demo' ? 'Demo mode: deterministic fallback guidance is active.' : `Configured provider: ${aiStatus.activeProvider}.`) : 'Provider status is unavailable until you sign in and the API responds.'}</p>{aiStatus?.providers.map(p => <p key={p.provider} className="text-sm">{p.provider} · {p.model} · configured</p>)}<p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>Credentials are never shown in this screen. Configure provider keys in the server-side .env file.</p></section>
    <section className="panel mt-4"><b>Your data</b><p className="text-sm" style={{ color: 'var(--muted)' }}>Resumes, saved answers (only if you opted in), job analyses and activity are stored in your NEXORA database. Camera and microphone are never recorded or uploaded.</p>
      <div className="mt-3 flex flex-wrap gap-2"><a href="/api/account" className="rounded-xl border border-white/20 px-4 py-2">Export my data (JSON)</a>
        <button onClick={delInterviews} className="rounded-xl border border-white/20 px-4 py-2">Delete interview history</button>
        <button onClick={delAccount} className="rounded-xl border border-danger px-4 py-2 text-danger">Delete account</button></div></section>
    {msg && <p role="status" className="mt-3">{msg}</p>}
    <p className="mt-4 text-xs" style={{ color: 'var(--muted)' }}>Not built yet: password change, complete translation of every module, notification preferences.</p></main></>);
}
