import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

async function createTestAccounts() {
  const prisma = new PrismaClient();
  
  try {
    // Create Admin account
    const adminHash = await bcrypt.hash('Admin123!', 10);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@poukas.com' },
      update: {},
      create: {
        name: 'Admin Poukas',
        email: 'admin@poukas.com',
        phone: '11999999999',
        passwordHash: adminHash,
        role: 'ADMIN'
      }
    });
    console.log('✓ Admin account created:', admin.email);

    // Create Barber account
    const barberHash = await bcrypt.hash('Barber123!', 10);
    const barber = await prisma.user.upsert({
      where: { email: 'barber@poukas.com' },
      update: {},
      create: {
        name: 'Barbeiro João',
        email: 'barber@poukas.com',
        phone: '11988888888',
        passwordHash: barberHash,
        role: 'BARBER'
      }
    });
    console.log('✓ Barber account created:', barber.email);

    console.log('\nTest accounts ready!');
    console.log('Admin: admin@poukas.com / Admin123!');
    console.log('Barber: barber@poukas.com / Barber123!');
  } catch (error) {
    console.error('Error creating accounts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestAccounts();
