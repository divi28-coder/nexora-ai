import "./globals.css";
export const metadata = { title: "NEXORA AI", description: "AI career intelligence and interview practice" };
// Applies the saved theme before first paint to avoid a flash and hydration mismatch.
const themeScript = `try{var t=localStorage.getItem('nexora_theme');if(t==='system')t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';if(t==='light')document.documentElement.setAttribute('data-theme','light')}catch(e){}`;
export default function Root({ children }: { children: React.ReactNode }) {
  return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head><body>{children}</body></html>;
}
