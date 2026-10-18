'use client';

import { useState } from 'react';
import Nav from '@/components/Nav';
import { post } from '@/lib/api';
import { sampleJob } from '@/lib/demo/data';

type Requirement = {
  requirement: string;
  status: string;
  note: string;
};

type R = {
  score: number;
  requirements: Requirement[];
  missingSkills: string[];
  recommendations: string[];
  summary: string;
};

const color: Record<string, string> = {
  supported: 'var(--ok)',
  partial: '#FBBF24',
  'not-found': '#F87171',
};

export default function JobMatcher() {
  const [resume, setResume] = useState('');
  const [job, setJob] = useState(sampleJob);
  const [r, setR] = useState<R | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function run() {
    setErr('');
    setBusy(true);

    try {
      const result = await post<R>('/api/jobs/match', {
        resumeText: resume.trim() || undefined,
        jobText: job,
      });

      setR(result);
    } catch (e) {
      setErr(
        e instanceof Error
          ? e.message
          : 'Unable to compare the resume with this job description.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Nav />

      <main className="mx-auto max-w-4xl p-6">
        <header>
          <h1 className="text-3xl font-bold">Job Matcher</h1>

          <p
            className="mt-1 text-sm"
            style={{ color: 'var(--muted)' }}
          >
            Leave the resume box empty to use your active resume.
            Requirements are read from &quot;Required:&quot; and
            &quot;Preferred:&quot; lines. Results are estimates.
          </p>
        </header>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm">
            Resume text (optional)

            <textarea
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              rows={8}
              placeholder="Paste your resume text here, or leave empty to use your active resume."
              className="mt-1 w-full rounded-xl border border-white/20 bg-transparent p-2"
            />
          </label>

          <label className="text-sm">
            Job description

            <textarea
              value={job}
              onChange={(e) => setJob(e.target.value)}
              rows={8}
              placeholder="Paste the job description here."
              className="mt-1 w-full rounded-xl border border-white/20 bg-transparent p-2"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={run}
          disabled={busy || !job.trim()}
          className="mt-4 rounded-xl bg-violet px-5 py-2 font-semibold disabled:opacity-50"
        >
          {busy ? 'Comparing…' : 'Compare and save'}
        </button>

        {err && (
          <p role="alert" className="mt-3 text-danger">
            {err}
          </p>
        )}

        {r && (
          <section className="panel mt-4">
            <p className="text-2xl font-bold">
              {r.score}%

              <span
                className="text-sm font-normal"
                style={{ color: 'var(--muted)' }}
              >
                {' '}
                estimated match
              </span>
            </p>

            <p className="mt-2 text-sm">{r.summary}</p>

            {r.requirements.length > 0 && (
              <ul className="mt-3 space-y-3">
                {r.requirements.map((q) => (
                  <li key={q.requirement}>
                    <b
                      style={{
                        color: color[q.status] ?? 'var(--muted)',
                      }}
                    >
                      {q.status}
                    </b>

                    {' · '}

                    {q.requirement}

                    <br />

                    <small style={{ color: 'var(--muted)' }}>
                      {q.note}
                    </small>
                  </li>
                ))}
              </ul>
            )}

            {r.missingSkills.length > 0 && (
              <div className="mt-4">
                <h2 className="font-semibold">Missing skills</h2>

                <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                  {r.missingSkills.map((skill) => (
                    <li key={skill}>{skill}</li>
                  ))}
                </ul>
              </div>
            )}

            {r.recommendations.length > 0 && (
              <div className="mt-4 text-sm">
                <h2 className="font-semibold">Recommendations</h2>

                <ul className="mt-2 list-inside list-disc space-y-1">
                  {r.recommendations.map((recommendation) => (
                    <li key={recommendation}>
                      {recommendation}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}
      </main>
    </>
  );
}

