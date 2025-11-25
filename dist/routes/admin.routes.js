"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const admin_controller_1 = require("../controllers/admin.controller");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
router.use(auth_1.isAdmin);
router.get('/overview', admin_controller_1.getOverview);
router.get('/agenda', admin_controller_1.getDailyAgenda);
router.patch('/appointments/:id/status', admin_controller_1.updateAppointmentStatus);
// Services
router.post('/services', admin_controller_1.createService);
router.patch('/services/:id', admin_controller_1.updateService);
router.delete('/services/:id', admin_controller_1.deleteService);
// Barbers
router.post('/barbers', admin_controller_1.createBarber);
router.patch('/barbers/:id', admin_controller_1.updateBarber);
router.delete('/barbers/:id', admin_controller_1.deleteBarber);
exports.default = router;
