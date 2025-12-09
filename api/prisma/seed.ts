import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'christyan@teste.com' },
    update: {
      password: hashedPassword,
      name: 'Christyan Moura',
    },
    create: {
      email: 'christyan@teste.com',
      password: hashedPassword,
      name: 'Christyan Moura',
    },
  });
}

main()
  .catch((e) => {
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

