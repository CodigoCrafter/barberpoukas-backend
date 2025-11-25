"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const barber_dashboard_controller_1 = require("../controllers/barber.dashboard.controller");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
// Middleware to ensure user is a BARBER
const isBarber = (req, res, next) => {
    if (req.user.role !== 'BARBER') {
        return res.status(403).json({ message: 'Access denied. Barbers only.' });
    }
    next();
};
router.use(isBarber);
router.get('/appointments', barber_dashboard_controller_1.getMyAppointments);
router.patch('/appointments/:id/status', barber_dashboard_controller_1.updateAppointmentStatus);
router.get('/availability', barber_dashboard_controller_1.getAvailability);
router.post('/availability', barber_dashboard_controller_1.setAvailability);
router.delete('/availability/:id', barber_dashboard_controller_1.deleteAvailability);
exports.default = router;
