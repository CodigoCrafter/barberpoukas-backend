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
exports.createService = exports.getServices = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getServices = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const services = yield prisma.service.findMany();
        res.json(services);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching services' });
    }
});
exports.getServices = getServices;
const createService = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, description, durationMinutes, price } = req.body;
        const service = yield prisma.service.create({
            data: { title, description, durationMinutes, price },
        });
        res.status(201).json(service);
    }
    catch (error) {
        res.status(500).json({ message: 'Error creating service' });
    }
});
exports.createService = createService;
