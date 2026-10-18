// Creates a demo account. Run: npm run db:seed  (requires DATABASE_URL and SESSION_SECRET not needed)
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../lib/auth/password';
const prisma = new PrismaClient();
async function main() {
  const email = 'demo@nexora.local';
  await prisma.user.upsert({ where: { email }, update: {}, create: { email, name: 'Demo User (sample)', passwordHash: hashPassword('demo-password-123') } });
  console.log('Seeded demo@nexora.local / demo-password-123 (sample account, change or delete before any real deployment)');
}
main().finally(() => prisma.$disconnect());
