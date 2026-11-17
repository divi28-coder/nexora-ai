import Link from 'next/link';
import Nav from '@/components/Nav';

const tools = [
  { title: 'Resume Intelligence', href: '/resume', description: 'Build a stronger resume with clear, actionable feedback.', icon: '▤', tone: 'violet' },
  { title: 'AI Career Assistant', href: '/assistant', description: 'Get thoughtful guidance for your next career move.', icon: '✳', tone: 'cyan' },
  { title: 'Job Matcher', href: '/job-matcher', description: 'See how your experience aligns with a role.', icon: '⌕', tone: 'green' },
  { title: 'Question Forge', href: '/question-forge', description: 'Practice relevant questions for your target role.', icon: '☷', tone: 'amber' },
  { title: 'Interview Studio', href: '/interview-studio', description: 'Rehearse interviews and review your responses.', icon: '◉', tone: 'pink' },
  { title: 'Career Roadmap', href: '/career-roadmap', description: 'Turn your next career goal into manageable steps.', icon: '↗', tone: 'blue' },
  { title: 'Career Universe', href: '/career-universe', description: 'Explore role skills and identify learning gaps.', icon: '✧', tone: 'cyan' },
  { title: 'Skill Arena', href: '/skill-arena', description: 'Test your knowledge with focused skill challenges.', icon: '♧', tone: 'green' },
  { title: 'Opportunity Radar', href: '/opportunity-radar', description: 'Compare opportunities with your experience.', icon: '◎', tone: 'amber' },
  { title: 'Career Twin', href: '/career-twin', description: 'Review the progress and evidence you have saved.', icon: '◈', tone: 'violet' },
  { title: 'Activity history', href: '/activity', description: 'Pick up where you left off in your workspace.', icon: '◷', tone: 'blue' },
  { title: 'Settings', href: '/settings', description: 'Personalize your profile, language, and theme.', icon: '⚙', tone: 'pink' },
];

export default function Dashboard() {
  return (
    <>
      <Nav />
      <main className="workspace-main mx-auto max-w-6xl px-6">
        <header className="workspace-heading">
          <div>
            <p className="workspace-eyebrow">YOUR CAREER WORKSPACE</p>
            <h1 className="mt-2 text-3xl font-bold md:text-4xl">Make your next move count.</h1>
            <p className="mt-2 max-w-2xl text-sm" style={{ color: 'var(--muted)' }}>
              A clear space to build confidence, explore opportunities, and make progress on your career goals.
            </p>
          </div>
          <Link href="/assistant" className="workspace-coach-link">
            <span aria-hidden="true">✳</span> Ask your career coach
          </Link>
        </header>

        <section className="workspace-hero mt-7">
          <div className="workspace-hero-copy">
            <span className="workspace-pill"><span className="app-status-dot" /> YOUR NEXT STEP</span>
            <h2>Small steps. Real momentum.</h2>
            <p>Choose one thing to work on today. Your progress is saved as you use NEXORA.</p>
            <Link href="/interview-studio" className="workspace-primary-link">Practice an interview <span aria-hidden="true">→</span></Link>
          </div>
          <div className="workspace-orbit" aria-hidden="true">
            <span className="workspace-orbit-core">N</span>
            <i className="workspace-orbit-dot orbit-dot-one" />
            <i className="workspace-orbit-dot orbit-dot-two" />
            <i className="workspace-orbit-dot orbit-dot-three" />
          </div>
        </section>

        <div className="workspace-section-heading">
          <div>
            <p className="workspace-eyebrow">TOOLS FOR YOUR JOURNEY</p>
            <h2>Explore your workspace</h2>
          </div>
          <span>12 tools · all in one place</span>
        </div>

        <section className="workspace-tools-grid" aria-label="Career tools">
          {tools.map((tool) => (
            <Link key={tool.href} href={tool.href} className={`workspace-tool-card tone-${tool.tone}`}>
              <span className="workspace-tool-icon" aria-hidden="true">{tool.icon}</span>
              <span className="workspace-tool-arrow" aria-hidden="true">↗</span>
              <strong>{tool.title}</strong>
              <span className="workspace-tool-description">{tool.description}</span>
            </Link>
          ))}
        </section>
        <p className="workspace-disclaimer">Guidance and scores are estimates for learning and preparation; they do not predict hiring outcomes.</p>
      </main>
    </>
  );
}
