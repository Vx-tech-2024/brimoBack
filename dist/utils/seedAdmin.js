"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma_1 = __importDefault(require("../config/prisma"));
const seedAdmin = async () => {
    try {
        const email = process.env.ADMIN_EMAIL;
        const password = process.env.ADMIN_PASSWORD;
        const existingAdmin = await prisma_1.default.adminUser.findUnique({
            where: { email },
        });
        if (existingAdmin) {
            console.log("Admin already exists");
            return;
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const admin = await prisma_1.default.adminUser.create({
            data: {
                name: "Brimo",
                email,
                passwordHash: hashedPassword,
            },
        });
        console.log("Admin created successfully:", admin.email);
    }
    catch (error) {
        console.error("Error adding admin", error);
    }
    finally {
        await prisma_1.default.$disconnect();
    }
};
seedAdmin();
