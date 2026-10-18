'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Nav from '@/components/Nav';
import { diffLines } from '@/lib/resume/compare';

type Finding = {
  identified: string;
  why: string;
  suggestion: string;
  evidence: string;
  needsUserConfirmation: boolean;
};

type ResumeVersion = {
  version: number;
  content: { text: string };
  analysis: { overall: number; mode: string; findings: Finding[] } | null;
};

type ResumeRecord = { id: string; title: string; versions: ResumeVersion[] };
type ResumeListItem = { id: string; title: string };
type Check = { label: string; passed: boolean; detail: string };
type KeywordResults = { matched: string[]; missing: string[] };

const ROLE_KEYWORDS: Record<string, string[]> = {
  'Data Analyst': ['SQL', 'Excel', 'Python', 'Power BI', 'Tableau', 'data cleaning', 'data visualization', 'statistics', 'dashboard', 'reporting', 'MySQL', 'PostgreSQL'],
  'Software Developer': ['JavaScript', 'TypeScript', 'Python', 'Java', 'Git', 'REST API', 'testing', 'debugging', 'SQL', 'React', 'Node.js', 'data structures', 'algorithms'],
  'Frontend Developer': ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Next.js', 'accessibility', 'responsive design', 'Git', 'testing', 'performance'],
  'Backend Developer': ['Node.js', 'Python', 'Java', 'SQL', 'REST API', 'authentication', 'database design', 'testing', 'Docker', 'Git', 'security'],
  'Digital Marketing': ['SEO', 'content marketing', 'Google Analytics', 'social media', 'campaign management', 'keyword research', 'email marketing', 'conversion rate', 'reporting'],
  'UI/UX Designer': ['Figma', 'wireframes', 'prototyping', 'user research', 'usability testing', 'accessibility', 'design systems', 'interaction design', 'user flows'],
};

function extractKeywords(input: string): string[] {
  const words = input.toLowerCase().match(/[a-z][a-z0-9+#.-]{1,}/g) ?? [];
  const stopWords = new Set([
    'the', 'and', 'for', 'with', 'from', 'this', 'that', 'your', 'you', 'our',
    'are', 'was', 'were', 'will', 'have', 'has', 'had', 'not', 'but', 'all',
    'any', 'can', 'who', 'what', 'when', 'where', 'how', 'into', 'their',
    'they', 'them', 'about', 'using', 'used', 'use', 'work', 'working', 'role',
    'job', 'team', 'skills', 'skill', 'ability', 'including', 'required',
    'preferred', 'responsibilities', 'requirements', 'experience', 'years',
    'year', 'candidate', 'strong', 'good', 'excellent', 'knowledge', 'related',
    'must', 'should', 'within', 'across', 'such', 'also', 'other', 'which',
  ]);
  const frequency = new Map<string, number>();
  for (const word of words) {
    if (word.length < 3 || stopWords.has(word)) continue;
    frequency.set(word, (frequency.get(word) ?? 0) + 1);
  }
  return [...frequency.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([word]) => word);
}

function makeChecks(text: string): Check[] {
  const normalized = text.toLowerCase();
  const lines = text.split(/\r?\n/).map((line) => line.trim());
  const hasEmail = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(text);
  const hasPhone = /(?:\+?\d[\d\s().-]{7,}\d)/.test(text);
  const hasSummary = /\b(summary|professional summary|profile|objective)\b/i.test(text);
  const hasExperience = /\b(experience|employment|work history|internship)\b/i.test(text);
  const hasEducation = /\b(education|academic|qualification|degree)\b/i.test(text);
  const hasSkills = /\b(technical skills|skills|core competencies|key skills)\b/i.test(text);
  const hasProjects = /\b(projects|personal projects|academic projects)\b/i.test(text);
  const bullets = lines.filter((line) => /^[-•*▪]\s+/.test(line));
  const actionVerbs = /\b(developed|built|created|analyzed|analysed|implemented|improved|designed|managed|led|automated|delivered|reduced|increased|optimized|optimised|tested|deployed|organized|organised|coordinated)\b/i;
  const hasActionLanguage = bullets.some((line) => actionVerbs.test(line));
  const hasDates = /\b(?:19|20)\d{2}\b/.test(text);
  const hasLinks = /\b(?:linkedin\.com|github\.com|portfolio)\b/i.test(text);
  const hasMeasurableResults = /\b\d+(?:\.\d+)?\s*(?:%|percent|users|clients|projects|hours|days|weeks|months|years|reports|records)\b/i.test(text);
  const length = text.trim().length;

  return [
    { label: 'Email address', passed: hasEmail, detail: hasEmail ? 'An email address was found.' : 'Add a professional email address if applicable.' },
    { label: 'Phone number', passed: hasPhone, detail: hasPhone ? 'A possible phone number was found.' : 'Consider including a contact number.' },
    { label: 'Professional summary', passed: hasSummary, detail: hasSummary ? 'A summary or profile heading was found.' : 'Consider adding a short, role-specific summary.' },
    { label: 'Experience or internships', passed: hasExperience, detail: hasExperience ? 'An experience-related heading was found.' : 'Add employment or internship experience if applicable; freshers can emphasize projects.' },
    { label: 'Education', passed: hasEducation, detail: hasEducation ? 'An education-related heading was found.' : 'Add your education and relevant qualifications.' },
    { label: 'Skills section', passed: hasSkills, detail: hasSkills ? 'A skills-related heading was found.' : 'Add a clearly labeled skills section with relevant skills.' },
    { label: 'Projects', passed: hasProjects, detail: hasProjects ? 'A projects heading was found.' : 'Consider adding relevant projects, especially as a student or fresher.' },
    { label: 'Action-oriented bullet points', passed: hasActionLanguage, detail: hasActionLanguage ? 'Some bullet points use action-oriented language.' : 'Describe what you actually built, analyzed, improved, or delivered.' },
    { label: 'Dates or timelines', passed: hasDates, detail: hasDates ? 'A year was found; check dates for accuracy.' : 'Include relevant dates where appropriate.' },
    { label: 'Professional links', passed: hasLinks, detail: hasLinks ? 'A LinkedIn, GitHub, or portfolio reference was found.' : 'Consider adding relevant professional links.' },
    { label: 'Evidence of results', passed: hasMeasurableResults, detail: hasMeasurableResults ? 'A possible quantified result was found. Verify it.' : 'Where truthful, describe outcomes using real numbers.' },
    { label: 'Readable resume length', passed: length >= 300 && length <= 15000, detail: length < 300 ? 'The resume text is short; check for missing sections.' : length > 15000 ? 'The resume is long; review repetition and relevance.' : 'The text length looks reasonable for this basic check.' },
    { label: 'Text-based content', passed: length >= 300 && !/^\s*$/.test(normalized), detail: 'This checks extracted text only; it cannot confirm how an ATS parses the original file.' },
  ];
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export default function ResumePage() {
  const [list, setList] = useState<ResumeListItem[]>([]);
  const [cur, setCur] = useState<ResumeRecord | null>(null);
  const [text, setText] = useState('');
  const [paste, setPaste] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [vsel, setVsel] = useState(0);
  const [tab, setTab] = useState<'overview' | 'keywords' | 'guide'>('overview');

  const loadList = useCallback(async () => {
    try {
      const response = await fetch('/api/resume');
      const data = await readJson(response);
      if (!response.ok) {
        setErr(typeof data.error === 'string' ? data.error : 'Could not load resumes.');
        return;
      }
      setList(Array.isArray(data.resumes) ? data.resumes as ResumeListItem[] : []);
    } catch {
      setErr('Could not connect to the server while loading resumes.');
    }
  }, []);

  const open = useCallback(async (id: string) => {
    setErr('');
    try {
      const response = await fetch(`/api/resume/${encodeURIComponent(id)}`);
      const data = await readJson(response);
      const resume = data.resume as ResumeRecord | undefined;
      if (!response.ok || !resume) {
        setErr(typeof data.error === 'string' ? data.error : 'Could not open resume.');
        return;
      }
      setCur(resume);
      setVsel(0);
      setText(resume.versions?.[0]?.content?.text ?? '');
    } catch {
      setErr('Could not connect to the server.');
    }
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  async function create(body: BodyInit, isJson: boolean) {
    setErr('');
    setMsg('');
    setBusy(true);
    try {
      const response = await fetch('/api/resume', {
        method: 'POST',
        body,
        headers: isJson ? { 'Content-Type': 'application/json' } : undefined,
      });
      const data = await readJson(response);
      if (!response.ok) {
        setErr(typeof data.error === 'string' ? data.error : 'Resume could not be saved.');
        return;
      }
      if (typeof data.id !== 'string') {
        setErr('The server did not return a resume ID.');
        return;
      }
      setPaste('');
      setMsg('Resume saved and analyzed.');
      await loadList();
      await open(data.id);
    } catch {
      setErr('Could not connect to the server. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function saveVersion() {
    if (!cur) return;
    setBusy(true);
    setErr('');
    setMsg('');
    try {
      const response = await fetch(`/api/resume/${encodeURIComponent(cur.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await readJson(response);
      if (!response.ok) {
        setErr(typeof data.error === 'string' ? data.error : 'Could not save this version.');
        return;
      }
      setMsg(typeof data.version === 'number' ? `Saved as version ${data.version}.` : 'Resume version saved.');
      await open(cur.id);
      await loadList();
    } catch {
      setErr('Could not connect to the server. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function deleteResume() {
    if (!cur || !window.confirm('Delete this resume and all versions?')) return;
    setBusy(true);
    setErr('');
    setMsg('');
    try {
      const response = await fetch(`/api/resume/${encodeURIComponent(cur.id)}`, { method: 'DELETE' });
      const data = await readJson(response);
      if (!response.ok) {
        setErr(typeof data.error === 'string' ? data.error : 'Could not delete the resume.');
        return;
      }
      setCur(null);
      setText('');
      setMsg('Resume deleted.');
      await loadList();
    } catch {
      setErr('Could not connect to the server.');
    } finally {
      setBusy(false);
    }
  }

  const shown = cur?.versions?.[vsel];
  const analysis = shown?.analysis ?? null;
  const checks = useMemo(() => makeChecks(text), [text]);
  const passedChecks = checks.filter((check) => check.passed).length;
  const atsScore = Math.round((passedChecks / Math.max(checks.length, 1)) * 100);
  const keywordResults = useMemo<KeywordResults>(() => {
    if (!jobDescription.trim() || !text.trim()) return { matched: [], missing: [] };
    const resume = text.toLowerCase();
    const keywords = extractKeywords(jobDescription).slice(0, 30);
    return {
      matched: keywords.filter((word) => resume.includes(word)),
      missing: keywords.filter((word) => !resume.includes(word)),
    };
  }, [jobDescription, text]);
  const suggestedKeywords = ROLE_KEYWORDS[targetRole] ?? [];
  const diff = cur && cur.versions.length > 1 && vsel < cur.versions.length - 1
    ? diffLines(cur.versions[vsel + 1].content.text, cur.versions[vsel].content.text)
    : null;

  function appendTemplate(template: string, message: string) {
    setText((previous) => previous.trim() ? `${previous.trim()}\n\n${template}` : template);
    setMsg(message);
    setErr('');
  }

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-6xl space-y-6 p-6">
        <header>
          <p className="text-sm font-semibold uppercase tracking-widest text-violet-400">Career intelligence</p>
          <h1 className="mt-2 text-3xl font-bold">Resume Intelligence</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
            Improve your resume, check common ATS-readiness signals, and compare it with a target job.
            Scores are estimates, not predictions of hiring outcomes.
          </p>
        </header>

        <section className="panel space-y-4">
          <h2 className="text-xl font-bold">Add a resume</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">
                Upload PDF, DOCX, or TXT
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  disabled={busy}
                  className="mt-2 block w-full text-sm"
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0];
                    if (file) {
                      const formData = new FormData();
                      formData.append('file', file);
                      void create(formData, false);
                    }
                    event.currentTarget.value = '';
                  }}
                />
              </label>
              <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
                Scanned PDFs may require pasted text. Upload limits are enforced by the server.
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">
                Or paste resume text
                <textarea
                  value={paste}
                  onChange={(event) => setPaste(event.target.value)}
                  rows={4}
                  maxLength={20000}
                  className="mt-2 w-full rounded-xl border border-white/20 bg-transparent p-3"
                  placeholder="Paste your resume here..."
                />
              </label>
              <button
                type="button"
                disabled={busy || paste.trim().length < 50}
                onClick={() => void create(JSON.stringify({ text: paste, title: 'Pasted resume' }), true)}
                className="mt-2 rounded-xl bg-violet px-4 py-2 font-semibold disabled:opacity-50"
              >
                {busy ? 'Processing...' : 'Analyze pasted text'}
              </button>
            </div>
          </div>
        </section>

        {err && <p role="alert" className="text-sm text-danger">{err}</p>}
        {msg && <p role="status" className="text-sm" style={{ color: 'var(--ok)' }}>{msg}</p>}

        <section className="space-y-3">
          <h2 className="text-xl font-bold">Your resumes</h2>
          {list.length === 0 ? (
            <div className="panel text-sm">No resumes yet. Upload or paste a resume to begin.</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {list.map((resume) => (
                <button
                  type="button"
                  key={resume.id}
                  onClick={() => void open(resume.id)}
                  className={`rounded-xl border px-3 py-2 text-sm ${cur?.id === resume.id ? 'border-cyan' : 'border-white/20'}`}
                >
                  {resume.title}
                </button>
              ))}
            </div>
          )}
        </section>

        {cur && shown && (
          <>
            <nav className="flex flex-wrap gap-2" aria-label="Resume tools">
              {([
                ['overview', 'ATS Overview'],
                ['keywords', 'Keyword Matcher'],
                ['guide', 'Resume Writing Guide'],
              ] as const).map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setTab(value)}
                  className={`rounded-xl border px-4 py-2 text-sm font-semibold ${tab === value ? 'border-cyan' : 'border-white/20'}`}
                  aria-pressed={tab === value}
                >
                  {label}
                </button>
              ))}
            </nav>

            {tab === 'overview' && (
              <div className="grid items-start gap-4 lg:grid-cols-2">
                <section className="panel space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-xl font-bold">Resume editor</h2>
                    <label className="text-sm">
                      Version
                      <select
                        value={vsel}
                        onChange={(event) => {
                          const index = Number(event.target.value);
                          setVsel(index);
                          setText(cur.versions[index]?.content?.text ?? '');
                        }}
                        className="ml-2 rounded border border-white/20 bg-[#111827] px-2 py-1"
                      >
                        {cur.versions.map((version, index) => (
                          <option key={version.version} value={index}>v{version.version}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <textarea
                    id="resume-editor"
                    aria-label="Resume text editor"
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    rows={20}
                    maxLength={20000}
                    className="w-full rounded-xl border border-white/20 bg-transparent p-3 text-sm"
                  />
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    {text.length}/20,000 characters. Keep claims accurate. Saving creates a new version.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void saveVersion()}
                      disabled={busy || text === shown.content.text}
                      className="rounded-xl bg-violet px-4 py-2 font-semibold disabled:opacity-50"
                    >
                      Save new version
                    </button>
                    <a href={`/api/resume/${encodeURIComponent(cur.id)}?export=txt`} className="rounded-xl border border-white/20 px-4 py-2">
                      Export TXT
                    </a>
                    <button
                      type="button"
                      onClick={() => void deleteResume()}
                      disabled={busy}
                      className="rounded-xl border border-danger px-4 py-2 text-danger disabled:opacity-50"
                    >
                      Delete resume
                    </button>
                  </div>
                  {diff && (
                    <div className="border-t border-white/10 pt-3 text-sm">
                      <h3 className="font-semibold">Changes from previous version</h3>
                      {diff.added.map((line, index) => <p key={`added-${index}`} style={{ color: 'var(--ok)' }}>+ {line}</p>)}
                      {diff.removed.map((line, index) => <p key={`removed-${index}`} className="text-danger">− {line}</p>)}
                      {diff.added.length === 0 && diff.removed.length === 0 && <p style={{ color: 'var(--muted)' }}>No text changes detected.</p>}
                    </div>
                  )}
                </section>

                <div className="space-y-4">
                  <section className="panel">
                    <h2 className="text-xl font-bold">ATS-readiness checklist</h2>
                    <div className="mt-3 flex items-end gap-3">
                      <p className="text-4xl font-bold">{atsScore}/100</p>
                      <p className="pb-1 text-sm" style={{ color: 'var(--muted)' }}>Basic checklist</p>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-violet" style={{ width: `${atsScore}%` }} />
                    </div>
                    <p className="mt-3 text-xs" style={{ color: 'var(--muted)' }}>
                      This score counts passed text checks. It does not test actual ATS parsing, layout, or employer ranking.
                    </p>
                    <ul className="mt-4 space-y-3">
                      {checks.map((check) => (
                        <li key={check.label} className="text-sm">
                          <p className="font-semibold"><span aria-hidden="true">{check.passed ? '✓ ' : '○ '}</span>{check.label}</p>
                          <p className="mt-1" style={{ color: 'var(--muted)' }}>{check.detail}</p>
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section className="panel">
                    <h2 className="text-xl font-bold">Resume analysis</h2>
                    {analysis ? (
                      <>
                        <p className="mt-2">Existing analysis score: <strong>{analysis.overall}/100</strong></p>
                        <p className="text-xs" style={{ color: 'var(--muted)' }}>Analysis mode: {analysis.mode}</p>
                        <ul className="mt-4 space-y-4 text-sm">
                          {analysis.findings.length === 0 && <li>No issues were identified by the current analysis rules.</li>}
                          {analysis.findings.map((finding, index) => (
                            <li key={`${finding.identified}-${index}`} className="border-t border-white/10 pt-3">
                              <h3 className="font-semibold">{finding.identified}</h3>
                              <p className="mt-1"><strong>Why:</strong> {finding.why}</p>
                              <p className="mt-1"><strong>Suggestion:</strong> {finding.suggestion}</p>
                              <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
                                Evidence: {finding.evidence}{finding.needsUserConfirmation ? ' · Please confirm this information.' : ''}
                              </p>
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>No analysis is available for this version.</p>
                    )}
                  </section>
                </div>
              </div>
            )}

            {tab === 'keywords' && (
              <div className="grid items-start gap-4 lg:grid-cols-2">
                <section className="panel space-y-4">
                  <h2 className="text-xl font-bold">Job-specific keywords</h2>
                  <label className="block text-sm font-medium">
                    Target job title
                    <input value={targetRole} onChange={(event) => setTargetRole(event.target.value)} placeholder="e.g. Data Analyst" className="mt-2 w-full rounded-xl border border-white/20 bg-transparent p-3" />
                  </label>
                  <label className="block text-sm font-medium">
                    Paste the target job description
                    <textarea value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} rows={9} maxLength={20000} placeholder="Paste the full job description here..." className="mt-2 w-full rounded-xl border border-white/20 bg-transparent p-3" />
                  </label>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    This uses basic text matching. It may miss synonyms and cannot measure proficiency.
                  </p>
                </section>

                <div className="space-y-4">
                  <section className="panel">
                    <h2 className="text-lg font-bold">Keyword comparison</h2>
                    {!jobDescription.trim() ? (
                      <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>Paste a job description to compare it with your resume.</p>
                    ) : (
                      <>
                        <p className="mt-3 text-sm">Found in resume: <strong>{keywordResults.matched.length}</strong></p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {keywordResults.matched.map((word) => <span key={word} className="rounded-full border border-white/20 px-3 py-1 text-xs">{word}</span>)}
                          {keywordResults.matched.length === 0 && <p className="text-sm">No exact matches found.</p>}
                        </div>
                        <p className="mt-4 text-sm">Not found in resume: <strong>{keywordResults.missing.length}</strong></p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {keywordResults.missing.map((word) => <span key={word} className="rounded-full border border-amber-400/40 px-3 py-1 text-xs">{word}</span>)}
                          {keywordResults.missing.length === 0 && <p className="text-sm">No missing terms from this basic comparison.</p>}
                        </div>
                      </>
                    )}
                  </section>
                  <section className="panel">
                    <h2 className="text-lg font-bold">Role keyword examples</h2>
                    <label className="mt-3 block text-sm">
                      Select a role
                      <select value={ROLE_KEYWORDS[targetRole] ? targetRole : ''} onChange={(event) => setTargetRole(event.target.value)} className="ml-2 rounded border border-white/20 bg-[#111827] p-2">
                        <option value="">Choose a role</option>
                        {Object.keys(ROLE_KEYWORDS).map((role) => <option key={role} value={role}>{role}</option>)}
                      </select>
                    </label>
                    {suggestedKeywords.length > 0 && (
                      <>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {suggestedKeywords.map((keyword) => (
                            <span key={keyword} className={`rounded-full border px-3 py-1 text-xs ${text.toLowerCase().includes(keyword.toLowerCase()) ? 'border-emerald-400/50' : 'border-white/20'}`}>{keyword}</span>
                          ))}
                        </div>
                        <p className="mt-3 text-xs" style={{ color: 'var(--muted)' }}>Examples only. Include skills you can accurately demonstrate.</p>
                      </>
                    )}
                  </section>
                </div>
              </div>
            )}

            {tab === 'guide' && (
              <div className="grid gap-4 md:grid-cols-2">
                <section className="panel space-y-4">
                  <h2 className="text-xl font-bold">Build a stronger resume</h2>
                  <div>
                    <h3 className="font-semibold">1. Professional summary</h3>
                    <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>State your target role, relevant skills, and strongest evidence in two to four concise lines.</p>
                    <button type="button" onClick={() => appendTemplate('PROFESSIONAL SUMMARY\n[Your target role] with experience or project work in [relevant skills]. Demonstrated ability to [specific task or achievement]. Interested in contributing to [relevant business or technical goal].', 'Summary template added. Replace bracketed sections with accurate information before saving.')} className="mt-2 rounded-lg border border-white/20 px-3 py-2 text-sm">Insert summary template</button>
                  </div>
                  <div>
                    <h3 className="font-semibold">2. Technical skills</h3>
                    <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>Group relevant languages, tools, platforms, and methods into readable categories.</p>
                    <button type="button" onClick={() => appendTemplate('TECHNICAL SKILLS\nLanguages: [Add languages you know]\nTools: [Add tools you have used]\nCore skills: [Add relevant skills]', 'Skills template added. Keep only skills you can honestly demonstrate.')} className="mt-2 rounded-lg border border-white/20 px-3 py-2 text-sm">Insert skills template</button>
                  </div>
                  <div>
                    <h3 className="font-semibold">3. Work experience and projects</h3>
                    <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>Explain the task, tools or approach, and result. Use real measurements only when supported by evidence.</p>
                  </div>
                </section>
                <section className="panel space-y-3">
                  <h2 className="text-xl font-bold">ATS-friendly formatting</h2>
                  <ul className="list-disc space-y-2 pl-5 text-sm">
                    <li>Prefer a simple, single-column layout.</li>
                    <li>Use standard headings such as Summary, Skills, Experience, Education, and Projects.</li>
                    <li>Keep contact details in the main document text.</li>
                    <li>Avoid tables, text boxes, and graphics for essential information.</li>
                    <li>Use consistent date formats and readable fonts.</li>
                    <li>Include relevant job-description terms naturally and accurately.</li>
                    <li>Use clear bullet points instead of long paragraphs.</li>
                    <li>Check exported documents by selecting and copying their text.</li>
                  </ul>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>ATS products differ. These practices cannot guarantee a particular outcome.</p>
                </section>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
