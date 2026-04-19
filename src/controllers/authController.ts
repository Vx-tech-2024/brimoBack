import { Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../config/prisma";
import { generateToken } from "../utils/generateToken";
import { setAuthCookie } from "../utils/setAuthCookie";

export const loginAdmin = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({message: "Email and password are required"});
        }

        const admin = await prisma.adminUser.findUnique({
            where: { email },
        });

        if (!admin) {
            return res.status(401).json({message: "Invalid email or password"});
        }

        const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);

        if (!isPasswordValid) {
            return res.status(401).json({message: "Invalid email or password"});
        }

        const token = generateToken({ adminId: admin.id });
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
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({message: "Server error"});
    }
};

export const logoutAdmin = async (_req: Request, res:Response) => {
    res.cookie("token", "", {
        httpOnly: true,
        expires: new Date(0),
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    return res.status(200).json({message: "Logout successful"});
};

export const getCurrentAdmin = async (
    req: Request,
    res: Response
) => {
    return res.status(200).json({
        admin: req.admin,
    });
};