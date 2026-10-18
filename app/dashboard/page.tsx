import Link from 'next/link';
import Nav from '@/components/Nav';
const cards = [
  ['Resume Intelligence', '/resume', 'Upload, analyze, edit, version'], ['AI Career Assistant', '/assistant', 'Ask NEXORA Guide'],
  ['Job Matcher', '/job-matcher', 'Compare a resume with a job description'], ['Question Forge', '/question-forge', 'Generate interview questions'],
  ['Interview Studio', '/interview-studio', 'Text interview with feedback'], ['Career Roadmap', '/career-roadmap', 'Track your 4-week plan'],
  ['Career Universe', '/career-universe', 'Skill and role map'], ['Skill Arena', '/skill-arena', 'Quizzes that record evidence'], ['Opportunity Radar', '/opportunity-radar', 'Sort pasted job descriptions'],
  ['Career Twin', '/career-twin', 'Your evidence and progress'], ['Activity history', '/activity', 'What you did, when'], ['Settings', '/settings', 'Export or delete your data']
];
export default function Dashboard() {
  return (<><Nav /><main className="mx-auto max-w-5xl p-8"><h1 className="text-3xl font-bold">Career Control Room</h1>
    <p className="mt-1 text-sm" style={{color:'var(--muted)'}}>You are signed in. Cards below use your own saved data.</p>
    <div className="panel mt-6"><b>Next best action (sample)</b><p className="text-sm">Practice explaining your student management system. The sample resume has one vague project bullet.</p>
      <Link href="/interview-studio" className="mt-2 inline-block rounded-xl bg-violet px-4 py-2 font-semibold">Start practice</Link></div>
    <div className="mt-6 grid gap-4 md:grid-cols-3">{cards.map(([t, h, d]) => <Link key={t} href={h} className="panel block hover:border-white/40"><b>{t}</b><p className="text-sm" style={{color:'var(--muted)'}}>{d}</p></Link>)}</div>
    </main></>);
}
