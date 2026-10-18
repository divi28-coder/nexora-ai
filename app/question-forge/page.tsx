'use client';
import { useState } from 'react';
import Nav from '@/components/Nav';
import { post } from '@/lib/api';
type Q = { id: string; question: string; followUps: string[]; basedOnResume: boolean };
const RESUME = 'Developed a student management system using Python and MySQL.';
export default function QuestionForge() {
  const [role, setRole] = useState('Data Analyst'); const [category, setCategory] = useState('Project'); const [count, setCount] = useState(5);
  const [qs, setQs] = useState<Q[]>([]); const [saved, setSaved] = useState<string[]>([]); const [err, setErr] = useState('');
  async function gen() { setErr(''); try { const r = await post<{ questions: Q[] }>('/api/questions', { role, category, count, resumeText: RESUME }); setQs(r.questions); } catch (e) { setErr((e as Error).message); } }
  const toggle = (id: string) => setSaved(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  return (<><Nav /><main className="mx-auto max-w-3xl p-6">
    <h1 className="text-3xl font-bold">Question Forge</h1>
    <p className="mt-1 text-sm" style={{color:'var(--muted)'}}>Demo mode: questions come from a fixed bank and use a sample resume line. Saved questions last until you reload.</p>
    <div className="mt-4 flex flex-wrap items-end gap-3 text-sm">
      <label>Role<input value={role} onChange={e => setRole(e.target.value)} className="ml-2 rounded-lg border border-white/20 bg-transparent px-2 py-1" /></label>
      <label>Category<select value={category} onChange={e => setCategory(e.target.value)} className="ml-2 rounded-lg border border-white/20 bg-[#111827] px-2 py-1">{['HR', 'Behavioral', 'Technical', 'Project'].map(c => <option key={c}>{c}</option>)}</select></label>
      <label>Count<input type="number" min={1} max={10} value={count} onChange={e => setCount(Number(e.target.value))} className="ml-2 w-16 rounded-lg border border-white/20 bg-transparent px-2 py-1" /></label>
      <button onClick={gen} className="rounded-xl bg-violet px-4 py-2 font-semibold">Generate</button></div>
    {err && <p role="alert" className="mt-3 text-danger">{err}</p>}
    <ul className="mt-4 space-y-3">{qs.map(q => <li key={q.id} className="panel"><b>{q.question}</b>{q.basedOnResume && <span className="ml-2 text-xs" style={{ color: 'var(--accent2)' }}>from your resume</span>}
      <ul className="mt-2 list-disc pl-5 text-sm" style={{color:'var(--muted)'}}>{q.followUps.map(f => <li key={f}>{f}</li>)}</ul>
      <button onClick={() => toggle(q.id)} className="mt-2 text-sm underline">{saved.includes(q.id) ? 'Unsave' : 'Save question'}</button></li>)}
      {qs.length === 0 && <li className="panel text-sm">No questions yet. Choose options and press Generate.</li>}</ul>
  </main></>);
}
