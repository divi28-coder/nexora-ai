'use client';
import { useEffect, useState } from 'react';
export function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null); const [err, setErr] = useState(''); const [loading, setLoading] = useState(true);
  const reload = () => { setLoading(true); fetch(url).then(async r => { const j = await r.json(); if (!r.ok) throw new Error(j.error || 'Request failed'); setData(j); setErr(''); }).catch(e => setErr(e.message)).finally(() => setLoading(false)); };
  useEffect(reload, [url]); // eslint-disable-line react-hooks/exhaustive-deps
  return { data, err, loading, reload };
}
