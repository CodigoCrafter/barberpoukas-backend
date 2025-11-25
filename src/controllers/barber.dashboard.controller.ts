import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Get Barber's Appointments
export const getMyAppointments = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { date } = req.query;

    const where: any = {
      barberId: userId,
    };

    if (date) {
      const startOfDay = new Date(date as string);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date as string);
      endOfDay.setHours(23, 59, 59, 999);

      where.startAt = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        client: {
          select: { name: true, phone: true, email: true }
        },
        service: true,
      },
      orderBy: {
        startAt: 'asc',
      },
    });

    res.json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching appointments' });
  }
};

// Update Appointment Status
const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'DONE', 'CANCELLED']),
});

export const updateAppointmentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;
    const { status } = updateStatusSchema.parse(req.body);

    // Verify appointment belongs to barber
    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment || appointment.barberId !== userId) {
      return res.status(404).json({ message: 'Appointment not found or unauthorized' });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status },
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error(error);
    res.status(500).json({ message: 'Error updating status' });
  }
};

// Manage Availability
const availabilitySchema = z.object({
  weekday: z.number().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});

export const setAvailability = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { weekday, startTime, endTime } = availabilitySchema.parse(req.body);

    // Check if availability exists for this weekday
    const existing = await prisma.availability.findFirst({
      where: {
        barberId: userId,
        weekday,
      },
    });

    let availability;
    if (existing) {
      availability = await prisma.availability.update({
        where: { id: existing.id },
        data: { startTime, endTime },
      });
    } else {
      availability = await prisma.availability.create({
        data: {
          barberId: userId,
          weekday,
          startTime,
          endTime,
        },
      });
    }

    res.json(availability);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error(error);
    res.status(500).json({ message: 'Error setting availability' });
  }
};

export const getAvailability = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const availability = await prisma.availability.findMany({
      where: { barberId: userId },
      orderBy: { weekday: 'asc' },
    });
    res.json(availability);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching availability' });
  }
};

export const deleteAvailability = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.userId;

        const availability = await prisma.availability.findUnique({ where: { id } });
        if (!availability || availability.barberId !== userId) {
            return res.status(404).json({ message: 'Availability not found' });
        }

        await prisma.availability.delete({ where: { id } });
        res.sendStatus(204);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting availability' });
    }
}
