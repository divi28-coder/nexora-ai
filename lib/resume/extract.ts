export const MAX_BYTES = 5 * 1024 * 1024;
const OK: Record<string, string> = { pdf: 'application/pdf', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', txt: 'text/plain' };
export function validateUpload(name: string, size: number): { ok: true; ext: 'pdf' | 'docx' | 'txt' } | { ok: false; error: string } {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (!(ext in OK)) return { ok: false, error: 'Upload a PDF, DOCX or TXT file.' };
  if (size === 0) return { ok: false, error: 'The file is empty.' };
  if (size > MAX_BYTES) return { ok: false, error: 'File is larger than 5 MB.' };
  return { ok: true, ext: ext as 'pdf' | 'docx' | 'txt' };
}
export async function extractText(buf: Buffer, ext: 'pdf' | 'docx' | 'txt'): Promise<string> {
  let text = '';
  if (ext === 'txt') text = buf.toString('utf8');
  else if (ext === 'pdf') { const pdf = (await import('pdf-parse')).default; text = (await pdf(buf)).text; }
  else { const mammoth = await import('mammoth'); text = (await mammoth.extractRawText({ buffer: buf })).value; }
  return text.replace(/\r/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}
