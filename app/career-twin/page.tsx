'use client';
import Nav from '@/components/Nav';
import Link from 'next/link';
import { useFetch } from '@/lib/hooks';
type T = { resumes: { id: string; title: string; versions: unknown[] }[]; evidence: { id: string; level: string; note: string | null; skill: { name: string } }[]; sessions: number; jobs: number; tasksDone: number; tasksTotal: number };
export default function Twin() {
  const { data: t, err, loading } = useFetch<T>('/api/twin');
  return (<><Nav /><main className="mx-auto max-w-3xl p-6"><h1 className="text-3xl font-bold">Career Twin</h1>
    <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>Built only from what you have done in NEXORA. Nothing here is inferred or invented.</p>
    {loading && <p className="mt-4">Loading…</p>}{err && <p role="alert" className="mt-4 text-danger">{err}</p>}
    {t && <div className="mt-4 grid gap-4 md:grid-cols-2">
      <section className="panel"><b>Activity</b><ul className="mt-2 text-sm"><li>Resumes: {t.resumes.length}</li><li>Interview sessions: {t.sessions}</li><li>Job analyses: {t.jobs}</li><li>Roadmap tasks: {t.tasksDone}/{t.tasksTotal}</li></ul></section>
      <section className="panel"><b>Skill evidence</b>{t.evidence.length === 0 ? <p className="mt-2 text-sm">None yet. <Link className="underline" href="/skill-arena">Take a quiz</Link>.</p> : <ul className="mt-2 text-sm">{t.evidence.map(e => <li key={e.id}>{e.skill.name}: {e.level.replace(/_/g, ' ').toLowerCase()} ({e.note})</li>)}</ul>}</section>
      <section className="panel md:col-span-2"><b>Resume versions</b>{t.resumes.length === 0 ? <p className="mt-2 text-sm">No resumes yet. <Link className="underline" href="/resume">Add one</Link>.</p> : <ul className="mt-2 text-sm">{t.resumes.map(r => <li key={r.id}>{r.title}: {r.versions.length} version(s)</li>)}</ul>}</section></div>}</main></>);
}
