import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create Admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@barbearia.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@barbearia.com',
      phone: '99999999999',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });

  console.log({ admin });

  // Create Barbers (as Users)
  const barberPassword = await bcrypt.hash('barber123', 10);
  
  const barber1 = await prisma.user.upsert({
    where: { email: 'talisson@barbearia.com' },
    update: {},
    create: {
      name: 'Talisson',
      email: 'talisson@barbearia.com',
      phone: '99999999998',
      passwordHash: barberPassword,
      role: 'BARBER',
      bio: 'Especialista em cortes clássicos e barba.',
      photoUrl: 'https://example.com/talisson.jpg',
    },
  });

  const barber2 = await prisma.user.upsert({
    where: { email: 'joao@barbearia.com' },
    update: {},
    create: {
      name: 'João',
      email: 'joao@barbearia.com',
      phone: '99999999997',
      passwordHash: barberPassword,
      role: 'BARBER',
      bio: 'Mestre em degradê e cortes modernos.',
      photoUrl: 'https://example.com/joao.jpg',
    },
  });

  console.log({ barber1, barber2 });

  // Create Services
  const services = [
    { title: 'Corte de Cabelo', description: 'Corte completo com lavagem', durationMinutes: 45, price: 50.00 },
    { title: 'Barba', description: 'Barba com toalha quente', durationMinutes: 30, price: 35.00 },
    { title: 'Corte + Barba', description: 'Combo completo', durationMinutes: 75, price: 80.00 },
    { title: 'Pezinho', description: 'Acabamento', durationMinutes: 15, price: 20.00 },
  ];

  for (const s of services) {
    await prisma.service.create({ data: s });
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
