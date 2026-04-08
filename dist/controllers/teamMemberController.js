"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTeamMember = exports.updateTeamMember = exports.getTeamMemberById = exports.getAllTeamMembers = exports.createTeamMember = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const validators_1 = require("../utils/validators");
const getParam_1 = require("../utils/getParam");
const createTeamMember = async (req, res) => {
    try {
        const { fullName, employmentNumber, monthsInService, status } = req.body;
        if (!(0, validators_1.isNonEmptyString)(fullName)) {
            return res.status(400).json({ message: "Full name is required" });
        }
        if (!(0, validators_1.isNonEmptyString)(employmentNumber)) {
            return res.status(400).json({ message: "Employment number is required" });
        }
        if (!(0, validators_1.isValidNonNegativeInteger)(monthsInService)) {
            return res
                .status(400)
                .json({ messgae: "Months in service cannot be negative" });
        }
        const existingMember = await prisma_1.default.teamMember.findUnique({
            where: { employmentNumber: employmentNumber.trim() },
        });
        if (existingMember) {
            return res
                .status(400)
                .json({ message: "A team member with that employment number already exists" });
        }
        const member = await prisma_1.default.teamMember.create({
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
    }
    catch (error) {
        console.error("Create team member error:", error);
        return res.status(500).json({ message: "Server error while creating team member" });
    }
};
exports.createTeamMember = createTeamMember;
const getAllTeamMembers = async (_req, res) => {
    try {
        const members = await prisma_1.default.teamMember.findMany({
            orderBy: { monthsInService: "desc" },
        });
        return res.status(200).json({ members });
    }
    catch (error) {
        console.error("Get all team members error:", error);
        return res.status(500).json({ message: "Server error while fetching team members" });
    }
};
exports.getAllTeamMembers = getAllTeamMembers;
const getTeamMemberById = async (req, res) => {
    try {
        const id = (0, getParam_1.getParam)(req.params.id);
        const member = await prisma_1.default.teamMember.findUnique({
            where: { id },
        });
        if (!member) {
            return res.status(404).json({ message: "Server error while fetching team member" });
        }
        return res.status(200).json({ member });
    }
    catch (error) {
        console.error("Get team member error by ID:", error);
        return res.status(500).json({ message: "Server error while fetching team member" });
    }
};
exports.getTeamMemberById = getTeamMemberById;
const updateTeamMember = async (req, res) => {
    try {
        const id = (0, getParam_1.getParam)(req.params.id);
        const { fullName, employmentNumber, monthsInService, status } = req.body;
        const existingMember = await prisma_1.default.teamMember.findUnique({
            where: { id },
        });
        if (!existingMember) {
            return res.status(404).json({ message: "Team member not found" });
        }
        if (!(0, validators_1.isNonEmptyString)(fullName)) {
            return res.status(400).json({ message: "Full name is required" });
        }
        if (!(0, validators_1.isNonEmptyString)(employmentNumber)) {
            return res.status(400).json({ message: "Employment number is required" });
        }
        if (!(0, validators_1.isValidNonNegativeInteger)(monthsInService)) {
            return res
                .status(400)
                .json({ message: "Months in sevice cannot be negative" });
        }
        const duplicateEmploymentNumber = await prisma_1.default.teamMember.findFirst({
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
                .json({ message: "A member with that employment number exists" });
        }
        const updatedMember = await prisma_1.default.teamMember.update({
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
    }
    catch (error) {
        console.error("Updated team member error:", error);
        return res.status(500).json({ message: "Server errror while updating the team meber" });
    }
};
exports.updateTeamMember = updateTeamMember;
const deleteTeamMember = async (req, res) => {
    try {
        const id = (0, getParam_1.getParam)(req.params.id);
        const existingMember = await prisma_1.default.teamMember.findUnique({
            where: { id },
        });
        if (!existingMember) {
            return res.status(404).json({ message: "Team member not found" });
        }
        await prisma_1.default.teamMember.delete({
            where: { id },
        });
        return res.status(200).json({ message: "Team member deleted successfully" });
    }
    catch (error) {
        console.error("Delete team member error:", error);
        return res.status(500).json({ message: "Server error while deleting team member" });
    }
};
exports.deleteTeamMember = deleteTeamMember;
