import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@barbearia.com';
  const password = 'admin123';

  console.log('Testing login for:', email);
  const user = await prisma.user.findUnique({ where: { email } });
  console.log('User found:', user);

  if (user) {
    const valid = await bcrypt.compare(password, user.passwordHash);
    console.log('Password valid:', valid);
  } else {
    console.log('User not found');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
