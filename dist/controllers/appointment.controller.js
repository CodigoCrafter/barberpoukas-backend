"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelAppointment = exports.createAppointment = exports.getAppointments = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const prisma = new client_1.PrismaClient();
const createAppointmentSchema = zod_1.z.object({
    barberId: zod_1.z.string(),
    serviceId: zod_1.z.string(),
    startAt: zod_1.z.string().datetime(),
});
const getAppointments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.userId;
        const appointments = yield prisma.appointment.findMany({
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
    }
    catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ message: 'Error fetching appointments' });
    }
});
exports.getAppointments = getAppointments;
const createAppointment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.userId;
        const { barberId, serviceId, startAt } = createAppointmentSchema.parse(req.body);
        const service = yield prisma.service.findUnique({ where: { id: serviceId } });
        if (!service)
            return res.status(404).json({ message: 'Service not found' });
        const startDate = new Date(startAt);
        const endDate = new Date(startDate.getTime() + service.durationMinutes * 60000);
        // Check availability (simplified: just check overlap with other appointments)
        const conflict = yield prisma.appointment.findFirst({
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
        const appointment = yield prisma.appointment.create({
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ errors: error.errors });
        }
        res.status(500).json({ message: 'Error creating appointment' });
    }
});
exports.createAppointment = createAppointment;
const cancelAppointment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const appointment = yield prisma.appointment.findUnique({ where: { id } });
        if (!appointment)
            return res.status(404).json({ message: 'Appointment not found' });
        if (appointment.userId !== userId) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        const updated = yield prisma.appointment.update({
            where: { id },
            data: { status: 'CANCELLED' },
        });
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ message: 'Error cancelling appointment' });
    }
});
exports.cancelAppointment = cancelAppointment;
