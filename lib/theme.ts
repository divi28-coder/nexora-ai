export type Theme = 'dark' | 'light' | 'system';
export const resolveTheme = (t: Theme, prefersLight: boolean): 'dark' | 'light' => t === 'system' ? (prefersLight ? 'light' : 'dark') : t;
export function applyTheme(t: Theme) {
  try { localStorage.setItem('nexora_theme', t); } catch { /* storage unavailable */ }
  const r = resolveTheme(t, matchMedia('(prefers-color-scheme: light)').matches);
  if (r === 'light') document.documentElement.setAttribute('data-theme', 'light'); else document.documentElement.removeAttribute('data-theme');
}
