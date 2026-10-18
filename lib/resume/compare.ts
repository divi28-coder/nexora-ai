/** Line-level diff summary between two resume versions. */
export function diffLines(a: string, b: string) {
  const A = new Set(a.split('\n').map(l => l.trim()).filter(Boolean)), B = new Set(b.split('\n').map(l => l.trim()).filter(Boolean));
  return { removed: [...A].filter(l => !B.has(l)), added: [...B].filter(l => !A.has(l)) };
}
