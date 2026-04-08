"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentAdmin = exports.logoutAdmin = exports.loginAdmin = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma_1 = __importDefault(require("../config/prisma"));
const generateToken_1 = require("../utils/generateToken");
const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }
        const admin = await prisma_1.default.adminUser.findUnique({
            where: { email },
        });
        if (!admin) {
            return res.status(401).json({ message: "Invalid email or password" });
        }
        const isPasswordValid = await bcrypt_1.default.compare(password, admin.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid email or password" });
        }
        const token = (0, generateToken_1.generateToken)({ adminId: admin.id });
        //setAuthCookie(res, token);
        return res.status(200).json({
            message: "Login successful",
            token,
            admin: {
                id: admin.id,
                name: admin.name,
                email: admin.email,
            },
        });
    }
    catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
exports.loginAdmin = loginAdmin;
const logoutAdmin = async (_req, res) => {
    res.cookie("token", "", {
        httpOnly: true,
        expires: new Date(0),
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });
    return res.status(200).json({ message: "Logout successful" });
};
exports.logoutAdmin = logoutAdmin;
const getCurrentAdmin = async (req, res) => {
    return res.status(200).json({
        admin: req.admin,
    });
};
exports.getCurrentAdmin = getCurrentAdmin;
