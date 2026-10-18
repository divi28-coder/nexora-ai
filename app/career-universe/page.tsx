'use client';

import { useMemo, useState } from 'react';
import Nav from '@/components/Nav';
import { useFetch } from '@/lib/hooks';

type ResumeVersion = { content?: { text?: string } | null; analysis?: unknown };
type Resume = { id: string; title: string; isActive: boolean; versions?: ResumeVersion[] };
type ResumeResponse = { resumes: Resume[] };
type SkillDefinition = { name: string; group: string; aliases: string[] };
type SkillResult = SkillDefinition & { score: number; gap: number; mentions: number; found: boolean };

// Scores represent resume evidence coverage, not tested ability. Add/edit role catalogues here as needed.
const ROLE_SKILLS: Record<string, SkillDefinition[]> = {
  'Data Analyst': [
    { name: 'SQL', group: 'Data', aliases: ['sql', 'postgresql', 'mysql', 'sqlite', 'sql server'] },
    { name: 'Excel / Spreadsheets', group: 'Reporting', aliases: ['excel', 'spreadsheet', 'pivot table', 'vlookup', 'xlookup', 'google sheets'] },
    { name: 'Python', group: 'Programming', aliases: ['python'] },
    { name: 'Power BI', group: 'Visualization', aliases: ['power bi', 'dax'] },
    { name: 'Tableau', group: 'Visualization', aliases: ['tableau'] },
    { name: 'Statistics', group: 'Analysis', aliases: ['statistics', 'statistical', 'hypothesis testing', 'regression', 'probability'] },
    { name: 'Data cleaning', group: 'Preparation', aliases: ['data cleaning', 'data cleansing', 'preprocessing', 'data wrangling'] },
    { name: 'Data visualization', group: 'Visualization', aliases: ['data visualization', 'dashboard', 'dashboards', 'charts', 'reporting'] },
    { name: 'Pandas', group: 'Programming', aliases: ['pandas'] },
    { name: 'Communication', group: 'Business', aliases: ['stakeholder', 'presentation', 'communicated insights', 'business requirements', 'communication'] },
  ],
  'Data Scientist': [
    { name: 'Python', group: 'Programming', aliases: ['python'] }, { name: 'SQL', group: 'Data', aliases: ['sql', 'postgresql', 'mysql'] },
    { name: 'Statistics / Probability', group: 'Math', aliases: ['statistics', 'statistical', 'probability', 'hypothesis testing'] },
    { name: 'Machine learning', group: 'ML', aliases: ['machine learning', 'scikit-learn', 'sklearn', 'classification', 'regression model'] },
    { name: 'Pandas / NumPy', group: 'Data', aliases: ['pandas', 'numpy'] }, { name: 'Visualization', group: 'Reporting', aliases: ['matplotlib', 'seaborn', 'plotly', 'data visualization'] },
    { name: 'Feature engineering', group: 'ML', aliases: ['feature engineering', 'feature selection'] }, { name: 'Model evaluation', group: 'ML', aliases: ['model evaluation', 'cross-validation', 'precision', 'recall', 'f1 score'] },
    { name: 'Deep learning', group: 'ML', aliases: ['deep learning', 'tensorflow', 'pytorch', 'neural network'] }, { name: 'Communication', group: 'Business', aliases: ['presentation', 'stakeholder', 'communicated', 'storytelling'] },
  ],
  'Backend Developer': [
    { name: 'JavaScript / TypeScript', group: 'Programming', aliases: ['javascript', 'typescript', 'node.js', 'nodejs'] }, { name: 'Python / Backend frameworks', group: 'Programming', aliases: ['python', 'django', 'flask', 'fastapi'] },
    { name: 'REST APIs', group: 'Backend', aliases: ['rest api', 'restful', 'api development', 'express'] }, { name: 'Databases', group: 'Data', aliases: ['sql', 'postgresql', 'mysql', 'mongodb', 'database'] },
    { name: 'Authentication', group: 'Security', aliases: ['authentication', 'authorization', 'jwt', 'oauth'] }, { name: 'Testing', group: 'Quality', aliases: ['jest', 'unit test', 'testing', 'pytest'] },
    { name: 'Git', group: 'Tools', aliases: ['git', 'github', 'gitlab'] }, { name: 'Docker', group: 'Deployment', aliases: ['docker', 'container'] },
    { name: 'Cloud deployment', group: 'Deployment', aliases: ['aws', 'azure', 'gcp', 'cloud deployment'] }, { name: 'Security', group: 'Security', aliases: ['owasp', 'security', 'encryption', 'rate limiting'] },
  ],
  'Frontend / Web Developer': [
    { name: 'HTML / CSS', group: 'Frontend', aliases: ['html', 'css', 'tailwind', 'sass'] }, { name: 'JavaScript / TypeScript', group: 'Programming', aliases: ['javascript', 'typescript'] },
    { name: 'React', group: 'Frontend', aliases: ['react', 'react.js', 'reactjs'] }, { name: 'Next.js', group: 'Frontend', aliases: ['next.js', 'nextjs'] },
    { name: 'Responsive design', group: 'UI', aliases: ['responsive design', 'mobile-first', 'media queries'] }, { name: 'Accessibility', group: 'UI', aliases: ['accessibility', 'aria', 'wcag'] },
    { name: 'API integration', group: 'Integration', aliases: ['api', 'fetch', 'axios', 'rest'] }, { name: 'Git', group: 'Tools', aliases: ['git', 'github', 'gitlab'] },
    { name: 'Testing', group: 'Quality', aliases: ['jest', 'vitest', 'playwright', 'cypress', 'testing'] }, { name: 'Performance', group: 'Quality', aliases: ['performance', 'optimization', 'lighthouse', 'web vitals'] },
  ],
  'DevOps / Cloud Engineer': [
    { name: 'Linux', group: 'Systems', aliases: ['linux', 'ubuntu', 'bash', 'shell scripting'] }, { name: 'Cloud platforms', group: 'Cloud', aliases: ['aws', 'amazon web services', 'azure', 'gcp', 'google cloud'] },
    { name: 'Docker', group: 'Containers', aliases: ['docker', 'containerization', 'containers'] }, { name: 'Kubernetes', group: 'Containers', aliases: ['kubernetes', 'k8s'] },
    { name: 'CI/CD', group: 'Automation', aliases: ['ci/cd', 'continuous integration', 'continuous deployment', 'github actions', 'jenkins'] }, { name: 'Infrastructure as code', group: 'Automation', aliases: ['terraform', 'ansible', 'cloudformation', 'infrastructure as code'] },
    { name: 'Monitoring', group: 'Reliability', aliases: ['prometheus', 'grafana', 'monitoring', 'observability'] }, { name: 'Networking', group: 'Systems', aliases: ['networking', 'tcp/ip', 'dns', 'load balancing'] },
  ],
  'Cybersecurity Analyst': [
    { name: 'Network security', group: 'Security', aliases: ['network security', 'firewall', 'tcp/ip', 'vpn'] }, { name: 'SIEM / Log analysis', group: 'Monitoring', aliases: ['siem', 'splunk', 'sentinel', 'log analysis'] },
    { name: 'Incident response', group: 'Response', aliases: ['incident response', 'incident handling', 'forensics'] }, { name: 'Vulnerability assessment', group: 'Assessment', aliases: ['vulnerability assessment', 'penetration testing', 'pentest', 'nessus'] },
    { name: 'Security frameworks', group: 'Governance', aliases: ['nist', 'iso 27001', 'cis controls', 'owasp'] }, { name: 'Scripting', group: 'Automation', aliases: ['python', 'powershell', 'bash'] },
    { name: 'Cloud security', group: 'Cloud', aliases: ['cloud security', 'iam', 'aws security', 'azure security'] }, { name: 'Risk reporting', group: 'Governance', aliases: ['risk assessment', 'compliance', 'security audit'] },
  ],
  'QA / Test Engineer': [
    { name: 'Test planning', group: 'Testing', aliases: ['test plan', 'test planning', 'test cases', 'test strategy'] }, { name: 'Manual testing', group: 'Testing', aliases: ['manual testing', 'functional testing', 'regression testing'] },
    { name: 'Automation', group: 'Automation', aliases: ['test automation', 'selenium', 'playwright', 'cypress'] }, { name: 'API testing', group: 'Testing', aliases: ['postman', 'api testing', 'rest assured'] },
    { name: 'Programming / scripting', group: 'Programming', aliases: ['python', 'java', 'javascript', 'typescript'] }, { name: 'Bug tracking', group: 'Quality', aliases: ['jira', 'bug tracking', 'defect tracking'] },
    { name: 'CI/CD', group: 'Delivery', aliases: ['ci/cd', 'jenkins', 'github actions', 'pipeline'] }, { name: 'Performance testing', group: 'Testing', aliases: ['jmeter', 'load testing', 'performance testing'] },
  ],
  'Product / Business Analyst': [
    { name: 'Requirements analysis', group: 'Analysis', aliases: ['requirements', 'user stories', 'acceptance criteria', 'business requirements'] }, { name: 'SQL', group: 'Data', aliases: ['sql', 'postgresql', 'mysql'] },
    { name: 'Excel / Spreadsheets', group: 'Data', aliases: ['excel', 'pivot table', 'power query', 'google sheets'] }, { name: 'Dashboards', group: 'Reporting', aliases: ['dashboard', 'dashboards', 'power bi', 'tableau'] },
    { name: 'Process mapping', group: 'Process', aliases: ['process mapping', 'workflow', 'bpmn', 'process improvement'] }, { name: 'Documentation', group: 'Communication', aliases: ['documentation', 'specification', 'brd', 'frd'] },
    { name: 'Agile / Scrum', group: 'Delivery', aliases: ['agile', 'scrum', 'sprint', 'backlog'] }, { name: 'Stakeholder management', group: 'Communication', aliases: ['stakeholder', 'cross-functional', 'client communication'] },
  ],
  'UI / UX Designer': [
    { name: 'Figma / design tools', group: 'Tools', aliases: ['figma', 'sketch', 'adobe xd', 'photoshop'] }, { name: 'Wireframing', group: 'Design', aliases: ['wireframe', 'wireframing', 'low-fidelity'] },
    { name: 'Prototyping', group: 'Design', aliases: ['prototype', 'prototyping', 'interactive prototype'] }, { name: 'User research', group: 'Research', aliases: ['user research', 'interviews', 'usability testing'] },
    { name: 'Information architecture', group: 'Design', aliases: ['information architecture', 'user flows', 'sitemap'] }, { name: 'Accessibility', group: 'Quality', aliases: ['accessibility', 'wcag', 'inclusive design'] },
    { name: 'Design systems', group: 'Systems', aliases: ['design system', 'component library', 'design tokens'] }, { name: 'Usability evaluation', group: 'Research', aliases: ['usability', 'heuristic evaluation', 'user testing'] },
  ],
  'Marketing Specialist': [
    { name: 'Content strategy', group: 'Content', aliases: ['content strategy', 'content marketing', 'editorial calendar'] }, { name: 'SEO', group: 'Digital', aliases: ['seo', 'search engine optimization', 'keyword research'] },
    { name: 'Social media', group: 'Digital', aliases: ['social media', 'instagram', 'linkedin', 'facebook', 'tiktok'] }, { name: 'Analytics', group: 'Measurement', aliases: ['google analytics', 'ga4', 'campaign analytics', 'metrics'] },
    { name: 'Paid campaigns', group: 'Advertising', aliases: ['google ads', 'paid media', 'ppc', 'meta ads'] }, { name: 'Email marketing', group: 'Digital', aliases: ['email marketing', 'mailchimp', 'marketing automation'] },
    { name: 'Copywriting', group: 'Content', aliases: ['copywriting', 'copywriting', 'campaign copy'] }, { name: 'Reporting', group: 'Measurement', aliases: ['reporting', 'conversion rate', 'roi', 'performance report'] },
  ],
  'Finance Analyst': [
    { name: 'Financial modelling', group: 'Finance', aliases: ['financial modeling', 'financial modelling', 'forecasting'] }, { name: 'Excel', group: 'Tools', aliases: ['excel', 'pivot table', 'financial functions'] },
    { name: 'Accounting principles', group: 'Finance', aliases: ['accounting', 'gaap', 'ifrs', 'balance sheet'] }, { name: 'Budgeting', group: 'Planning', aliases: ['budgeting', 'budget', 'variance analysis'] },
    { name: 'Financial reporting', group: 'Reporting', aliases: ['financial reporting', 'income statement', 'cash flow'] }, { name: 'Data analysis', group: 'Analysis', aliases: ['data analysis', 'trend analysis', 'quantitative analysis'] },
    { name: 'SQL / BI tools', group: 'Tools', aliases: ['sql', 'power bi', 'tableau'] }, { name: 'Communication', group: 'Business', aliases: ['stakeholder', 'presentation', 'business partner'] },
  ],
  'HR Specialist': [
    { name: 'Recruitment', group: 'People', aliases: ['recruitment', 'talent acquisition', 'candidate sourcing'] }, { name: 'HR information systems', group: 'Systems', aliases: ['hris', 'workday', 'successfactors', 'human resources information system'] },
    { name: 'Employee relations', group: 'People', aliases: ['employee relations', 'conflict resolution', 'employee engagement'] }, { name: 'Employment compliance', group: 'Compliance', aliases: ['employment law', 'labor law', 'compliance', 'policy'] },
    { name: 'Onboarding', group: 'People', aliases: ['onboarding', 'orientation', 'new hire'] }, { name: 'Performance management', group: 'People', aliases: ['performance management', 'performance review', 'appraisal'] },
    { name: 'HR analytics', group: 'Analytics', aliases: ['hr analytics', 'workforce analytics', 'headcount'] }, { name: 'Communication', group: 'People', aliases: ['communication', 'stakeholder', 'confidentiality'] },
  ],
  'Teacher / Educator': [
    { name: 'Lesson planning', group: 'Teaching', aliases: ['lesson planning', 'lesson plan', 'curriculum planning'] }, { name: 'Classroom management', group: 'Teaching', aliases: ['classroom management', 'student behavior'] },
    { name: 'Assessment', group: 'Evaluation', aliases: ['assessment', 'rubric', 'grading', 'formative assessment'] }, { name: 'Differentiated instruction', group: 'Teaching', aliases: ['differentiated instruction', 'inclusive education', 'individual learning'] },
    { name: 'Learning technology', group: 'Technology', aliases: ['google classroom', 'moodle', 'learning management system', 'lms'] }, { name: 'Student support', group: 'Support', aliases: ['student support', 'student engagement', 'mentoring'] },
    { name: 'Communication', group: 'People', aliases: ['parent communication', 'communication', 'collaboration'] }, { name: 'Subject expertise', group: 'Teaching', aliases: ['curriculum', 'subject matter', 'educational'] },
  ],
  'Project Manager': [
    { name: 'Project planning', group: 'Delivery', aliases: ['project planning', 'project schedule', 'work breakdown structure'] }, { name: 'Agile / Scrum', group: 'Methods', aliases: ['agile', 'scrum', 'kanban', 'sprint'] },
    { name: 'Risk management', group: 'Planning', aliases: ['risk management', 'risk register', 'mitigation'] }, { name: 'Stakeholder management', group: 'People', aliases: ['stakeholder', 'client management', 'cross-functional'] },
    { name: 'Budget / resources', group: 'Planning', aliases: ['budget', 'resource planning', 'cost management'] }, { name: 'Reporting', group: 'Communication', aliases: ['status report', 'project reporting', 'dashboard'] },
    { name: 'Project tools', group: 'Tools', aliases: ['jira', 'asana', 'microsoft project', 'trello'] }, { name: 'Leadership', group: 'People', aliases: ['leadership', 'team management', 'facilitation'] },
  ],
  'General / Other Professional': [
    { name: 'Communication', group: 'Core', aliases: ['communication', 'presentation', 'stakeholder', 'client'] }, { name: 'Problem solving', group: 'Core', aliases: ['problem solving', 'troubleshooting', 'root cause'] },
    { name: 'Project delivery', group: 'Delivery', aliases: ['project', 'delivered', 'implemented', 'launched'] }, { name: 'Team collaboration', group: 'Core', aliases: ['teamwork', 'collaboration', 'cross-functional'] },
    { name: 'Digital tools', group: 'Tools', aliases: ['excel', 'office 365', 'google workspace', 'software'] }, { name: 'Planning / organization', group: 'Core', aliases: ['planning', 'organized', 'coordination', 'prioritization'] },
    { name: 'Research / analysis', group: 'Analysis', aliases: ['research', 'analysis', 'analyzed', 'analysed'] }, { name: 'Documentation', group: 'Delivery', aliases: ['documentation', 'reports', 'record keeping'] },
  ],
};
const ROLE_NAMES = Object.keys(ROLE_SKILLS);

function mentionsOf(text: string, aliases: string[]) {
  let count = 0;
  for (const alias of aliases) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matches = text.match(new RegExp(`\\b${escaped}\\b`, 'gi'));
    count += matches?.length ?? 0;
  }
  return count;
}
function inferRole(text: string) {
  const lower = text.toLowerCase();
  const cues: Record<string, string[]> = {
    'Data Analyst': ['data analyst', 'power bi', 'tableau', 'data visualization', 'business intelligence'],
    'Data Scientist': ['data scientist', 'machine learning', 'scikit-learn', 'tensorflow', 'pytorch'],
    'Backend Developer': ['backend', 'back-end', 'node.js', 'api development', 'django', 'fastapi'],
    'Frontend / Web Developer': ['web developer', 'frontend', 'front-end', 'react', 'next.js', 'html', 'css'],
    'DevOps / Cloud Engineer': ['devops', 'kubernetes', 'terraform', 'aws', 'azure', 'ci/cd'],
    'Cybersecurity Analyst': ['cybersecurity', 'cyber security', 'siem', 'incident response', 'penetration testing'],
    'QA / Test Engineer': ['quality assurance', 'qa engineer', 'test automation', 'selenium', 'playwright'],
    'Product / Business Analyst': ['business analyst', 'product analyst', 'requirements analysis', 'user stories', 'process mapping'],
    'UI / UX Designer': ['ux designer', 'ui designer', 'figma', 'wireframing', 'user research'],
    'Marketing Specialist': ['marketing', 'seo', 'campaign', 'content strategy', 'google ads'],
    'Finance Analyst': ['finance analyst', 'financial analyst', 'financial modelling', 'financial modeling', 'forecasting'],
    'HR Specialist': ['human resources', 'hr specialist', 'talent acquisition', 'recruitment'],
    'Teacher / Educator': ['teacher', 'educator', 'lesson planning', 'classroom management', 'curriculum'],
    'Project Manager': ['project manager', 'project management', 'pmp', 'project planning', 'risk register'],
  };
  const ranked = ROLE_NAMES.filter(r => r !== 'General / Other Professional').map(role => ({ role, score: (cues[role] ?? []).reduce((sum, cue) => sum + (lower.includes(cue) ? 1 : 0), 0) })).sort((a, b) => b.score - a.score);
  return ranked[0]?.score ? ranked[0].role : 'General / Other Professional';
}
function analyzeSkills(text: string, role: string): SkillResult[] {
  const lower = text.toLowerCase();
  const projectEvidence = /project|experience|built|developed|implemented|created|analyzed|analysed|designed|delivered/i.test(text);
  return ROLE_SKILLS[role].map(skill => {
    const mentions = mentionsOf(lower, [skill.name, ...skill.aliases]);
    const found = mentions > 0;
    const score = found ? Math.min(95, 35 + Math.min(mentions, 4) * 10 + (projectEvidence ? 10 : 0)) : 0;
    return { ...skill, mentions, found, score, gap: 100 - score };
  });
}

export default function Universe() {
  const { data, err, loading, reload } = useFetch<ResumeResponse>('/api/resume');
  const resumes = data?.resumes ?? [];
  const activeResume = resumes.find(r => r.isActive) ?? resumes[0];
  const resumeText = activeResume?.versions?.[0]?.content?.text ?? '';
  const inferredRole = useMemo(() => resumeText ? inferRole(resumeText) : 'General / Other Professional', [resumeText]);
  const [chosenRole, setChosenRole] = useState('');
  const role = chosenRole || inferredRole;
  const skills = useMemo(() => resumeText ? analyzeSkills(resumeText, role) : [], [resumeText, role]);
  const found = skills.filter(s => s.found).sort((a, b) => b.score - a.score);
  const gaps = [...skills].sort((a, b) => b.gap - a.gap);
  const coverage = skills.length ? Math.round(skills.reduce((sum, s) => sum + s.score, 0) / skills.length) : 0;
  const learningGap = 100 - coverage;

  return <><Nav /><main className="mx-auto max-w-6xl space-y-5 p-4 md:p-6">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--accent2)' }}>NEXORA AI · RESUME INSIGHTS</p><h1 className="mt-1 text-3xl font-bold md:text-4xl">Career Universe</h1><p className="mt-2 max-w-3xl text-sm" style={{ color: 'var(--muted)' }}>Turn your active resume into a role-specific skill coverage graph and a prioritized learning-gap plan.</p></div><button onClick={() => reload()} className="rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/5">Refresh resume data</button></header>
    {loading && <section className="panel text-sm" style={{ color: 'var(--muted)' }}>Loading your saved resume…</section>}
    {err && <section className="panel"><p className="text-sm text-red-400">Could not load your resume: {err}</p><p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>Please sign in and try refreshing.</p></section>}
    {!loading && !err && !resumeText && <section className="panel"><h2 className="text-xl font-semibold">No readable resume found</h2><p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>Upload a resume in Resume Studio first. After the upload succeeds, return here and press Refresh resume data.</p><a href="/resume" className="mt-4 inline-flex rounded-xl bg-violet px-4 py-2 font-semibold">Open Resume Studio</a></section>}
    {!!resumeText && <>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="panel"><p className="text-sm" style={{ color: 'var(--muted)' }}>Resume analyzed</p><p className="mt-2 break-words text-lg font-semibold">{activeResume?.title ?? 'Active resume'}</p><p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>{resumeText.length.toLocaleString()} characters read</p></div>
        <div className="panel"><p className="text-sm" style={{ color: 'var(--muted)' }}>Suggested role</p><p className="mt-2 text-lg font-semibold">{inferredRole}</p><p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>Inferred from resume keywords</p></div>
        <div className="panel"><p className="text-sm" style={{ color: 'var(--muted)' }}>Skills detected</p><p className="mt-2 text-3xl font-bold">{found.length}<span className="text-base font-normal" style={{ color: 'var(--muted)' }}> / {skills.length}</span></p><p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>Terms detected for selected role</p></div>
        <div className="panel"><p className="text-sm" style={{ color: 'var(--muted)' }}>Average evidence coverage</p><p className="mt-2 text-3xl font-bold">{coverage}%</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-violet-400" style={{ width: `${coverage}%` }} /></div><p className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>Learning-gap indicator: {learningGap}%</p></div>
      </section>
      <section className="panel flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-xl font-bold">Resume skill graph</h2><p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>Choose any supported role to compare your resume against that role&apos;s common skills.</p></div><label className="block text-sm font-medium">Target role<select value={role} onChange={e => setChosenRole(e.target.value)} className="mt-1 block min-w-60 rounded-xl border border-white/15 bg-slate-950 px-3 py-2 text-white">{ROLE_NAMES.map(name => <option key={name} value={name}>{name}</option>)}</select></label></section>
      <section className="panel"><div className="flex flex-wrap gap-4 text-xs"><span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm" style={{ background: '#22d3ee' }} />Resume evidence (%)</span><span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm" style={{ background: '#a78bfa' }} />Learning gap / study priority (%)</span></div>
        <div className="mt-5 space-y-5">{skills.map(skill => <div key={skill.name}>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><div><span className="font-semibold">{skill.name}</span><span className="ml-2 text-xs" style={{ color: 'var(--muted)' }}>{skill.group}</span></div><span className="text-sm tabular-nums"><b>{skill.score}%</b> evidence <span style={{ color: 'var(--muted)' }}>·</span> <b>{skill.gap}%</b> gap</span></div>
          <div className="space-y-2"><div className="flex items-center gap-3"><span className="w-20 shrink-0 text-xs" style={{ color: 'var(--muted)' }}>Evidence</span><div className="h-3 flex-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full transition-all" style={{ width: `${skill.score}%`, background: 'linear-gradient(90deg,#22d3ee,#0891b2)' }} /></div><span className="w-10 text-right text-xs tabular-nums">{skill.score}%</span></div>
          <div className="flex items-center gap-3"><span className="w-20 shrink-0 text-xs" style={{ color: 'var(--muted)' }}>Study gap</span><div className="h-3 flex-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full transition-all" style={{ width: `${skill.gap}%`, background: 'linear-gradient(90deg,#a78bfa,#7c3aed)' }} /></div><span className="w-10 text-right text-xs tabular-nums">{skill.gap}%</span></div></div>
          <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>{skill.found ? `Found ${skill.mentions} matching mention(s) in your resume.` : 'Not detected in the resume text. Learn it if relevant, or add truthful evidence if you already have the skill.'}</p>
        </div>)}</div>
        <p className="mt-6 rounded-xl border border-white/10 p-3 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>Important: these are heuristic resume-text estimates, not measured proficiency or a guarantee of what you must study. Evidence percentage is based on keyword mentions and resume context; study gap is calculated as 100 minus that estimate. A missing keyword does not prove you lack the skill.</p>
      </section>
      <section className="grid gap-5 lg:grid-cols-2"><div className="panel"><h2 className="text-lg font-bold">Highest-priority learning gaps</h2><p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>Skills with the least visible evidence are listed first.</p><div className="mt-4 space-y-3">{gaps.slice(0, 5).map((s, i) => <div key={s.name} className="flex items-center gap-3 rounded-xl border border-white/10 p-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-sm font-bold">{i + 1}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap justify-between gap-2"><b>{s.name}</b><span className="text-sm">{s.gap}% gap</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-violet-400" style={{ width: `${s.gap}%` }} /></div></div></div>)}</div></div>
        <div className="panel"><h2 className="text-lg font-bold">Skills detected in your resume</h2><p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>These terms were found in your resume. Make sure you can explain where you used each one.</p>{found.length ? <div className="mt-4 flex flex-wrap gap-2">{found.map(s => <span key={s.name} className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-sm">{s.name} <b className="ml-1">{s.score}%</b></span>)}</div> : <p className="mt-4 text-sm">No matching terms were detected for this role.</p>}<a href="/resume" className="mt-5 block rounded-xl bg-violet px-4 py-3 text-center font-semibold">Update resume in Resume Studio</a></div></section>
    </>}
  </main></>;
}
