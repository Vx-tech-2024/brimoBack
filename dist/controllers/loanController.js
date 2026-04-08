"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteLoanEntry = exports.updateLoanEntry = exports.getLoanEntryById = exports.getAllLoanEntries = exports.createLoanEntry = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const validators_1 = require("../utils/validators");
const generateLoanReference_1 = require("../utils/generateLoanReference");
const getParam_1 = require("../utils/getParam");
const validStatuses = ["PENDING", "DISBURSED", "REJECTED"];
const createLoanEntry = async (req, res) => {
    try {
        const { teamMemberId, loanType, loanAmount, amountDisbursed, status, createdDate, disbursedDate, notes, } = req.body;
        if (!(0, validators_1.isNonEmptyString)(teamMemberId)) {
            return res.status(400).json({ message: "Team member is required." });
        }
        if (!(0, validators_1.isNonEmptyString)(loanType)) {
            return res.status(400).json({ message: "Loan type is required." });
        }
        if (typeof loanAmount !== "number" || loanAmount <= 0) {
            return res.status(400).json({ message: "Loan amount must be greater than 0." });
        }
        if (!(0, validators_1.isNonEmptyString)(createdDate)) {
            return res.status(400).json({ message: "Created date is required." });
        }
        const teamMember = await prisma_1.default.teamMember.findUnique({
            where: { id: teamMemberId },
        });
        if (!teamMember) {
            return res.status(404).json({ message: "Assigned team member not found." });
        }
        const normalizedStatus = typeof status === "string" && validStatuses.includes(status)
            ? status
            : "PENDING";
        if (normalizedStatus === "DISBURSED" &&
            (typeof amountDisbursed !== "number" || amountDisbursed <= 0)) {
            return res.status(400).json({
                message: "Amount disbursed must be greater than 0 when status is DISBURSED.",
            });
        }
        if (normalizedStatus === "REJECTED" && amountDisbursed && amountDisbursed > 0) {
            return res.status(400).json({
                message: "Rejected loans cannot have amount disbursed greater than 0.",
            });
        }
        const loan = await prisma_1.default.loanEntry.create({
            data: {
                loanReference: (0, generateLoanReference_1.generateLoanReference)(),
                teamMemberId,
                loanType: loanType.trim(),
                loanAmount,
                amountDisbursed: normalizedStatus === "DISBURSED"
                    ? amountDisbursed
                    : normalizedStatus === "REJECTED"
                        ? 0
                        : amountDisbursed ?? null,
                status: normalizedStatus,
                createdDate: new Date(createdDate),
                disbursedDate: normalizedStatus === "DISBURSED" && disbursedDate
                    ? new Date(disbursedDate)
                    : normalizedStatus === "DISBURSED"
                        ? new Date()
                        : null,
                notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
            },
            include: {
                teamMember: true,
            },
        });
        return res.status(201).json({
            message: "Loan entry created successfully.",
            loan,
        });
    }
    catch (error) {
        console.error("Create loan entry error:", error);
        return res.status(500).json({ message: "Server error while creating loan entry." });
    }
};
exports.createLoanEntry = createLoanEntry;
const getAllLoanEntries = async (req, res) => {
    try {
        const { status, teamMemberId, loanType } = req.query;
        const loans = await prisma_1.default.loanEntry.findMany({
            where: {
                ...(typeof status === "string" && validStatuses.includes(status) ? { status: status } : {}),
                ...(typeof teamMemberId === "string" ? { teamMemberId } : {}),
                ...(typeof loanType === "string" ? { loanType } : {}),
            },
            include: {
                teamMember: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        return res.status(200).json({ loans });
    }
    catch (error) {
        console.error("Get all loans error:", error);
        return res.status(500).json({ message: "Server error while fetching loan entries." });
    }
};
exports.getAllLoanEntries = getAllLoanEntries;
const getLoanEntryById = async (req, res) => {
    try {
        const id = (0, getParam_1.getParam)(req.params.id);
        const loan = await prisma_1.default.loanEntry.findUnique({
            where: { id },
            include: {
                teamMember: true,
            },
        });
        if (!loan) {
            return res.status(404).json({ message: "Loan entry not found." });
        }
        return res.status(200).json({ loan });
    }
    catch (error) {
        console.error("Get loan by id error:", error);
        return res.status(500).json({ message: "Server error while fetching loan entry." });
    }
};
exports.getLoanEntryById = getLoanEntryById;
const updateLoanEntry = async (req, res) => {
    try {
        const id = (0, getParam_1.getParam)(req.params.id);
        const { teamMemberId, loanType, loanAmount, amountDisbursed, status, createdDate, disbursedDate, notes, } = req.body;
        const existingLoan = await prisma_1.default.loanEntry.findUnique({
            where: { id },
        });
        if (!existingLoan) {
            return res.status(404).json({ message: "Loan entry not found." });
        }
        if (!(0, validators_1.isNonEmptyString)(teamMemberId)) {
            return res.status(400).json({ message: "Team member is required." });
        }
        if (!(0, validators_1.isNonEmptyString)(loanType)) {
            return res.status(400).json({ message: "Loan type is required." });
        }
        if (typeof loanAmount !== "number" || loanAmount <= 0) {
            return res.status(400).json({ message: "Loan amount must be greater than 0." });
        }
        if (!(0, validators_1.isNonEmptyString)(createdDate)) {
            return res.status(400).json({ message: "Created date is required." });
        }
        const teamMember = await prisma_1.default.teamMember.findUnique({
            where: { id: teamMemberId },
        });
        if (!teamMember) {
            return res.status(404).json({ message: "Assigned team member not found." });
        }
        const normalizedStatus = typeof status === "string" && validStatuses.includes(status)
            ? status
            : "PENDING";
        if (normalizedStatus === "DISBURSED" &&
            (typeof amountDisbursed !== "number" || amountDisbursed <= 0)) {
            return res.status(400).json({
                message: "Amount disbursed must be greater than 0 when status is DISBURSED.",
            });
        }
        if (normalizedStatus === "REJECTED" && amountDisbursed && amountDisbursed > 0) {
            return res.status(400).json({
                message: "Rejected loans cannot have amount disbursed greater than 0.",
            });
        }
        const updatedLoan = await prisma_1.default.loanEntry.update({
            where: { id },
            data: {
                teamMemberId,
                loanType: loanType.trim(),
                loanAmount,
                amountDisbursed: normalizedStatus === "DISBURSED"
                    ? amountDisbursed
                    : normalizedStatus === "REJECTED"
                        ? 0
                        : amountDisbursed ?? null,
                status: normalizedStatus,
                createdDate: new Date(createdDate),
                disbursedDate: normalizedStatus === "DISBURSED"
                    ? disbursedDate
                        ? new Date(disbursedDate)
                        : existingLoan.disbursedDate ?? new Date()
                    : null,
                notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
            },
            include: {
                teamMember: true,
            },
        });
        return res.status(200).json({
            message: "Loan entry updated successfully.",
            loan: updatedLoan,
        });
    }
    catch (error) {
        console.error("Update loan entry error:", error);
        return res.status(500).json({ message: "Server error while updating loan entry." });
    }
};
exports.updateLoanEntry = updateLoanEntry;
const deleteLoanEntry = async (req, res) => {
    try {
        const id = (0, getParam_1.getParam)(req.params.id);
        const existingLoan = await prisma_1.default.loanEntry.findUnique({
            where: { id },
        });
        if (!existingLoan) {
            return res.status(404).json({ message: "Loan entry not found." });
        }
        await prisma_1.default.loanEntry.delete({
            where: { id },
        });
        return res.status(200).json({ message: "Loan entry deleted successfully." });
    }
    catch (error) {
        console.error("Delete loan entry error:", error);
        return res.status(500).json({ message: "Server error while deleting loan entry." });
    }
};
exports.deleteLoanEntry = deleteLoanEntry;
