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
exports.deleteAvailability = exports.getAvailability = exports.setAvailability = exports.updateAppointmentStatus = exports.getMyAppointments = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const prisma = new client_1.PrismaClient();
// Get Barber's Appointments
const getMyAppointments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { date } = req.query;
        const where = {
            barberId: userId,
        };
        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            where.startAt = {
                gte: startOfDay,
                lte: endOfDay,
            };
        }
        const appointments = yield prisma.appointment.findMany({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching appointments' });
    }
});
exports.getMyAppointments = getMyAppointments;
// Update Appointment Status
const updateStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'DONE', 'CANCELLED']),
});
const updateAppointmentStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { status } = updateStatusSchema.parse(req.body);
        // Verify appointment belongs to barber
        const appointment = yield prisma.appointment.findUnique({
            where: { id },
        });
        if (!appointment || appointment.barberId !== userId) {
            return res.status(404).json({ message: 'Appointment not found or unauthorized' });
        }
        const updated = yield prisma.appointment.update({
            where: { id },
            data: { status },
        });
        res.json(updated);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ errors: error.errors });
        }
        console.error(error);
        res.status(500).json({ message: 'Error updating status' });
    }
});
exports.updateAppointmentStatus = updateAppointmentStatus;
// Manage Availability
const availabilitySchema = zod_1.z.object({
    weekday: zod_1.z.number().min(0).max(6),
    startTime: zod_1.z.string().regex(/^\d{2}:\d{2}$/),
    endTime: zod_1.z.string().regex(/^\d{2}:\d{2}$/),
});
const setAvailability = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { weekday, startTime, endTime } = availabilitySchema.parse(req.body);
        // Check if availability exists for this weekday
        const existing = yield prisma.availability.findFirst({
            where: {
                barberId: userId,
                weekday,
            },
        });
        let availability;
        if (existing) {
            availability = yield prisma.availability.update({
                where: { id: existing.id },
                data: { startTime, endTime },
            });
        }
        else {
            availability = yield prisma.availability.create({
                data: {
                    barberId: userId,
                    weekday,
                    startTime,
                    endTime,
                },
            });
        }
        res.json(availability);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ errors: error.errors });
        }
        console.error(error);
        res.status(500).json({ message: 'Error setting availability' });
    }
});
exports.setAvailability = setAvailability;
const getAvailability = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const availability = yield prisma.availability.findMany({
            where: { barberId: userId },
            orderBy: { weekday: 'asc' },
        });
        res.json(availability);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching availability' });
    }
});
exports.getAvailability = getAvailability;
const deleteAvailability = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const availability = yield prisma.availability.findUnique({ where: { id } });
        if (!availability || availability.barberId !== userId) {
            return res.status(404).json({ message: 'Availability not found' });
        }
        yield prisma.availability.delete({ where: { id } });
        res.sendStatus(204);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting availability' });
    }
});
exports.deleteAvailability = deleteAvailability;
