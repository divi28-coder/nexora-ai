import { describe, it, expect } from 'vitest';
import { demoAnalyze } from '../lib/ai/provider';
import { analyzeResumeText, extractRequirements, matchRequirements } from '../lib/resume-analysis';
import { demoEvaluate, demoQuestions } from '../lib/ai/demo';
import { questionInput, resumeAnalysisOutput } from '../lib/validation/schemas';

describe('resume analysis', () => {
  it('is deterministic and flags estimates', () => {
    const t = 'x'.repeat(60);
    expect(demoAnalyze(t)).toEqual(demoAnalyze(t));
    expect(demoAnalyze(t).isEstimate).toBe(true);
  });
  it('flags vague bullets with evidence and output matches schema', () => {
    const a = analyzeResumeText('Skills: Python\nWorked on the database for the project.');
    expect(a.findings.some(f => f.identified.includes('vague'))).toBe(true);
    expect(resumeAnalysisOutput.safeParse(a).success).toBe(true);
  });
});
describe('job matching', () => {
  it('extracts requirements and never calls a missing keyword proof of no skill', () => {
    const reqs = extractRequirements('Required: SQL, Excel.\nPreferred: Power BI');
    expect(reqs).toEqual(['SQL', 'Excel', 'Power BI']);
    const m = matchRequirements('I know SQL', reqs);
    expect(m[0].status).toBe('supported');
    expect(m[1].note).toContain('does not prove');
  });
});
describe('questions and feedback', () => {
  it('uses resume content when available', () => {
    expect(demoQuestions('Dev', 'Project', 3, 'Python and MySQL')[0].basedOnResume).toBe(true);
  });
  it('validates question input', () => {
    expect(questionInput.safeParse({ role: 'Dev', category: 'HR', count: 99 }).success).toBe(false);
  });
  it('demo feedback is labeled as an estimate', () => {
    expect(demoEvaluate('I built a tool and learned a lot.').isEstimate).toBe(true);
  });
});
