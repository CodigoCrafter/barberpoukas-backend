import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getBarbers = async (req: Request, res: Response) => {
  try {
    const barbers = await prisma.user.findMany({
      where: { role: 'BARBER' },
      select: {
        id: true,
        name: true,
        bio: true,
        photoUrl: true,
        availabilities: true,
      }
    });
    res.json(barbers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching barbers' });
  }
};

// createBarber is now handled in admin.controller.ts
