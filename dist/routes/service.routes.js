"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const service_controller_1 = require("../controllers/service.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', service_controller_1.getServices);
router.post('/', auth_1.authenticateToken, auth_1.isAdmin, service_controller_1.createService);
exports.default = router;
