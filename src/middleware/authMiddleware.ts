import { NextFunction,  Response } from "express";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma";
import { Request  } from "express-serve-static-core";

type JwtPayload = {
    adminId: string;
};

export interface AuthenticatedRequest extends Request {
    admin? : {
        id: string;
        email: string;
        name: string
    };
}

export const protect = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if(!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({message:"Not authorized."});
        }

        const token = authHeader.split(" ")[1];

        console.log("AUTH HEADER:", authHeader);
        console.log("TOKEN:", token);

        const secret = process.env.JWT_SECRET;

        if (!secret) {
            return res.status(500).json({message: "Missing key"});
        }

        const decoded = jwt.verify(token, secret) as JwtPayload;
        console.log("DECODED:", decoded);

        const admin = await prisma.adminUser.findUnique({
            where: { id:decoded.adminId },
            
            select: {
                id: true,
                email: true,
                name: true,
            },
        });
        console.log("ADMIN FOUND:", admin);

        if (!admin) {
            return res.status(401).json({message: "Access Denied"});
        }

        req.admin = admin;
        next();
    } catch (_error) {
        return res.status(401).json({message: "Invalid token"});
    }
};