"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../config/prisma"));
const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Not authorized." });
        }
        const token = authHeader.split(" ")[1];
        console.log("AUTH HEADER:", authHeader);
        console.log("TOKEN:", token);
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            return res.status(500).json({ message: "Missing key" });
        }
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        console.log("DECODED:", decoded);
        const admin = await prisma_1.default.adminUser.findUnique({
            where: { id: decoded.adminId },
            select: {
                id: true,
                email: true,
                name: true,
            },
        });
        console.log("ADMIN FOUND:", admin);
        if (!admin) {
            return res.status(401).json({ message: "Access Denied" });
        }
        req.admin = admin;
        next();
    }
    catch (_error) {
        return res.status(401).json({ message: "Invalid token" });
    }
};
exports.protect = protect;
