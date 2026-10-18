import Link from "next/link";
export default function Home(){return(<main className="mx-auto max-w-5xl px-6 py-20">
<h1 className="text-5xl font-bold leading-tight">Your Next Interview Starts Here.</h1>
<p className="mt-5 max-w-xl text-lg" style={{color:"var(--muted)"}}>Understand your strengths, improve your resume, and practice with an AI recruiter before your next real interview.</p>
<div className="mt-8 flex flex-wrap gap-3">
<Link href="/assistant" className="rounded-xl bg-violet px-5 py-3 font-semibold">Meet Your AI Career Coach</Link>
<Link href="/interview-studio" className="rounded-xl border border-cyan px-5 py-3">Try a Mock Interview</Link>
<Link href="/demo" className="rounded-xl border border-emerald px-5 py-3">Analyze My Resume</Link></div>
<p className="mt-10 text-sm" style={{color:"var(--muted)"}}>Demo mode uses sample data. Scores are estimates and do not predict hiring outcomes.</p></main>)}
