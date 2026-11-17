import Link from 'next/link';

export default function Home() {
  return (
    <main className="landing-shell mx-auto px-6 py-6 md:px-10">
      <nav className="landing-topbar" aria-label="Main">
        <Link href="/" className="landing-brand">
          <span className="app-brand-mark">N</span>
          <span>NEXORA AI</span>
        </Link>
        <Link href="/login" className="landing-signin">Sign in <span aria-hidden="true">↗</span></Link>
      </nav>

      <section className="landing-hero">
        <div className="landing-copy">
          <span className="landing-kicker"><span className="app-status-dot" /> YOUR CAREER, IN FOCUS</span>
          <h1>Your next chapter starts <span>with you.</span></h1>
          <p>
            Build confidence for what comes next. Understand your strengths,
            make your resume stand out, and practice for interviews in one
            thoughtful career workspace.
          </p>
          <div className="landing-actions">
            <Link href="/signup">Create your workspace <span aria-hidden="true">→</span></Link>
            <Link href="/demo">Explore resume tools</Link>
          </div>
          <p className="landing-disclaimer">Guidance for your journey. Your experience and decisions always come first.</p>
        </div>

        <div className="landing-visual" aria-hidden="true">
          <div className="landing-visual-orbit" />
          <span className="landing-visual-core">N</span>
          <div className="landing-float-card landing-float-one"><strong>Resume insights</strong><span>See your strengths clearly</span></div>
          <div className="landing-float-card landing-float-two"><strong>Practice with purpose</strong><span>Take your next step confidently</span></div>
        </div>
      </section>
    </main>
  );
}
