import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import serviceRoutes from './routes/service.routes';
import barberRoutes from './routes/barber.routes';
import appointmentRoutes from './routes/appointment.routes';
import adminRoutes from './routes/admin.routes';

import barberDashboardRoutes from './routes/barber.dashboard.routes';

import { scheduleReminders } from './services/notification.service';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// Initialize Notifications
scheduleReminders();

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/barbers', barberRoutes); // Public list
app.use('/api/barber', barberDashboardRoutes); // Private dashboard
app.use('/api/appointments', appointmentRoutes);
app.use('/api/admin', adminRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
