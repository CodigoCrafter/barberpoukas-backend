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
exports.logout = exports.refreshToken = exports.login = exports.register = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const crypto_1 = __importDefault(require("crypto"));
const prisma = new client_1.PrismaClient();
const registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    email: zod_1.z.string().email(),
    phone: zod_1.z.string().min(10),
    password: zod_1.z.string().min(6),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string(),
});
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, phone, password } = registerSchema.parse(req.body);
        const existingUser = yield prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const passwordHash = yield bcryptjs_1.default.hash(password, 10);
        const user = yield prisma.user.create({
            data: {
                name,
                email,
                phone,
                passwordHash,
            },
        });
        const accessToken = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
        const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id, jti: crypto_1.default.randomUUID() }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
        yield prisma.refreshToken.create({
            data: {
                userId: user.id,
                token: refreshToken,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });
        res.status(201).json({
            accessToken,
            refreshToken,
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ errors: error.errors });
        }
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = loginSchema.parse(req.body);
        const user = yield prisma.user.findUnique({ where: { email } });
        console.log('Login attempt:', email, 'User found:', !!user);
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const validPassword = yield bcryptjs_1.default.compare(password, user.passwordHash);
        console.log('Password valid:', validPassword);
        if (!validPassword) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const accessToken = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
        const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id, jti: crypto_1.default.randomUUID() }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
        yield prisma.refreshToken.create({
            data: {
                userId: user.id,
                token: refreshToken,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });
        res.json({
            accessToken,
            refreshToken,
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ errors: error.errors });
        }
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.login = login;
const refreshToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token } = req.body;
    if (!token)
        return res.sendStatus(401);
    const storedToken = yield prisma.refreshToken.findUnique({ where: { token } });
    if (!storedToken)
        return res.sendStatus(403);
    jsonwebtoken_1.default.verify(token, process.env.JWT_REFRESH_SECRET, (err, decoded) => __awaiter(void 0, void 0, void 0, function* () {
        if (err)
            return res.sendStatus(403);
        try {
            const user = yield prisma.user.findUnique({ where: { id: decoded.userId } });
            if (!user)
                return res.sendStatus(403);
            const accessToken = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
            res.json({ accessToken });
        }
        catch (error) {
            console.error(error);
            res.sendStatus(500);
        }
    }));
});
exports.refreshToken = refreshToken;
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token } = req.body;
    if (token) {
        yield prisma.refreshToken.deleteMany({ where: { token } });
    }
    res.sendStatus(204);
});
exports.logout = logout;
