'use client';

import { useEffect, useRef, useState } from 'react';
import Nav from '@/components/Nav';
import { post } from '@/lib/api';

type Question = { id: string; question: string };
type Criterion = { name: string; score: number; note: string };
type Feedback = { criteria: Criterion[]; sampleStructure: string; disclaimer: string };
type LogItem = { question: string; answer: string; feedback: Feedback };
type InterviewType = 'Technical' | 'Behavioral' | 'HR' | 'Project' | 'Coding' | 'Communication' | 'Job-description-based';

type RecognitionResult = { transcript: string; confidence?: number; isFinal?: boolean };
type RecognitionResultList = ArrayLike<RecognitionResult>;
type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionResultList> };
type RecognitionErrorEvent = { error?: string; message?: string };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives?: number;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort?: () => void;
};
type RecognitionCtor = new () => Recognition;

declare global {
  interface Window {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  }
}

const TYPES: InterviewType[] = ['Technical', 'Behavioral', 'HR', 'Project', 'Coding', 'Communication', 'Job-description-based'];

export default function InterviewStudio() {
  const [role, setRole] = useState('Data Analyst');
  const [category, setCategory] = useState<InterviewType>('Technical');
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [count, setCount] = useState(5);
  const [jobText, setJobText] = useState('');
  const [saveTranscript, setSaveTranscript] = useState(false);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [sessionId, setSessionId] = useState<string>();
  const [index, setIndex] = useState(-1);
  const [answer, setAnswer] = useState('');
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [speechMessage, setSpeechMessage] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const answerBaseRef = useRef('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<Recognition | null>(null);

  const active = index >= 0 && index < questions.length;
  const finished = questions.length > 0 && index >= questions.length;
  const question = active ? questions[index] : undefined;

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    recognitionRef.current?.stop();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  }, []);

  async function startInterview() {
    setError('');
    setBusy(true);
    setQuestions([]);
    setLogs([]);
    setIndex(-1);
    setSessionId(undefined);
    setAnswer('');
    try {
      // The existing /api/questions endpoint validates count in the range 1–10.
      const safeCount = Math.max(1, Math.min(10, Math.trunc(Number(count) || 1)));
      const result = await post<{ questions: Question[] }>('/api/questions', {
        role: role.trim(),
        category,
        difficulty,
        count: safeCount,
        jobText: jobText.trim() || undefined,
      });
      if (!result.questions?.length) throw new Error('The questions API returned no questions.');

      const session = await post<{ id: string }>('/api/interview/session', {
        role: role.trim(),
        category,
        difficulty,
        saveTranscript,
      });
      setQuestions(result.questions.slice(0, safeCount));
      setSessionId(session.id);
      setIndex(0);
    } catch (e) {
      setError((e as Error).message || 'Could not start the interview.');
    } finally {
      setBusy(false);
    }
  }

  function askAloud() {
    if (!question) return;
    if (!('speechSynthesis' in window)) {
      setSpeechMessage('Spoken questions are not supported in this browser; read the question on screen.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(question.question);
    utterance.lang = 'en-US';
    utterance.rate = 0.95;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => {
      setSpeaking(false);
      setSpeechMessage('Could not play audio. You can read the question on screen.');
    };
    window.speechSynthesis.speak(utterance);
  }

  function stopSpokenQuestion() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setSpeaking(false);
  }

  async function toggleVoiceAnswer() {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      setSpeechMessage('Voice input stopped. Review the transcript, then submit your answer.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechMessage('This browser does not provide speech recognition. Use Microsoft Edge on localhost/HTTPS with microphone permission, or type your answer.');
      return;
    }

    // Request microphone permission explicitly. This works whether the camera is on or off.
    let permissionStream: MediaStream | null = null;
    try {
      permissionStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Release this short-lived permission stream; SpeechRecognition manages its own audio capture.
      permissionStream.getTracks().forEach((track) => track.stop());
    } catch {
      setSpeechMessage('Microphone permission is blocked. In Edge, select the lock/tune icon beside the address bar, allow Microphone, then reload.');
      return;
    }

    try {
      recognitionRef.current?.abort?.();
      recognitionRef.current?.stop();
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      answerBaseRef.current = answer.trim();
      let finalTranscript = '';
      recognition.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i];
          const alternative = result?.[0];
          const transcript = alternative?.transcript ?? '';
          if (alternative?.isFinal) finalTranscript += `${transcript} `;
          else interim += transcript;
        }
        const base = answerBaseRef.current;
        const spoken = finalTranscript.trim();
        setInterimTranscript(interim);
        setAnswer([base, spoken, interim.trim()].filter(Boolean).join(base && (spoken || interim.trim()) ? ' ' : ''));
      };
      recognition.onerror = (event) => {
        setListening(false);
        setInterimTranscript('');
        const code = event?.error || 'unknown';
        const messages: Record<string, string> = {
          'not-allowed': 'Microphone access is blocked. Allow Microphone for this site in Edge settings and reload.',
          'service-not-allowed': 'The browser speech service is blocked by policy. Try Edge with internet access, or type your answer.',
          'network': 'Speech recognition needs the browser speech service and an internet connection. Check your connection or type your answer.',
          'no-speech': 'No speech was detected. Click Answer by voice and speak clearly near your microphone.',
          'audio-capture': 'No microphone was detected. Check Windows input-device settings.',
          'aborted': 'Voice input stopped.'
        };
        setSpeechMessage(messages[code] || `Speech recognition failed (${code}). Check microphone permissions or type your answer.`);
      };
      recognition.onend = () => {
        setListening(false);
        setInterimTranscript('');
        if (finalTranscript.trim()) {
          setAnswer([answerBaseRef.current, finalTranscript.trim()].filter(Boolean).join(answerBaseRef.current ? ' ' : ''));
          setSpeechMessage('Voice transcript captured. Review or edit it before submitting.');
        }
      };
      recognitionRef.current = recognition;
      recognition.start();
      setListening(true);
      setSpeechMessage('Listening… speak naturally. Your transcript will appear in the answer box. Select Stop voice input when finished.');
    } catch {
      setListening(false);
      setSpeechMessage('Could not start speech recognition. Make sure the site is running on localhost or HTTPS and microphone access is allowed.');
    }
  }

  async function toggleCamera() {
    if (cameraOn) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      setCameraOn(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOn(true);
      setError('');
    } catch {
      setError('Camera permission was denied or no camera was found. You can still answer by voice or text.');
    }
  }

  async function submitAnswer() {
    if (!question || !answer.trim() || evaluating) return;
    setError('');
    setEvaluating(true);
    stopSpokenQuestion();
    recognitionRef.current?.stop();
    setListening(false);
    try {
      const feedback = await post<Feedback>('/api/interview/evaluate', {
        question: question.question,
        answer: answer.trim(),
        sessionId,
      });
      setLogs((old) => [...old, { question: question.question, answer: answer.trim(), feedback }]);
      setAnswer('');
      setIndex((old) => old + 1);
      setSpeechMessage('');
    } catch (e) {
      setError((e as Error).message || 'Could not evaluate your answer. Please try again.');
    } finally {
      setEvaluating(false);
    }
  }

  function skipQuestion() {
    stopSpokenQuestion();
    recognitionRef.current?.stop();
    setListening(false);
    setAnswer('');
    setIndex((old) => old + 1);
    setSpeechMessage('');
  }

  function endInterview() {
    stopSpokenQuestion();
    recognitionRef.current?.stop();
    setListening(false);
    setIndex(questions.length);
  }

  function resetInterview() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
    setQuestions([]);
    setSessionId(undefined);
    setIndex(-1);
    setAnswer('');
    setLogs([]);
    setError('');
    setSpeechMessage('');
  }

  const latest = logs[logs.length - 1];
  const allScores = logs.flatMap((item) => item.feedback.criteria.map((c) => c.score));
  const average = allScores.length ? (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1) : '—';

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-7xl p-4 md:p-6">
        <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--accent2)' }}>NEXORA AI</p>
            <h1 className="mt-1 text-3xl font-bold md:text-4xl">Interview Studio</h1>
            <p className="mt-2 max-w-3xl text-sm" style={{ color: 'var(--muted)' }}>
              Practice with spoken questions, voice or text answers, individual answer ratings, and improvement tips.
            </p>
          </div>
          {active && <span className="rounded-full border border-white/15 px-3 py-2 text-sm"><span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" />Practice session</span>}
        </header>

        {index === -1 && !finished && (
          <section className="panel mx-auto max-w-3xl space-y-5">
            <div>
              <h2 className="text-xl font-bold">Configure your interview</h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>Your selections are sent to the questions API to tailor the session.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium">Target role
                <input value={role} onChange={(e) => setRole(e.target.value)} maxLength={100} placeholder="e.g. Data Analyst" className="mt-1 w-full rounded-xl border border-white/20 bg-transparent px-3 py-2" />
              </label>
              <label className="block text-sm font-medium">Interview type
                <select value={category} onChange={(e) => setCategory(e.target.value as InterviewType)} className="mt-1 w-full rounded-xl border border-white/20 bg-transparent px-3 py-2">
                  {TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </label>
              <label className="block text-sm font-medium">Difficulty
                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as typeof difficulty)} className="mt-1 w-full rounded-xl border border-white/20 bg-transparent px-3 py-2">
                  <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                </select>
              </label>
              <label className="block text-sm font-medium">Number of questions (1–10)
                <input type="number" min={1} max={10} step={1} value={count} onChange={(e) => setCount(Math.max(1, Math.min(10, Math.trunc(Number(e.target.value) || 1))))} className="mt-1 w-full rounded-xl border border-white/20 bg-transparent px-3 py-2" />
                <span className="mt-1 block text-xs" style={{ color: 'var(--muted)' }}>The current API accepts between 1 and 10 questions.</span>
              </label>
            </div>
            <label className="block text-sm font-medium">Job description (optional)
              <textarea value={jobText} onChange={(e) => setJobText(e.target.value.slice(0, 15000))} rows={5} maxLength={15000} placeholder="Paste a job description to tailor questions to the role's skills and responsibilities." className="mt-1 w-full rounded-xl border border-white/20 bg-transparent p-3" />
              <span className="mt-1 block text-right text-xs" style={{ color: 'var(--muted)' }}>{jobText.length}/15000 characters</span>
            </label>
            <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={saveTranscript} onChange={(e) => setSaveTranscript(e.target.checked)} className="mt-1" /><span>Save my answers and feedback to my account (off by default).</span></label>
            <div className="rounded-xl border border-white/10 p-3 text-sm" style={{ color: 'var(--muted)' }}>
              Camera is a local preview only (not a live call). Video mode requests camera and microphone permission. Voice answers use browser speech recognition when available. Spoken questions use browser text-to-speech. This page uses your existing evaluation endpoint for ratings and feedback.
            </div>
            {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
            <button onClick={startInterview} disabled={busy || role.trim().length < 2} className="w-full rounded-xl bg-violet px-5 py-3 font-semibold disabled:opacity-50 sm:w-auto">
              {busy ? 'Preparing interview…' : 'Start interview'}
            </button>
          </section>
        )}

        {active && question && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 px-4 py-3">
              <div><p className="font-semibold">{role} · {category}</p><p className="text-sm" style={{ color: 'var(--muted)' }}>{difficulty} · Question {index + 1} of {questions.length}</p></div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10 sm:w-48"><div className="h-full rounded-full bg-violet transition-all" style={{ width: `${((index + 1) / questions.length) * 100}%` }} /></div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <section className="flex min-h-[440px] flex-col rounded-2xl border border-white/10 bg-slate-950 p-5">
                <div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.2em] text-violet-300">AI interviewer</p><h2 className="mt-1 text-lg font-semibold">Nexora Interview Coach</h2></div><span className="rounded-full bg-white/10 px-3 py-1 text-xs">{speaking ? 'Speaking' : 'Ready'}</span></div>
                <div className="flex flex-1 flex-col items-center justify-center py-7 text-center">
                  <div className={`relative flex h-40 w-40 items-center justify-center rounded-full border border-violet-300/40 bg-gradient-to-br from-violet-500/30 via-indigo-500/20 to-cyan-400/20 shadow-2xl ${speaking ? 'ring-4 ring-violet-400/40' : ''}`}>
                    <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-slate-900 shadow-inner"><div className="mb-3 flex gap-4"><span className="h-3 w-3 rounded-full bg-cyan-200" /><span className="h-3 w-3 rounded-full bg-cyan-200" /></div><div className="h-1.5 w-9 rounded-full bg-violet-300" /><span className="mt-2 text-[10px] tracking-[0.2em] text-cyan-100">AI</span></div>
                    {speaking && <span className="absolute -bottom-2 rounded-full bg-violet-600 px-3 py-1 text-xs">Speaking…</span>}
                  </div>
                  <p className="mt-6 max-w-xl text-lg font-semibold leading-relaxed md:text-xl">{question.question}</p>
                  <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>Ask aloud to hear the question, then answer on the right.</p>
                </div>
                <div className="flex justify-center gap-2 border-t border-white/10 pt-4"><button onClick={askAloud} className="rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/10">Ask aloud / replay</button><button onClick={stopSpokenQuestion} className="rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/10">Stop audio</button></div>
              </section>

              <section className="flex min-h-[440px] flex-col rounded-2xl border border-white/10 bg-slate-900 p-4">
                <div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>Candidate</p><h2 className="mt-1 text-lg font-semibold">Your answer</h2></div><span className="rounded-full border border-white/10 px-3 py-1 text-xs">{cameraOn ? 'Camera on' : 'Camera off'}</span></div>
                <div className="relative mt-3 flex min-h-36 flex-1 items-center justify-center overflow-hidden rounded-xl bg-slate-950">
                  <video ref={videoRef} autoPlay muted playsInline className={cameraOn ? 'absolute inset-0 h-full w-full object-cover' : 'hidden'} />
                  {!cameraOn && <div className="py-8 text-center"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-violet-500/20 text-3xl font-bold text-violet-200">{role.trim().charAt(0).toUpperCase() || 'Y'}</div><p className="mt-3 text-sm">Camera is off</p><p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>Voice or text answers are available.</p></div>}
                  {cameraOn && <span className="absolute bottom-3 left-3 rounded bg-black/60 px-2 py-1 text-xs">Local camera preview</span>}
                </div>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  <button onClick={toggleCamera} className={`rounded-full px-4 py-2 text-sm ${cameraOn ? 'bg-red-500/20 text-red-200' : 'border border-white/20 hover:bg-white/10'}`}>{cameraOn ? 'Turn camera off' : 'Turn camera on'}</button>
                  <button onClick={toggleVoiceAnswer} className={`rounded-full px-4 py-2 text-sm ${listening ? 'bg-red-500 text-white' : 'border border-white/20 hover:bg-white/10'}`}>{listening ? 'Stop voice input' : 'Answer by voice'}</button>
                </div>
                <label htmlFor="candidate-answer" className="mt-4 block text-sm font-medium">Answer transcript / text</label>
                <textarea id="candidate-answer" value={answer} onChange={(e) => setAnswer(e.target.value)} rows={5} placeholder="Speak using Answer by voice, or type your answer here…" className="mt-2 w-full rounded-xl border border-white/20 bg-transparent p-3" />
                {interimTranscript && <p className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>Recognizing: {interimTranscript}</p>}
                {speechMessage && <p role="status" className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>{speechMessage}</p>}
                {error && <p role="alert" className="mt-2 text-sm text-red-400">{error}</p>}
                <div className="mt-3 flex flex-wrap gap-2"><button onClick={submitAnswer} disabled={!answer.trim() || evaluating} className="flex-1 rounded-xl bg-violet px-4 py-3 font-semibold disabled:opacity-50">{evaluating ? 'Evaluating answer…' : 'Submit & evaluate'}</button><button onClick={skipQuestion} disabled={evaluating} className="rounded-xl border border-white/20 px-4 py-3 text-sm">Skip</button></div>
                <button onClick={endInterview} className="mt-3 text-sm text-red-300 hover:text-red-200">End interview</button>
              </section>
            </div>

            {latest && <section className="panel"><h3 className="text-lg font-bold">Latest answer feedback</h3><p className="mt-2 text-sm font-medium">{latest.question}</p><p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>{latest.answer}</p><div className="mt-3 grid gap-3 sm:grid-cols-2">{latest.feedback.criteria.map((c) => <div key={c.name} className="rounded-xl border border-white/10 p-3"><div className="flex justify-between gap-2"><b className="text-sm">{c.name}</b><span style={{ color: 'var(--accent2)' }}>{c.score}/5</span></div><p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>{c.note}</p></div>)}</div><div className="mt-3 rounded-xl border border-white/10 p-3"><b className="text-sm">Suggested improvement</b><p className="mt-1 text-sm">{latest.feedback.sampleStructure}</p>{latest.feedback.disclaimer && <p className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>{latest.feedback.disclaimer}</p>}</div></section>}
          </section>
        )}

        {finished && <section className="panel mx-auto max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--accent2)' }}>Session complete</p><h2 className="mt-1 text-2xl font-bold">Interview performance report</h2><p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>{role} · {category} · {difficulty}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-white/10 p-3"><p className="text-sm" style={{ color: 'var(--muted)' }}>Questions prepared</p><p className="mt-1 text-2xl font-bold">{questions.length}</p></div><div className="rounded-xl border border-white/10 p-3"><p className="text-sm" style={{ color: 'var(--muted)' }}>Answers evaluated</p><p className="mt-1 text-2xl font-bold">{logs.length}</p></div><div className="rounded-xl border border-white/10 p-3"><p className="text-sm" style={{ color: 'var(--muted)' }}>Average criteria score</p><p className="mt-1 text-2xl font-bold">{average}/5</p></div></div>
          {logs.length === 0 ? <p className="mt-5 text-sm" style={{ color: 'var(--muted)' }}>No answers were evaluated.</p> : <div className="mt-5 space-y-4">{logs.map((item, i) => { const scores = item.feedback.criteria.map((c) => c.score); const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '—'; return <article key={`${i}-${item.question}`} className="rounded-xl border border-white/10 p-4"><div className="flex flex-wrap items-start justify-between gap-2"><h3 className="font-semibold">Q{i + 1}. {item.question}</h3><span className="rounded-full bg-violet-500/15 px-3 py-1 text-sm font-semibold">{avg}/5</span></div><p className="mt-2 whitespace-pre-wrap text-sm" style={{ color: 'var(--muted)' }}>{item.answer}</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{item.feedback.criteria.map((c) => <div key={c.name} className="rounded-lg bg-white/5 p-3 text-sm"><div className="flex justify-between gap-2"><b>{c.name}</b><span>{c.score}/5</span></div><p className="mt-1" style={{ color: 'var(--muted)' }}>{c.note}</p></div>)}</div><p className="mt-3 text-sm"><b>Improvement tip:</b> {item.feedback.sampleStructure}</p></article>; })}</div>}
          <p className="mt-5 text-xs" style={{ color: 'var(--muted)' }}>Scores are estimates for practice, not predictions of hiring outcomes. Camera video is local preview only; browser speech support varies and some speech services require internet access.</p>
          <button onClick={resetInterview} className="mt-5 rounded-xl bg-violet px-5 py-3 font-semibold">Configure another interview</button>
        </section>}
      </main>
    </>
  );
}
