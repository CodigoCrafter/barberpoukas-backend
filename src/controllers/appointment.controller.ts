import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const createAppointmentSchema = z.object({
  barberId: z.string(),
  serviceId: z.string(),
  startAt: z.string().datetime(),
});

export const getAppointments = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const appointments = await prisma.appointment.findMany({
      where: { userId },
      include: { 
        barber: { 
          select: { id: true, name: true, email: true }
        }, 
        service: true 
      },
      orderBy: { startAt: 'asc' },
    });
    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Error fetching appointments' });
  }
};

export const createAppointment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { barberId, serviceId, startAt } = createAppointmentSchema.parse(req.body);
    
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) return res.status(404).json({ message: 'Service not found' });

    const startDate = new Date(startAt);
    const endDate = new Date(startDate.getTime() + service.durationMinutes * 60000);

    // Check availability (simplified: just check overlap with other appointments)
    const conflict = await prisma.appointment.findFirst({
      where: {
        barberId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        OR: [
          { startAt: { lt: endDate }, endAt: { gt: startDate } },
        ],
      },
    });

    if (conflict) {
      return res.status(409).json({ message: 'Time slot not available' });
    }

    const appointment = await prisma.appointment.create({
      data: {
        userId,
        barberId,
        serviceId,
        startAt: startDate,
        endAt: endDate,
        status: 'CONFIRMED', // Auto-confirm for now
      },
    });

    res.status(201).json(appointment);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    res.status(500).json({ message: 'Error creating appointment' });
  }
};

export const cancelAppointment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    if (appointment.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling appointment' });
  }
};
