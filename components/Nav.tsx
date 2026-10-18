'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { translate } from '@/lib/i18n';
const links = [['Overview','/dashboard'],['Assistant','/assistant'],['Resume','/resume'],['Job Matcher','/job-matcher'],['Questions','/question-forge'],['Interview','/interview-studio'],['Universe','/career-universe'],['Skill Arena','/skill-arena'],['Roadmap','/career-roadmap'],['Radar','/opportunity-radar'],['Twin','/career-twin'],['Activity','/activity'],['Settings','/settings']];
export default function Nav() {
  const [language, setLanguage] = useState('en');
  useEffect(() => {
    const local = localStorage.getItem('nexora_language');
    if (local) setLanguage(local);
    fetch('/api/profile').then(r => r.ok ? r.json() : null).then(j => {
      const lang = j?.profile?.language;
      if (lang) { setLanguage(lang); localStorage.setItem('nexora_language', lang); }
    }).catch(() => {});
  }, []);
  async function out() { await fetch('/api/auth/logout', { method: 'POST' }); location.href = '/'; }
  return (<nav aria-label="Main" className="flex flex-wrap items-center gap-1 border-b border-white/10 px-4 py-3 text-sm">
    <Link href="/" className="mr-3 font-bold">NEXORA AI</Link>
    {links.map(([t,h]) => <Link key={h} href={h} className="rounded-lg px-2 py-1 hover:bg-white/10">{translate(t, language)}</Link>)}
    <button onClick={out} className="ml-auto rounded-lg border border-white/20 px-3 py-1">{translate('Sign out', language)}</button></nav>);
}
