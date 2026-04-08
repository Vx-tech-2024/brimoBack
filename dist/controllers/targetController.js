"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTeamMonthlyTarget = exports.updateTeamMonthlyTarget = exports.getTeamMonthlyTargetById = exports.getAllTeamMonthlyTargets = exports.createTeamMonthlyTarget = exports.deleteAgentMonthlyTarget = exports.updateAgentMonthlyTarget = exports.getAgentMonthlyTargetById = exports.getAllAgentMonthlyTargets = exports.createAgentMonthlyTarget = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const getParam_1 = require("../utils/getParam");
const isValidMonth = (month) => Number.isInteger(month) && Number(month) >= 1 && Number(month) <= 12;
const isValidYear = (year) => Number.isInteger(year) && Number(year) >= 2000 && Number(year) <= 3000;
const isValidPositiveNumber = (value) => typeof value === "number" && value > 0;
const isValidNonNegativeInteger = (value) => Number.isInteger(value) && Number(value) >= 0;
/*AGENT TARGETS*/
const createAgentMonthlyTarget = async (req, res) => {
    try {
        const { teamMemberId, month, year, targetAmount, targetLoanCount } = req.body;
        if (typeof teamMemberId !== "string" || !teamMemberId.trim()) {
            return res.status(400).json({ message: "Team member is required." });
        }
        if (!isValidMonth(month)) {
            return res.status(400).json({ message: "Month must be between 1 and 12." });
        }
        if (!isValidYear(year)) {
            return res.status(400).json({ message: "Year is invalid." });
        }
        if (!isValidPositiveNumber(targetAmount)) {
            return res.status(400).json({ message: "Target amount must be greater than 0." });
        }
        if (!isValidNonNegativeInteger(targetLoanCount)) {
            return res.status(400).json({ message: "Target loan count must be 0 or more." });
        }
        const member = await prisma_1.default.teamMember.findUnique({
            where: { id: teamMemberId },
        });
        if (!member) {
            return res.status(404).json({ message: "Team member not found." });
        }
        const existingTarget = await prisma_1.default.agentMonthlyTarget.findUnique({
            where: {
                teamMemberId_month_year: {
                    teamMemberId,
                    month,
                    year,
                },
            },
        });
        if (existingTarget) {
            return res.status(409).json({
                message: "A target for this team member, month, and year already exists.",
            });
        }
        const target = await prisma_1.default.agentMonthlyTarget.create({
            data: {
                teamMemberId,
                month,
                year,
                targetAmount,
                targetLoanCount,
            },
            include: {
                teamMember: true,
            },
        });
        return res.status(201).json({
            message: "Agent monthly target created successfully.",
            target,
        });
    }
    catch (error) {
        console.error("Create agent monthly target error:", error);
        return res.status(500).json({
            message: "Server error while creating agent monthly target.",
        });
    }
};
exports.createAgentMonthlyTarget = createAgentMonthlyTarget;
const getAllAgentMonthlyTargets = async (req, res) => {
    try {
        const { month, year, teamMemberId } = req.query;
        const targets = await prisma_1.default.agentMonthlyTarget.findMany({
            where: {
                ...(typeof month === "string" ? { month: Number(month) } : {}),
                ...(typeof year === "string" ? { year: Number(year) } : {}),
                ...(typeof teamMemberId === "string" ? { teamMemberId } : {}),
            },
            include: {
                teamMember: true,
            },
            orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
        });
        return res.status(200).json({ targets });
    }
    catch (error) {
        console.error("Get all agent monthly targets error:", error);
        return res.status(500).json({
            message: "Server error while fetching agent monthly targets.",
        });
    }
};
exports.getAllAgentMonthlyTargets = getAllAgentMonthlyTargets;
const getAgentMonthlyTargetById = async (req, res) => {
    try {
        const id = (0, getParam_1.getParam)(req.params.id);
        const target = await prisma_1.default.agentMonthlyTarget.findUnique({
            where: { id },
            include: {
                teamMember: true,
            },
        });
        if (!target) {
            return res.status(404).json({ message: "Agent monthly target not found." });
        }
        return res.status(200).json({ target });
    }
    catch (error) {
        console.error("Get agent monthly target by ID error:", error);
        return res.status(500).json({
            message: "Server error while fetching agent monthly target.",
        });
    }
};
exports.getAgentMonthlyTargetById = getAgentMonthlyTargetById;
const updateAgentMonthlyTarget = async (req, res) => {
    try {
        const id = (0, getParam_1.getParam)(req.params.id);
        const { teamMemberId, month, year, targetAmount, targetLoanCount } = req.body;
        const existingTarget = await prisma_1.default.agentMonthlyTarget.findUnique({
            where: { id },
        });
        if (!existingTarget) {
            return res.status(404).json({ message: "Agent monthly target not found." });
        }
        if (typeof teamMemberId !== "string" || !teamMemberId.trim()) {
            return res.status(400).json({ message: "Team member is required." });
        }
        if (!isValidMonth(month)) {
            return res.status(400).json({ message: "Month must be between 1 and 12." });
        }
        if (!isValidYear(year)) {
            return res.status(400).json({ message: "Year is invalid." });
        }
        if (!isValidPositiveNumber(targetAmount)) {
            return res.status(400).json({ message: "Target amount must be greater than 0." });
        }
        if (!isValidNonNegativeInteger(targetLoanCount)) {
            return res.status(400).json({ message: "Target loan count must be 0 or more." });
        }
        const member = await prisma_1.default.teamMember.findUnique({
            where: { id: teamMemberId },
        });
        if (!member) {
            return res.status(404).json({ message: "Team member not found." });
        }
        const duplicateTarget = await prisma_1.default.agentMonthlyTarget.findFirst({
            where: {
                teamMemberId,
                month,
                year,
                NOT: {
                    id,
                },
            },
        });
        if (duplicateTarget) {
            return res.status(409).json({
                message: "Another target for this team member, month, and year already exists.",
            });
        }
        const target = await prisma_1.default.agentMonthlyTarget.update({
            where: { id },
            data: {
                teamMemberId,
                month,
                year,
                targetAmount,
                targetLoanCount,
            },
            include: {
                teamMember: true,
            },
        });
        return res.status(200).json({
            message: "Agent monthly target updated successfully.",
            target,
        });
    }
    catch (error) {
        console.error("Update agent monthly target error:", error);
        return res.status(500).json({
            message: "Server error while updating agent monthly target.",
        });
    }
};
exports.updateAgentMonthlyTarget = updateAgentMonthlyTarget;
const deleteAgentMonthlyTarget = async (req, res) => {
    try {
        const id = (0, getParam_1.getParam)(req.params.id);
        const existingTarget = await prisma_1.default.agentMonthlyTarget.findUnique({
            where: { id },
        });
        if (!existingTarget) {
            return res.status(404).json({ message: "Agent monthly target not found." });
        }
        await prisma_1.default.agentMonthlyTarget.delete({
            where: { id },
        });
        return res.status(200).json({
            message: "Agent monthly target deleted successfully.",
        });
    }
    catch (error) {
        console.error("Delete agent monthly target error:", error);
        return res.status(500).json({
            message: "Server error while deleting agent monthly target.",
        });
    }
};
exports.deleteAgentMonthlyTarget = deleteAgentMonthlyTarget;
/*TEAM TARGETS*/
const createTeamMonthlyTarget = async (req, res) => {
    try {
        const { month, year, targetAmount, targetLoanCount } = req.body;
        if (!isValidMonth(month)) {
            return res.status(400).json({ message: "Month must be between 1 and 12." });
        }
        if (!isValidYear(year)) {
            return res.status(400).json({ message: "Year is invalid." });
        }
        if (!isValidPositiveNumber(targetAmount)) {
            return res.status(400).json({ message: "Target amount must be greater than 0." });
        }
        if (!isValidNonNegativeInteger(targetLoanCount)) {
            return res.status(400).json({ message: "Target loan count must be 0 or more." });
        }
        const existingTarget = await prisma_1.default.teamMonthlyTarget.findUnique({
            where: {
                month_year: {
                    month,
                    year,
                },
            },
        });
        if (existingTarget) {
            return res.status(409).json({
                message: "A team target for this month and year already exists.",
            });
        }
        const target = await prisma_1.default.teamMonthlyTarget.create({
            data: {
                month,
                year,
                targetAmount,
                targetLoanCount,
            },
        });
        return res.status(201).json({
            message: "Team monthly target created successfully.",
            target,
        });
    }
    catch (error) {
        console.error("Create team monthly target error:", error);
        return res.status(500).json({
            message: "Server error while creating team monthly target.",
        });
    }
};
exports.createTeamMonthlyTarget = createTeamMonthlyTarget;
const getAllTeamMonthlyTargets = async (req, res) => {
    try {
        const { month, year } = req.query;
        const targets = await prisma_1.default.teamMonthlyTarget.findMany({
            where: {
                ...(typeof month === "string" ? { month: Number(month) } : {}),
                ...(typeof year === "string" ? { year: Number(year) } : {}),
            },
            orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
        });
        return res.status(200).json({ targets });
    }
    catch (error) {
        console.error("Get all team monthly targets error:", error);
        return res.status(500).json({
            message: "Server error while fetching team monthly targets.",
        });
    }
};
exports.getAllTeamMonthlyTargets = getAllTeamMonthlyTargets;
const getTeamMonthlyTargetById = async (req, res) => {
    try {
        const id = (0, getParam_1.getParam)(req.params.id);
        const target = await prisma_1.default.teamMonthlyTarget.findUnique({
            where: { id },
        });
        if (!target) {
            return res.status(404).json({ message: "Team monthly target not found." });
        }
        return res.status(200).json({ target });
    }
    catch (error) {
        console.error("Get team monthly target by ID error:", error);
        return res.status(500).json({
            message: "Server error while fetching team monthly target.",
        });
    }
};
exports.getTeamMonthlyTargetById = getTeamMonthlyTargetById;
const updateTeamMonthlyTarget = async (req, res) => {
    try {
        const id = (0, getParam_1.getParam)(req.params.id);
        const { month, year, targetAmount, targetLoanCount } = req.body;
        const existingTarget = await prisma_1.default.teamMonthlyTarget.findUnique({
            where: { id },
        });
        if (!existingTarget) {
            return res.status(404).json({ message: "Team monthly target not found." });
        }
        if (!isValidMonth(month)) {
            return res.status(400).json({ message: "Month must be between 1 and 12." });
        }
        if (!isValidYear(year)) {
            return res.status(400).json({ message: "Year is invalid." });
        }
        if (!isValidPositiveNumber(targetAmount)) {
            return res.status(400).json({ message: "Target amount must be greater than 0." });
        }
        if (!isValidNonNegativeInteger(targetLoanCount)) {
            return res.status(400).json({ message: "Target loan count must be 0 or more." });
        }
        const duplicateTarget = await prisma_1.default.teamMonthlyTarget.findFirst({
            where: {
                month,
                year,
                NOT: {
                    id,
                },
            },
        });
        if (duplicateTarget) {
            return res.status(409).json({
                message: "Another team target for this month and year already exists.",
            });
        }
        const target = await prisma_1.default.teamMonthlyTarget.update({
            where: { id },
            data: {
                month,
                year,
                targetAmount,
                targetLoanCount,
            },
        });
        return res.status(200).json({
            message: "Team monthly target updated successfully.",
            target,
        });
    }
    catch (error) {
        console.error("Update team monthly target error:", error);
        return res.status(500).json({
            message: "Server error while updating team monthly target.",
        });
    }
};
exports.updateTeamMonthlyTarget = updateTeamMonthlyTarget;
const deleteTeamMonthlyTarget = async (req, res) => {
    try {
        const id = (0, getParam_1.getParam)(req.params.id);
        const existingTarget = await prisma_1.default.teamMonthlyTarget.findUnique({
            where: { id },
        });
        if (!existingTarget) {
            return res.status(404).json({ message: "Team monthly target not found." });
        }
        await prisma_1.default.teamMonthlyTarget.delete({
            where: { id },
        });
        return res.status(200).json({
            message: "Team monthly target deleted successfully.",
        });
    }
    catch (error) {
        console.error("Delete team monthly target error:", error);
        return res.status(500).json({
            message: "Server error while deleting team monthly target.",
        });
    }
};
exports.deleteTeamMonthlyTarget = deleteTeamMonthlyTarget;
