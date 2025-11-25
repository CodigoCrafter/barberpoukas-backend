"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const service_routes_1 = __importDefault(require("./routes/service.routes"));
const barber_routes_1 = __importDefault(require("./routes/barber.routes"));
const appointment_routes_1 = __importDefault(require("./routes/appointment.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const barber_dashboard_routes_1 = __importDefault(require("./routes/barber.dashboard.routes"));
const notification_service_1 = require("./services/notification.service");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 4000;
// Initialize Notifications
(0, notification_service_1.scheduleReminders)();
app.use((0, cors_1.default)({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express_1.default.json());
app.use('/api/auth', auth_routes_1.default);
app.use('/api/services', service_routes_1.default);
app.use('/api/barbers', barber_routes_1.default); // Public list
app.use('/api/barber', barber_dashboard_routes_1.default); // Private dashboard
app.use('/api/appointments', appointment_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
