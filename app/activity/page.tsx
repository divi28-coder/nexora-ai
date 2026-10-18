'use client';
import Nav from '@/components/Nav';
import { useFetch } from '@/lib/hooks';
export default function Activity() {
  const { data, err, loading } = useFetch<{ items: { id: string; type: string; detail: string; createdAt: string }[] }>('/api/activity');
  return (<><Nav /><main className="mx-auto max-w-2xl p-6"><h1 className="text-3xl font-bold">Activity history</h1>
    {loading && <p className="mt-4">Loading…</p>}{err && <p role="alert" className="mt-4 text-danger">{err}</p>}
    <ul className="mt-4 space-y-2">{data?.items.length === 0 && <li className="panel text-sm">Nothing yet. Your actions will appear here.</li>}{data?.items.map(i => <li key={i.id} className="panel text-sm"><b>{i.detail}</b><br /><small style={{ color: 'var(--muted)' }}>{new Date(i.createdAt).toLocaleString()} · {i.type}</small></li>)}</ul></main></>);
}
