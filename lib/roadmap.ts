import { roleCatalog } from './demo/data';
export const priorities = ['LOW', 'MEDIUM', 'HIGH'] as const;
export function progress(tasks: { done: boolean }[]) { return tasks.length ? Math.round(tasks.filter(t => t.done).length / tasks.length * 100) : 0; }
/** Deterministic roadmap (demo mode, no AI): one learning task + one practice task per missing skill, spread across weeks. */
export function generateRoadmap(role: string, haveSkills: string[], hoursPerWeek: number, startDate = new Date()) {
  const have = new Set(haveSkills.map(s => s.toLowerCase()));
  const needed = roleCatalog[role] ?? [];
  const missing = needed.filter(s => !have.has(s.toLowerCase()));
  const perWeek = Math.max(1, Math.floor(hoursPerWeek / 4));
  const tasks: { week: number; title: string; deliverable: string; priority: string; hours: number; skill: string; dueDate: Date }[] = [];
  missing.forEach((skill, i) => {
    const week = Math.floor(i / perWeek) * 2 + 1;
    const due = (w: number) => new Date(startDate.getTime() + w * 7 * 864e5);
    tasks.push({ week, title: `Learn the fundamentals of ${skill}`, deliverable: `Short notes on ${skill}`, priority: i < 2 ? 'HIGH' : 'MEDIUM', hours: 3, skill, dueDate: due(week) });
    tasks.push({ week: week + 1, title: `Build a small project using ${skill}`, deliverable: 'Repository with README', priority: 'MEDIUM', hours: 5, skill, dueDate: due(week + 1) });
  });
  const last = (tasks.at(-1)?.week ?? 0) + 1;
  tasks.push({ week: last, title: `Practice interview questions for ${role}`, deliverable: 'Three practice sessions completed', priority: 'HIGH', hours: 3, skill: '', dueDate: new Date(startDate.getTime() + last * 7 * 864e5) });
  return { missing, tasks, note: missing.length ? `Based on a built-in skill list for ${role}, not live market data.` : `No gaps found against the built-in ${role} skill list. Only interview practice was added.` };
}
