import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // Cria ou atualiza o usuário padrão
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

  console.log('✅ Usuário criado/atualizado:', user);

  console.log('🎉 Seed concluído!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

