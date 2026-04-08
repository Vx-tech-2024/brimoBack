"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLoanMonitoringSummary = exports.getDailySummary = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const getStartOfDay = (date) => {
    const baseDate = date ? new Date(date) : new Date();
    const start = new Date(baseDate);
    start.setHours(0, 0, 0, 0);
    return start;
};
const getEndOfDay = (date) => {
    const baseDate = date ? new Date(date) : new Date();
    const end = new Date(baseDate);
    end.setHours(23, 59, 59, 999);
    return end;
};
const getMonthRange = (month, year) => {
    const now = new Date();
    const selectedMonth = month ?? now.getMonth() + 1;
    const selectedYear = year ?? now.getFullYear();
    const start = new Date(selectedYear, selectedMonth - 1, 1);
    const end = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999);
    return { start, end };
};
const getDailySummary = async (req, res) => {
    try {
        const selectedDate = typeof req.query.date === "string" ? req.query.date : undefined;
        const teamMemberId = typeof req.query.teamMemberId === "string" ? req.query.teamMemberId : undefined;
        const month = typeof req.query.month === "string" ? Number(req.query.month) : undefined;
        const year = typeof req.query.year === "string" ? Number(req.query.year) : undefined;
        const startOfDay = getStartOfDay(selectedDate);
        const endOfDay = getEndOfDay(selectedDate);
        const whereCreated = {
            createdDate: {
                gte: startOfDay,
                lte: endOfDay,
            },
            ...(teamMemberId ? { teamMemberId } : {}),
        };
        const whereDisbursed = {
            disbursedDate: {
                gte: startOfDay,
                lte: endOfDay,
            },
            status: "DISBURSED",
            ...(teamMemberId ? { teamMemberId } : {}),
        };
        const [loansCreatedToday, loansDisbursedToday, createdLoanAggregate, disbursedLoanAggregate, pendingLoansToday, rejectedLoansToday,] = await Promise.all([
            prisma_1.default.loanEntry.count({
                where: whereCreated,
            }),
            prisma_1.default.loanEntry.count({
                where: whereDisbursed,
            }),
            prisma_1.default.loanEntry.aggregate({
                where: whereCreated,
                _sum: {
                    loanAmount: true,
                },
            }),
            prisma_1.default.loanEntry.aggregate({
                where: whereDisbursed,
                _sum: {
                    amountDisbursed: true,
                },
            }),
            prisma_1.default.loanEntry.count({
                where: {
                    ...whereCreated,
                    status: "PENDING",
                },
            }),
            prisma_1.default.loanEntry.count({
                where: {
                    ...whereCreated,
                    status: "REJECTED",
                },
            }),
        ]);
        return res.status(200).json({
            month,
            year,
            date: selectedDate ?? startOfDay.toISOString(),
            summary: {
                loansCreatedToday,
                loansDisbursedToday,
                totalAmountCreatedToday: createdLoanAggregate._sum.loanAmount ?? 0,
                totalAmountDisbursedToday: disbursedLoanAggregate._sum.amountDisbursed ?? 0,
                pendingLoansToday,
                rejectedLoansToday,
            },
        });
    }
    catch (error) {
        console.error("Get daily summary error:", error);
        return res.status(500).json({
            message: "Server error while fetching daily summary.",
        });
    }
};
exports.getDailySummary = getDailySummary;
const getLoanMonitoringSummary = async (req, res) => {
    try {
        const month = typeof req.query.month === "string" ? Number(req.query.month) : undefined;
        const year = typeof req.query.year === "string" ? Number(req.query.year) : undefined;
        const { start, end } = getMonthRange(month, year);
        const teamMemberId = typeof req.query.teamMemberId === "string" ? req.query.teamMemberId : undefined;
        const baseWhere = {
            createdDate: {
                gte: start,
                lte: end,
            },
            ...(teamMemberId ? { teamMemberId } : {}),
        };
        const disbursedWhere = {
            status: "DISBURSED",
            disbursedDate: {
                gte: start,
                lte: end,
            },
            ...(teamMemberId ? { teamMemberId } : {}),
        };
        const [totalLoans, totalPendingLoans, totalDisbursedLoans, totalRejectedLoans, totalLoanAmountAggregate, totalDisbursedAmountAggregate, totalPendingAmountAggregate,] = await Promise.all([
            prisma_1.default.loanEntry.count({
                where: baseWhere,
            }),
            prisma_1.default.loanEntry.count({
                where: {
                    ...baseWhere,
                    status: "PENDING",
                },
            }),
            prisma_1.default.loanEntry.count({
                where: disbursedWhere,
            }),
            prisma_1.default.loanEntry.count({
                where: {
                    ...baseWhere,
                    status: "REJECTED",
                },
            }),
            prisma_1.default.loanEntry.aggregate({
                where: baseWhere,
                _sum: {
                    amountDisbursed: true,
                },
            }),
            prisma_1.default.loanEntry.aggregate({
                where: {
                    ...baseWhere,
                    status: "DISBURSED",
                },
                _sum: {
                    amountDisbursed: true,
                },
            }),
            prisma_1.default.loanEntry.aggregate({
                where: {
                    ...baseWhere,
                    status: "PENDING",
                },
                _sum: {
                    loanAmount: true,
                },
            }),
        ]);
        const disbursementRate = totalLoans > 0 ? (totalDisbursedLoans / totalLoans) * 100 : 0;
        return res.status(200).json({
            summary: {
                totalLoans,
                totalPendingLoans,
                totalDisbursedLoans,
                totalRejectedLoans,
                totalLoanAmount: totalLoanAmountAggregate._sum.amountDisbursed ?? 0,
                totalAmountDisbursed: totalDisbursedAmountAggregate._sum.amountDisbursed ?? 0,
                totalAmountPending: totalPendingAmountAggregate._sum.loanAmount ?? 0,
                disbursementRate,
            },
        });
    }
    catch (error) {
        console.error("Get loan monitoring summary error:", error);
        return res.status(500).json({
            message: "Server error while fetching loan monitoring summary.",
        });
    }
};
exports.getLoanMonitoringSummary = getLoanMonitoringSummary;
