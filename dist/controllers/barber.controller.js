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
exports.getBarbers = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getBarbers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const barbers = yield prisma.user.findMany({
            where: { role: 'BARBER' },
            select: {
                id: true,
                name: true,
                bio: true,
                photoUrl: true,
                availabilities: true,
            }
        });
        res.json(barbers);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching barbers' });
    }
});
exports.getBarbers = getBarbers;
// createBarber is now handled in admin.controller.ts
