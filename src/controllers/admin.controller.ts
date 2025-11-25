import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// --- Overview & Metrics ---

export const getOverview = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total Appointments this month
    const appointmentsMonth = await prisma.appointment.count({
      where: {
        startAt: { gte: firstDayOfMonth },
        status: { not: 'CANCELLED' }
      }
    });

    // Total Revenue this month (approximate based on service price)
    // Prisma doesn't support sum on related fields easily without raw query or fetching.
    // We'll fetch completed appointments and sum in JS for simplicity or use aggregate if possible.
    const completedAppointments = await prisma.appointment.findMany({
      where: {
        startAt: { gte: firstDayOfMonth },
        status: 'DONE'
      },
      include: { service: true }
    });

    const revenueMonth = completedAppointments.reduce((acc, curr) => {
      return acc + Number(curr.service.price);
    }, 0);

    // Active Barbers count
    const activeBarbers = await prisma.user.count({
      where: { role: 'BARBER' }
    });

    res.json({
      appointmentsMonth,
      revenueMonth,
      activeBarbers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching overview' });
  }
};

// --- Agenda ---

export const getDailyAgenda = async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: 'Date is required (YYYY-MM-DD)' });

    const startOfDay = new Date(date as string);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const appointments = await prisma.appointment.findMany({
      where: {
        startAt: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
      include: {
        client: { select: { name: true, phone: true, email: true } },
        barber: { select: { name: true } },
        service: { select: { title: true, durationMinutes: true } },
      },
      orderBy: { startAt: 'asc' },
    });

    res.json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching agenda' });
  }
};

export const updateAppointmentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error updating appointment' });
  }
};

// --- Services CRUD ---

const serviceSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  durationMinutes: z.number().min(5),
  price: z.number().min(0),
});

export const createService = async (req: Request, res: Response) => {
  try {
    const data = serviceSchema.parse(req.body);
    const service = await prisma.service.create({ data });
    res.status(201).json(service);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ errors: error.errors });
    res.status(500).json({ message: 'Error creating service' });
  }
};

export const updateService = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = serviceSchema.parse(req.body);
    const service = await prisma.service.update({ where: { id }, data });
    res.json(service);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ errors: error.errors });
    res.status(500).json({ message: 'Error updating service' });
  }
};

export const deleteService = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.service.delete({ where: { id } });
    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ message: 'Error deleting service' });
  }
};

// --- Barbers CRUD ---

const barberSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  password: z.string().min(6).optional(), // Optional for update
  bio: z.string().optional(),
  photoUrl: z.string().optional(),
});

export const createBarber = async (req: Request, res: Response) => {
  try {
    const data = barberSchema.parse(req.body);
    
    if (!data.password) return res.status(400).json({ message: 'Password is required for new barber' });

    const passwordHash = await bcrypt.hash(data.password, 10);
    
    const barber = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        passwordHash,
        role: 'BARBER',
        bio: data.bio,
        photoUrl: data.photoUrl,
      }
    });

    res.status(201).json({ id: barber.id, name: barber.name, email: barber.email });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ errors: error.errors });
    res.status(500).json({ message: 'Error creating barber' });
  }
};

export const updateBarber = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = barberSchema.parse(req.body);
    
    const updateData: any = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      bio: data.bio,
      photoUrl: data.photoUrl,
    };

    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    const barber = await prisma.user.update({
      where: { id },
      data: updateData
    });

    res.json({ id: barber.id, name: barber.name, email: barber.email });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ errors: error.errors });
    res.status(500).json({ message: 'Error updating barber' });
  }
};

export const deleteBarber = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id } });
    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ message: 'Error deleting barber' });
  }
};
