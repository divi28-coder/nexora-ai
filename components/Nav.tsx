'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { translate } from '@/lib/i18n';

const groups = [
  {
    title: 'WORKSPACE',
    links: [
      { title: 'Overview', href: '/dashboard', icon: '⌂' },
      { title: 'Assistant', href: '/assistant', icon: '✳' },
      { title: 'Resume', href: '/resume', icon: '▤' },
      { title: 'Job Matcher', href: '/job-matcher', icon: '⌕' },
      { title: 'Questions', href: '/question-forge', icon: '☷' },
      { title: 'Interview', href: '/interview-studio', icon: '◉' },
    ],
  },
  {
    title: 'CAREER GROWTH',
    links: [
      { title: 'Universe', href: '/career-universe', icon: '✧' },
      { title: 'Skill Arena', href: '/skill-arena', icon: '♧' },
      { title: 'Roadmap', href: '/career-roadmap', icon: '↗' },
      { title: 'Radar', href: '/opportunity-radar', icon: '◎' },
      { title: 'Twin', href: '/career-twin', icon: '◈' },
    ],
  },
  {
    title: 'PERSONAL',
    links: [
      { title: 'Activity', href: '/activity', icon: '◷' },
      { title: 'Settings', href: '/settings', icon: '⚙' },
    ],
  },
];

export default function Nav() {
  const pathname = usePathname();
  const [language, setLanguage] = useState('en');
  const [signOutError, setSignOutError] = useState('');

  useEffect(() => {
    const local = localStorage.getItem('nexora_language');
    if (local) setLanguage(local);
    fetch('/api/profile')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        const lang = data?.profile?.language;
        if (lang) {
          setLanguage(lang);
          localStorage.setItem('nexora_language', lang);
        }
      })
      .catch(() => {});
  }, []);

  async function signOut() {
    setSignOutError('');
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) {
        throw new Error('Unable to sign out. Please try again.');
      }
      window.location.href = '/';
    } catch (error) {
      setSignOutError(error instanceof Error ? error.message : 'Unable to sign out. Please try again.');
    }
  }

  return (
    <aside className="app-sidebar">
      <Link href="/dashboard" className="app-brand" aria-label="NEXORA AI overview">
        <span className="app-brand-mark">N</span>
        <span className="app-brand-copy">
          <strong>NEXORA</strong>
          <small>CAREER INTELLIGENCE</small>
        </span>
      </Link>

      <nav aria-label="Main" className="app-navigation">
        {groups.map((group) => (
          <section className="app-nav-group" key={group.title}>
            <p className="app-nav-heading">{group.title}</p>
            {group.links.map(({ title, href, icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`app-nav-link${active ? ' is-active' : ''}`}
                >
                  <span className="app-nav-icon" aria-hidden="true">{icon}</span>
                  <span>{translate(title, language)}</span>
                  {active && <span className="app-nav-indicator" aria-hidden="true" />}
                </Link>
              );
            })}
          </section>
        ))}
      </nav>

      <div className="app-sidebar-footer">
        <div className="app-sidebar-note">
          <span className="app-status-dot" />
          <span><strong>Your career, in motion</strong><small>One step at a time.</small></span>
        </div>
        {signOutError && <p role="alert" className="text-xs text-danger">{signOutError}</p>}
        <button type="button" onClick={signOut} className="app-signout">
          <span aria-hidden="true">↪</span>
          {translate('Sign out', language)}
        </button>
      </div>
    </aside>
  );
}
