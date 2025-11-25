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
exports.scheduleReminders = exports.sendEmail = exports.sendWhatsApp = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Mock Notification Senders
const sendWhatsApp = (to, message) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`[WhatsApp] Sending to ${to}: ${message}`);
    // Integration with Twilio would go here
});
exports.sendWhatsApp = sendWhatsApp;
const sendEmail = (to, subject, body) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`[Email] Sending to ${to} | Subject: ${subject}`);
    console.log(`[Email Body]: ${body}`);
    // Integration with SendGrid would go here
});
exports.sendEmail = sendEmail;
// Daily Reminder Job
const scheduleReminders = () => {
    // Run every day at 08:00 AM
    node_cron_1.default.schedule('0 8 * * *', () => __awaiter(void 0, void 0, void 0, function* () {
        console.log('Running daily appointment reminders...');
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const endOfTomorrow = new Date(tomorrow);
        endOfTomorrow.setHours(23, 59, 59, 999);
        try {
            const appointments = yield prisma.appointment.findMany({
                where: {
                    startAt: {
                        gte: tomorrow,
                        lte: endOfTomorrow,
                    },
                    status: 'CONFIRMED',
                },
                include: {
                    client: true,
                    barber: true,
                    service: true,
                },
            });
            for (const appt of appointments) {
                const time = appt.startAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                // Notify Client
                const clientMsg = `Olá ${appt.client.name}, lembrete do seu agendamento amanhã às ${time} com ${appt.barber.name} na Barbearia Poukas.`;
                yield (0, exports.sendWhatsApp)(appt.client.phone, clientMsg);
                // Notify Barber
                const barberMsg = `Lembrete: Agendamento amanhã às ${time} com ${appt.client.name} (${appt.service.title}).`;
                yield (0, exports.sendWhatsApp)(appt.barber.phone, barberMsg);
            }
        }
        catch (error) {
            console.error('Error sending reminders:', error);
        }
    }));
    console.log('Notification scheduler initialized.');
};
exports.scheduleReminders = scheduleReminders;
