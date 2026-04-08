import "dotenv/config";
import bcrypt from "bcrypt";
import prisma from "../config/prisma";

const seedAdmin = async () => {
    try {
        const email = process.env.ADMIN_EMAIL!;
        const password = process.env.ADMIN_PASSWORD!;

        const existingAdmin = await prisma.adminUser.findUnique({
            where: { email },
        });

        if (existingAdmin) {
            console.log("Admin already exists");
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = await prisma.adminUser.create({
            data:{
                name: "Brimo",
                email,
                passwordHash: hashedPassword,
            },
        });

        console.log("Admin created successfully:", admin.email);
    } catch (error) {
        console.error("Error adding admin", error);
    } finally {
        await prisma.$disconnect();
    }
};

seedAdmin();