import { matchRequirements, extractRequirements } from '../resume-analysis';
export function scoreMatch(resumeText: string, jobText: string) {
  const reqs = extractRequirements(jobText);
  const items = matchRequirements(resumeText, reqs);
  const pts = items.reduce((s, i) => s + (i.status === 'supported' ? 1 : i.status === 'partial' ? 0.5 : 0), 0);
  const score = items.length ? Math.round((pts / items.length) * 100) : 0;
  const missing = items.filter(i => i.status === 'not-found').map(i => i.requirement);
  return { score, requirements: items, missingSkills: missing,
    recommendations: [
      ...(missing.length ? [`If you genuinely have experience with ${missing.slice(0, 3).join(', ')}, add it with a real example. If not, consider a small project.`] : []),
      ...(items.length === 0 ? ['No "Required:" or "Preferred:" lines were found. Paste the requirements in that format for a better comparison.'] : [])] };
}
