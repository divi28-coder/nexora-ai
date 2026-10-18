import { describe, it, expect, beforeAll } from 'vitest';
import { hashPassword, verifyPassword } from '../lib/auth/password';
import { signToken, verifyToken } from '../lib/auth/token';
import { validateUpload, MAX_BYTES } from '../lib/resume/extract';
import { diffLines } from '../lib/resume/compare';
import { scoreMatch } from '../lib/resume/match';
import { limited } from '../lib/security/rate-limit';
beforeAll(() => { process.env.SESSION_SECRET = 'test-secret-test-secret-123'; });
describe('passwords', () => {
  it('hashes with salt and verifies', () => {
    const h = hashPassword('correct horse battery'); expect(h).not.toContain('correct');
    expect(verifyPassword('correct horse battery', h)).toBe(true); expect(verifyPassword('wrong', h)).toBe(false);
    expect(hashPassword('x')).not.toBe(hashPassword('x'));
  });
});
describe('session tokens', () => {
  it('round-trips and rejects tampering/expiry', () => {
    const t = signToken('u1'); expect(verifyToken(t)).toBe('u1');
    expect(verifyToken(t.slice(0, -2) + 'xx')).toBeNull(); expect(verifyToken('garbage')).toBeNull();
    expect(verifyToken(signToken('u1', -1))).toBeNull(); expect(verifyToken(undefined)).toBeNull();
  });
});
describe('upload validation', () => {
  it('accepts pdf/docx/txt and rejects others, empty, oversize', () => {
    expect(validateUpload('a.PDF', 10).ok).toBe(true); expect(validateUpload('a.exe', 10).ok).toBe(false);
    expect(validateUpload('a.txt', 0).ok).toBe(false); expect(validateUpload('a.docx', MAX_BYTES + 1).ok).toBe(false);
  });
});
describe('compare and match', () => {
  it('diffs versions', () => { expect(diffLines('a\nb', 'b\nc')).toEqual({ removed: ['a'], added: ['c'] }); });
  it('scores requirements and lists missing skills', () => {
    const r = scoreMatch('I know SQL and Python', 'Required: SQL, Python, Docker'); expect(r.score).toBe(67); expect(r.missingSkills).toEqual(['Docker']);
  });
});
describe('rate limit', () => { it('blocks after max', () => { let b = false; for (let i = 0; i < 4; i++) b = limited('k', 3); expect(b).toBe(true); }); });
import { generateRoadmap, progress } from '../lib/roadmap';
import { resolveTheme } from '../lib/theme';
describe('roadmap generation', () => {
  it('only plans missing skills and ends with interview practice', () => {
    const g = generateRoadmap('Data Analyst', ['SQL', 'python'], 8);
    expect(g.missing).not.toContain('SQL'); expect(g.missing).not.toContain('Python'); expect(g.missing).toContain('Excel');
    expect(g.tasks.at(-1)?.title).toContain('interview'); expect(g.tasks.every(t => t.week >= 1)).toBe(true);
  });
  it('unknown role yields only interview practice; progress rounds', () => {
    expect(generateRoadmap('Astronaut', [], 8).tasks).toHaveLength(1);
    expect(progress([{ done: true }, { done: false }, { done: false }])).toBe(33); expect(progress([])).toBe(0);
  });
});
describe('theme', () => { it('resolves system preference', () => { expect(resolveTheme('system', true)).toBe('light'); expect(resolveTheme('dark', true)).toBe('dark'); }); });
