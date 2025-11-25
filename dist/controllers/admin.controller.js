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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBarber = exports.updateBarber = exports.createBarber = exports.deleteService = exports.updateService = exports.createService = exports.updateAppointmentStatus = exports.getDailyAgenda = exports.getOverview = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
// --- Overview & Metrics ---
const getOverview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        // Total Appointments this month
        const appointmentsMonth = yield prisma.appointment.count({
            where: {
                startAt: { gte: firstDayOfMonth },
                status: { not: 'CANCELLED' }
            }
        });
        // Total Revenue this month (approximate based on service price)
        // Prisma doesn't support sum on related fields easily without raw query or fetching.
        // We'll fetch completed appointments and sum in JS for simplicity or use aggregate if possible.
        const completedAppointments = yield prisma.appointment.findMany({
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
        const activeBarbers = yield prisma.user.count({
            where: { role: 'BARBER' }
        });
        res.json({
            appointmentsMonth,
            revenueMonth,
            activeBarbers,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching overview' });
    }
});
exports.getOverview = getOverview;
// --- Agenda ---
const getDailyAgenda = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { date } = req.query;
        if (!date)
            return res.status(400).json({ message: 'Date is required (YYYY-MM-DD)' });
        const startOfDay = new Date(date);
        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);
        const appointments = yield prisma.appointment.findMany({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching agenda' });
    }
});
exports.getDailyAgenda = getDailyAgenda;
const updateAppointmentStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const updated = yield prisma.appointment.update({
            where: { id },
            data: { status },
        });
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating appointment' });
    }
});
exports.updateAppointmentStatus = updateAppointmentStatus;
// --- Services CRUD ---
const serviceSchema = zod_1.z.object({
    title: zod_1.z.string().min(2),
    description: zod_1.z.string().optional(),
    durationMinutes: zod_1.z.number().min(5),
    price: zod_1.z.number().min(0),
});
const createService = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = serviceSchema.parse(req.body);
        const service = yield prisma.service.create({ data });
        res.status(201).json(service);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ errors: error.errors });
        res.status(500).json({ message: 'Error creating service' });
    }
});
exports.createService = createService;
const updateService = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const data = serviceSchema.parse(req.body);
        const service = yield prisma.service.update({ where: { id }, data });
        res.json(service);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ errors: error.errors });
        res.status(500).json({ message: 'Error updating service' });
    }
});
exports.updateService = updateService;
const deleteService = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield prisma.service.delete({ where: { id } });
        res.sendStatus(204);
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting service' });
    }
});
exports.deleteService = deleteService;
// --- Barbers CRUD ---
const barberSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    email: zod_1.z.string().email(),
    phone: zod_1.z.string().min(10),
    password: zod_1.z.string().min(6).optional(), // Optional for update
    bio: zod_1.z.string().optional(),
    photoUrl: zod_1.z.string().optional(),
});
const createBarber = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = barberSchema.parse(req.body);
        if (!data.password)
            return res.status(400).json({ message: 'Password is required for new barber' });
        const passwordHash = yield bcryptjs_1.default.hash(data.password, 10);
        const barber = yield prisma.user.create({
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ errors: error.errors });
        res.status(500).json({ message: 'Error creating barber' });
    }
});
exports.createBarber = createBarber;
const updateBarber = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const data = barberSchema.parse(req.body);
        const updateData = {
            name: data.name,
            email: data.email,
            phone: data.phone,
            bio: data.bio,
            photoUrl: data.photoUrl,
        };
        if (data.password) {
            updateData.passwordHash = yield bcryptjs_1.default.hash(data.password, 10);
        }
        const barber = yield prisma.user.update({
            where: { id },
            data: updateData
        });
        res.json({ id: barber.id, name: barber.name, email: barber.email });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ errors: error.errors });
        res.status(500).json({ message: 'Error updating barber' });
    }
});
exports.updateBarber = updateBarber;
const deleteBarber = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield prisma.user.delete({ where: { id } });
        res.sendStatus(204);
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting barber' });
    }
});
exports.deleteBarber = deleteBarber;
