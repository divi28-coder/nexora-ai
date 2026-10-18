import { prisma } from '../db/prisma';
/** Latest version text of the user's active resume, or null. Always scoped to userId. */
export async function activeResume(userId: string) {
  const r = await prisma.resume.findFirst({ where: { userId, isActive: true }, orderBy: { createdAt: 'desc' }, include: { versions: { orderBy: { version: 'desc' }, take: 1 } } });
  return r ? { id: r.id, title: r.title, text: (r.versions[0].content as { text: string }).text } : null;
}
