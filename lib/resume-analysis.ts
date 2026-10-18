import { ResumeAnalysis } from './validation/schemas';

const VAGUE = /\b(worked on|helped with|responsible for|involved in)\b/i;
const HAS_NUMBER = /\d/;

/** Deterministic, transparent heuristic. Output is an ESTIMATE, not an ATS score. */
export function analyzeResumeText(text: string): ResumeAnalysis {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const lower = text.toLowerCase();
  const findings: ResumeAnalysis['findings'] = [];
  let score = 100;

  const sections = ['summary', 'education', 'skills', 'project', 'experience', 'certification'];
  for (const s of sections) {
    if (!lower.includes(s)) {
      score -= 6;
      findings.push({
        identified: `No "${s}" section heading was detected.`,
        whyItMatters: 'Recruiters and parsers look for standard headings.',
        suggestion: `Add a "${s}" section only if you have real content for it.`,
        evidence: 'Heading keyword not found in text.', needsUserConfirmation: true
      });
    }
  }
  const bullets = lines.filter(l => l.length > 15);
  const vague = bullets.filter(l => VAGUE.test(l));
  if (vague.length) {
    score -= Math.min(15, vague.length * 5);
    findings.push({
      identified: `${vague.length} bullet(s) use vague phrasing.`,
      whyItMatters: 'Specific actions and outcomes are easier to discuss in interviews.',
      suggestion: 'Say what you built, with which tools, and what changed. Add a metric only if it is true.',
      evidence: `"${vague[0].slice(0, 80)}"`, needsUserConfirmation: true
    });
  }
  if (bullets.length && !bullets.some(b => HAS_NUMBER.test(b))) {
    score -= 8;
    findings.push({
      identified: 'No bullet contains a number or measurable result.',
      whyItMatters: 'Quantified results make claims easier to verify.',
      suggestion: 'If you know a real figure (users, records, time saved), add it. Do not estimate one you cannot support.',
      evidence: 'No digits found in bullet-length lines.', needsUserConfirmation: true
    });
  }
  return { isEstimate: true, health: Math.max(0, Math.min(100, score)), findings };
}

export type Support = 'supported' | 'partial' | 'not-found';
export function matchRequirements(resumeText: string, requirements: string[]) {
  const r = resumeText.toLowerCase();
  return requirements.map(req => {
    const key = req.toLowerCase();
    const status: Support = r.includes(key) ? 'supported'
      : key.split(/\s+/).some(w => w.length > 3 && r.includes(w)) ? 'partial' : 'not-found';
    return { requirement: req, status,
      note: status === 'not-found' ? 'Not found in the resume text. This does not prove you lack the skill.' : 'Found related wording in your resume.' };
  });
}

export function extractRequirements(job: string): string[] {
  const m = job.match(/(?:required|preferred)\s*:\s*([^\n]+)/gi) ?? [];
  return [...new Set(m.flatMap(x => x.split(':')[1].split(/[,;]/)).map(s => s.replace(/\.$/, '').trim()).filter(Boolean))];
}
