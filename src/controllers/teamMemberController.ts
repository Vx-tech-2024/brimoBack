import { Request, Response } from "express";
import prisma from "../config/prisma";
import { isNonEmptyString, isValidNonNegativeInteger } from "../utils/validators";
import { getParam } from "../utils/getParam";

export const createTeamMember = async (req: Request, res: Response) => {
    try {
        const { fullName, employmentNumber, monthsInService, status } = req.body;

        if (!isNonEmptyString(fullName)) {
            return res.status(400).json({ message: "Full name is required" });
        }

        if (!isNonEmptyString(employmentNumber)) {
            return res.status(400).json({message: "Employment number is required"});
        }

        if (!isValidNonNegativeInteger(monthsInService)) {
            return res
              .status(400)
              .json({messgae: "Months in service cannot be negative"});
        }

        const existingMember = await prisma.teamMember.findUnique({
            where: { employmentNumber: employmentNumber.trim() },
        });

        if (existingMember) {
            return res
               .status(400)
               .json({message: "A team member with that employment number already exists"});
        }

        const member = await prisma.teamMember.create({
            data: {
                fullName: fullName.trim(),
                employmentNumber: employmentNumber.trim(),
                monthsInService,
                status: status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
            },
        });

        return res.status(201).json({
            message: "Team member created successfully",
            member,
        });
    } catch (error) {
        console.error("Create team member error:", error);
        return res.status(500).json({message: "Server error while creating team member"});
    }
};

export const getAllTeamMembers = async (_req: Request, res: Response) => {
    try {
        const members = await prisma.teamMember.findMany({
            orderBy: { monthsInService: "desc" },
        });

        return res.status(200).json({ members });
    } catch (error) {
        console.error("Get all team members error:", error);
        return res.status(500).json({message: "Server error while fetching team members"});
    }
};

export const getTeamMemberById = async (req: Request, res: Response) => {
    try {
        const id = getParam(req.params.id);
        const member = await prisma.teamMember.findUnique({
            where: { id },
        });

        if (!member) {
            return res.status(404).json({message: "Server error while fetching team member"});
        }

        return res.status(200).json({ member });
    } catch (error) {
        console.error("Get team member error by ID:", error);
        return res.status(500).json({message: "Server error while fetching team member"});
    }
};

export const updateTeamMember = async (req: Request, res: Response) => {
    try {
        const id = getParam(req.params.id);
        const { fullName, employmentNumber, monthsInService, status } = req.body;

        const existingMember = await prisma.teamMember.findUnique({
            where: { id },
        });

        if (!existingMember) {
            return res.status(404).json({message: "Team member not found"});
        }

        if (!isNonEmptyString(fullName)) {
            return res.status(400).json({message: "Full name is required"});
        }

        if (!isNonEmptyString(employmentNumber)) {
            return res.status(400).json({message: "Employment number is required"});
        }

        if (!isValidNonNegativeInteger(monthsInService)) {
            return res
               .status(400)
               .json({message: "Months in sevice cannot be negative"});
        }

        const duplicateEmploymentNumber = await prisma.teamMember.findFirst({
            where: {
                employmentNumber: employmentNumber.trim(),
                NOT: {
                    id,
                },
            },
        });

        if (duplicateEmploymentNumber) {
            return res
               .status(409)
               .json({message: "A member with that employment number exists"});
        }

        const updatedMember = await prisma.teamMember.update({
            where: { id },
            data: {
                fullName: fullName.trim(),
                employmentNumber: employmentNumber.trim(),
                monthsInService,
                status: status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
            },
        });

        return res.status(200).json({
            message: "Team member updated successfully",
            member: updatedMember,
        });
    } catch (error) {
        console.error("Updated team member error:", error);
        return res.status(500).json({message: "Server errror while updating the team meber"});
    }
};

export const deleteTeamMember = async (req: Request, res: Response) => {
    try {
        const id = getParam(req.params.id);

        const existingMember = await prisma.teamMember.findUnique({
            where: { id },
        });

        if (!existingMember) {
            return res.status(404).json({message: "Team member not found"});
        }

        await prisma.teamMember.delete({
            where: { id },
        });

        return res.status(200).json({message: "Team member deleted successfully"});
    } catch (error) {
        console.error("Delete team member error:", error);
        return res.status(500).json({message: "Server error while deleting team member"});
    }
};