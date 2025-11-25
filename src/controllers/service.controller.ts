import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getServices = async (req: Request, res: Response) => {
  try {
    const services = await prisma.service.findMany();
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching services' });
  }
};

export const createService = async (req: Request, res: Response) => {
  try {
    const { title, description, durationMinutes, price } = req.body;
    const service = await prisma.service.create({
      data: { title, description, durationMinutes, price },
    });
    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ message: 'Error creating service' });
  }
};
