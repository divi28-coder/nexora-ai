
'use client';

import { useState } from 'react';
import Nav from '@/components/Nav';
import { post } from '@/lib/api';
import { quizzes } from '@/lib/demo/quizzes';

type QuizResult = {
  pct: number;
  recorded: boolean;
};

export default function SkillArena() {
  const [skill, setSkill] = useState<string | null>(null);
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [res, setRes] = useState<QuizResult | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const qs = skill ? quizzes[skill] ?? [] : [];
  const currentQuestion = qs[i];

  function startQuiz(selectedSkill: string) {
    setSkill(selectedSkill);
    setI(0);
    setPick(null);
    setScore(0);
    setRes(null);
    setErr('');
    setBusy(false);
  }

  async function next() {
    if (!currentQuestion || pick === null || busy) {
      return;
    }

    setErr('');

    const nextScore =
      score + (pick === currentQuestion.answer ? 1 : 0);

    if (i + 1 < qs.length) {
      setScore(nextScore);
      setI(i + 1);
      setPick(null);
      return;
    }

    setBusy(true);

    try {
      const result = await post<QuizResult>('/api/skills', {
        skill,
        correct: nextScore,
        total: qs.length,
      });

      setScore(nextScore);
      setRes(result);
      setPick(null);
    } catch (e) {
      setErr(
        e instanceof Error
          ? e.message
          : 'Unable to save your quiz result. Please try again.'
      );
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setSkill(null);
    setI(0);
    setScore(0);
    setRes(null);
    setPick(null);
    setErr('');
    setBusy(false);
  }

  return (
    <>
      <Nav />

      <main className="mx-auto max-w-2xl p-6">
        <h1 className="text-3xl font-bold">Skill Arena</h1>

        <p
          className="mt-1 text-sm"
          style={{ color: 'var(--muted)' }}
        >
          Multiple-choice practice. Scoring 70%+ records
          &quot;challenge-demonstrated&quot; evidence in your Career
          Twin. No code is executed.
        </p>

        {!skill && (
          <div className="mt-4 flex flex-wrap gap-3">
            {Object.keys(quizzes).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => startQuiz(key)}
                className="panel font-semibold"
              >
                {key}

                <br />

                <small style={{ color: 'var(--muted)' }}>
                  {quizzes[key].length} questions
                </small>
              </button>
            ))}
          </div>
        )}

        {skill && !res && currentQuestion && (
          <section className="panel mt-4">
            <p
              className="text-sm"
              style={{ color: 'var(--muted)' }}
            >
              {skill} · question {i + 1} of {qs.length}
            </p>

            <p className="mt-1 font-semibold">
              {currentQuestion.q}
            </p>

            <div
              className="mt-3 space-y-2"
              role="radiogroup"
              aria-label="Answer options"
            >
              {currentQuestion.options.map((option, n) => (
                <button
                  key={`${n}-${option}`}
                  type="button"
                  role="radio"
                  aria-checked={pick === n}
                  disabled={pick !== null || busy}
                  onClick={() => {
                    setPick(n);
                    setErr('');
                  }}
                  className="block w-full rounded-xl border px-3 py-2 text-left disabled:cursor-not-allowed"
                  style={{
                    borderColor:
                      pick === null
                        ? 'rgba(255,255,255,.2)'
                        : n === currentQuestion.answer
                          ? 'var(--ok)'
                          : pick === n
                            ? '#F87171'
                            : 'rgba(255,255,255,.1)',
                  }}
                >
                  {option}
                </button>
              ))}
            </div>

            {pick !== null && (
              <>
                <p className="mt-3 text-sm">
                  {pick === currentQuestion.answer
                    ? 'Correct. '
                    : 'Not quite. '}

                  {currentQuestion.why}
                </p>

                <button
                  type="button"
                  onClick={next}
                  disabled={busy}
                  className="mt-2 rounded-xl bg-violet px-4 py-2 font-semibold disabled:opacity-50"
                >
                  {busy
                    ? 'Saving result…'
                    : i + 1 < qs.length
                      ? 'Next'
                      : 'Finish'}
                </button>
              </>
            )}

            {err && (
              <p role="alert" className="mt-2 text-danger">
                {err}
              </p>
            )}
          </section>
        )}

        {skill && !res && !currentQuestion && (
          <section className="panel mt-4">
            <p className="text-sm">
              No quiz questions are available for this topic.
            </p>

            <button
              type="button"
              onClick={reset}
              className="mt-3 rounded-xl border border-white/20 px-4 py-2"
            >
              Back to topics
            </button>
          </section>
        )}

        {res && (
          <section className="panel mt-4">
            <p className="text-2xl font-bold">
              {score}/{qs.length} ({res.pct}%)
            </p>

            <p className="text-sm">
              {res.recorded
                ? 'Evidence recorded in your Career Twin.'
                : 'Below 70%, so no evidence was recorded. Try again.'}
            </p>

            <button
              type="button"
              onClick={reset}
              className="mt-3 rounded-xl border border-white/20 px-4 py-2"
            >
              Back to topics
            </button>
          </section>
        )}
      </main>
    </>
  );
}

