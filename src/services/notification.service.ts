import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mock Notification Senders
export const sendWhatsApp = async (to: string, message: string) => {
  console.log(`[WhatsApp] Sending to ${to}: ${message}`);
  // Integration with Twilio would go here
};

export const sendEmail = async (to: string, subject: string, body: string) => {
  console.log(`[Email] Sending to ${to} | Subject: ${subject}`);
  console.log(`[Email Body]: ${body}`);
  // Integration with SendGrid would go here
};

// Daily Reminder Job
export const scheduleReminders = () => {
  // Run every day at 08:00 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('Running daily appointment reminders...');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const endOfTomorrow = new Date(tomorrow);
    endOfTomorrow.setHours(23, 59, 59, 999);

    try {
      const appointments = await prisma.appointment.findMany({
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
        await sendWhatsApp(appt.client.phone, clientMsg);
        
        // Notify Barber
        const barberMsg = `Lembrete: Agendamento amanhã às ${time} com ${appt.client.name} (${appt.service.title}).`;
        await sendWhatsApp(appt.barber.phone, barberMsg);
      }
    } catch (error) {
      console.error('Error sending reminders:', error);
    }
  });
  
  console.log('Notification scheduler initialized.');
};
