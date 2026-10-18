'use client';

import { useState } from 'react';
import Nav from '@/components/Nav';
import { post } from '@/lib/api';
import { useFetch } from '@/lib/hooks';

type AnalysisResult = {
score: number;
missingSkills: string[];
};

type Analysis = {
id: string;
title: string;
description?: string;
createdAt: string;
result: AnalysisResult;
};

const band = (score: number) => {
if (score >= 70) return 'Ready to Explore';
if (score >= 40) return 'Bridge Role';
return 'Stretch Role';
};

function buildLinkedInUrl(jobText: string) {
const lines = jobText
.split('\n')
.map((line) => line.trim())
.filter(Boolean);

const title = (lines[0] || 'Software Engineer')
.replace(/^(job title|role|position)\s*:\s*/i, '')
.slice(0, 100);

const params = new URLSearchParams({
keywords: title,
});

return `https://www.linkedin.com/jobs/search/?${params.toString()}`;
}

export default function Radar() {
const { data, reload } = useFetch<{ analyses: Analysis[] }>(
'/api/jobs/match'
);

const [job, setJob] = useState('');
const [err, setErr] = useState('');
const [busy, setBusy] = useState(false);

async function add() {
setErr('');
setBusy(true);


try {
  await post('/api/jobs/match', { jobText: job });
  setJob('');
  await reload();
} catch (e) {
  setErr(
    e instanceof Error
      ? e.message
      : 'Unable to analyze this job. Please try again.'
  );
} finally {
  setBusy(false);
}


}

function searchLinkedIn(text: string) {
window.open(
buildLinkedInUrl(text),
'_blank',
'noopener,noreferrer'
);
}

const analyses = data?.analyses ?? [];

return (
<> <Nav />


  <main className="mx-auto max-w-4xl space-y-6 p-6">
    <header>
      <p className="text-sm font-semibold uppercase tracking-widest text-violet-400">
        Career intelligence
      </p>

      <h1 className="mt-2 text-3xl font-bold">
        Opportunity Radar
      </h1>

      <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
        Analyze job descriptions against your active resume, identify
        potential skill gaps, and search for similar opportunities on
        LinkedIn.
      </p>
    </header>

    <section className="panel space-y-4">
      <div>
        <h2 className="text-xl font-semibold">
          Analyze a job description
        </h2>

        <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
          Copy a job description from LinkedIn or another job site and
          paste it below.
        </p>
      </div>

      <label className="block text-sm font-medium">
        Job description

        <textarea
          value={job}
          onChange={(event) => setJob(event.target.value)}
          rows={8}
          maxLength={20000}
          placeholder={
            'Data Analyst\n\nResponsibilities: Analyze business data...\n\nRequired skills: SQL, Excel, Python...'
          }
          className="mt-2 w-full rounded-xl border border-white/20 bg-transparent p-3"
        />
      </label>

      <p className="text-xs" style={{ color: 'var(--muted)' }}>
        {job.length}/20,000 characters. Include the job title and
        required skills for a more useful LinkedIn search.
      </p>

      {err && (
        <p role="alert" className="text-sm text-danger">
          {err}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={add}
          disabled={busy || job.trim().length < 20}
          className="rounded-xl bg-violet px-5 py-3 font-semibold disabled:opacity-50"
        >
          {busy ? 'Analyzing...' : 'Analyze and save'}
        </button>

        <button
          onClick={() => searchLinkedIn(job)}
          disabled={job.trim().length < 3}
          className="rounded-xl border border-white/20 px-5 py-3 font-semibold disabled:opacity-50"
        >
          Find similar jobs on LinkedIn ↗
        </button>
      </div>

      <p className="text-xs" style={{ color: 'var(--muted)' }}>
        LinkedIn search opens in a new tab. You may need to sign in to
        LinkedIn. Search results depend on LinkedIn availability and
        filters.
      </p>
    </section>

    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Saved job analyses</h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
            Review roles you have already analyzed.
          </p>
        </div>

        <button
          onClick={() => searchLinkedIn('Software Engineer')}
          className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold"
        >
          Browse LinkedIn jobs ↗
        </button>
      </div>

      {analyses.length === 0 ? (
        <div className="panel">
          <p className="font-medium">No saved roles yet.</p>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
            Paste a job description above and select Analyze and save.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {analyses.map((analysis) => (
            <li key={analysis.id} className="panel space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{analysis.title}</h3>

                  <p
                    className="mt-1 text-xs"
                    style={{ color: 'var(--muted)' }}
                  >
                    Saved{' '}
                    {new Date(analysis.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="text-right">
                  <p
                    className="font-semibold"
                    style={{ color: 'var(--accent2)' }}
                  >
                    {band(analysis.result.score)}
                  </p>

                  <p className="text-2xl font-bold">
                    {analysis.result.score}%
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium">Potential skill gaps</p>

                <p
                  className="mt-1 text-sm"
                  style={{ color: 'var(--muted)' }}
                >
                  {analysis.result.missingSkills?.length
                    ? analysis.result.missingSkills.join(', ')
                    : 'No missing skills identified by this comparison.'}
                </p>
              </div>

              <button
                onClick={() =>
                  searchLinkedIn(
                    analysis.description || analysis.title
                  )
                }
                className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold"
              >
                Find similar jobs on LinkedIn ↗
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs" style={{ color: 'var(--muted)' }}>
        Match scores are estimates based on resume wording. They are not
        hiring decisions, guarantees of qualification, or official ATS
        scores. Missing keywords do not necessarily mean you lack a skill.
      </p>
    </section>
  </main>
</>


);
}
