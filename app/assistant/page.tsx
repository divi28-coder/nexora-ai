'use client';
import { useState } from 'react';
import Nav from '@/components/Nav';
import { post } from '@/lib/api';
type Msg = { role: 'user' | 'assistant'; text: string };
const suggestions = ['What are my strongest skills?', 'What should I improve in my resume?', 'Help me prepare for an HR interview.', 'Create a 30-day career improvement plan.'];
export default function Assistant() {
  const [msgs, setMsgs] = useState<Msg[]>([]); const [input, setInput] = useState('');
  const [simple, setSimple] = useState(false); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  async function send(text: string) {
    if (!text.trim() || busy) return;
    setErr(''); setBusy(true); setMsgs(m => [...m, { role: 'user', text }]); setInput('');
    try { const r = await post<{ reply: string }>('/api/assistant', { message: text, simpleEnglish: simple }); setMsgs(m => [...m, { role: 'assistant', text: r.reply }]); }
    catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }
  return (<><Nav /><main className="mx-auto max-w-3xl p-6">
    <h1 className="text-3xl font-bold">NEXORA Guide</h1>
    <p className="mt-1 text-sm" style={{color:'var(--muted)'}}>Uses sample resume data in demo mode. Answers are guidance, not guarantees.</p>
    <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={simple} onChange={e => setSimple(e.target.checked)} /> Simple English mode</label>
    <div className="mt-4 flex flex-wrap gap-2">{suggestions.map(s => <button key={s} onClick={() => send(s)} className="rounded-full border border-white/20 px-3 py-1 text-sm hover:bg-white/10">{s}</button>)}</div>
    <div className="mt-4 space-y-3" aria-live="polite">
      {msgs.length === 0 && <p className="panel text-sm">Ask a question or pick a suggestion to start.</p>}
      {msgs.map((m, i) => <div key={i} className="panel whitespace-pre-wrap text-sm" style={m.role === 'user' ? { borderColor: 'var(--accent2)' } : undefined}><b>{m.role === 'user' ? 'You' : 'Guide'}</b><br />{m.text}
        {m.role === 'assistant' && <button className="mt-2 block text-xs underline" onClick={() => navigator.clipboard?.writeText(m.text)}>Copy</button>}</div>)}
      {busy && <p className="text-sm" style={{color:'var(--muted)'}}>Guide is typing…</p>}
      {err && <p role="alert" className="text-sm text-danger">{err}</p>}
    </div>
    <div className="mt-4 flex gap-2">
      <label htmlFor="msg" className="sr-only">Message</label>
      <input id="msg" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send(input)} className="flex-1 rounded-xl border border-white/20 bg-transparent px-3 py-2" placeholder="Ask about your career…" />
      <button onClick={() => send(input)} disabled={busy} className="rounded-xl bg-violet px-4 py-2 font-semibold disabled:opacity-50">Send</button>
    </div></main></>);
}
