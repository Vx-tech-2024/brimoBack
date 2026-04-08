"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTeamPerformanceSummary = exports.getTargetAchievedRate = exports.getMonthlyGoalTracker = exports.getAgentPerformanceTracker = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const getMonthRange = (month, year) => {
    const now = new Date();
    const selectedMonth = month ?? now.getMonth() + 1;
    const selectedYear = year ?? now.getFullYear();
    const start = new Date(selectedYear, selectedMonth - 1, 1, 0, 0, 0, 0);
    const end = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999);
    return { start, end, selectedMonth, selectedYear };
};
const getDaysInMonth = (year, month) => {
    return new Date(year, month, 0).getDate();
};
const getDaysElapsedInMonth = (year, month) => {
    const now = new Date();
    const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;
    if (!isCurrentMonth) {
        return getDaysInMonth(year, month);
    }
    return now.getDate();
};
const getAgentPerformanceTracker = async (req, res) => {
    try {
        const month = typeof req.query.month === "string" ? Number(req.query.month) : undefined;
        const year = typeof req.query.year === "string" ? Number(req.query.year) : undefined;
        const teamMemberId = typeof req.query.teamMemberId === "string" ? req.query.teamMemberId : undefined;
        const { start, end, selectedMonth, selectedYear } = getMonthRange(month, year);
        const members = await prisma_1.default.teamMember.findMany({
            where: {
                ...(teamMemberId ? { id: teamMemberId } : {}),
            },
            orderBy: {
                fullName: "asc",
            },
        });
        const results = await Promise.all(members.map(async (member) => {
            const [target, disbursedAgg, pendingAgg, disbursedCount] = await Promise.all([
                prisma_1.default.agentMonthlyTarget.findUnique({
                    where: {
                        teamMemberId_month_year: {
                            teamMemberId: member.id,
                            month: selectedMonth,
                            year: selectedYear,
                        },
                    },
                }),
                prisma_1.default.loanEntry.aggregate({
                    where: {
                        teamMemberId: member.id,
                        status: "DISBURSED",
                        disbursedDate: {
                            gte: start,
                            lte: end,
                        },
                    },
                    _sum: {
                        amountDisbursed: true,
                    },
                }),
                prisma_1.default.loanEntry.aggregate({
                    where: {
                        teamMemberId: member.id,
                        status: "PENDING",
                        createdDate: {
                            gte: start,
                            lte: end,
                        },
                    },
                    _sum: {
                        loanAmount: true,
                    },
                }),
                prisma_1.default.loanEntry.count({
                    where: {
                        teamMemberId: member.id,
                        status: "DISBURSED",
                        disbursedDate: {
                            gte: start,
                            lte: end,
                        },
                    },
                }),
            ]);
            const salesTarget = target?.targetAmount ?? 0;
            const targetOfLoans = target?.targetLoanCount ?? 0;
            const paidSales = disbursedAgg._sum.amountDisbursed ?? 0;
            const pendings = pendingAgg._sum.loanAmount ?? 0;
            const salesPercentage = salesTarget > 0 ? (paidSales / salesTarget) * 100 : 0;
            const deficient = Math.max(salesTarget - paidSales, 0);
            const daysElapsed = getDaysElapsedInMonth(selectedYear, selectedMonth);
            const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
            const projectedTarget = daysElapsed > 0 ? (paidSales / daysElapsed) * daysInMonth : 0;
            return {
                teamMemberId: member.id,
                name: member.fullName,
                salesTarget,
                projectedTarget,
                paidSales,
                salesPercentage,
                pendings,
                deficient,
                targetOfLoans,
                loanDisbursementCount: disbursedCount,
            };
        }));
        return res.status(200).json({
            month: selectedMonth,
            year: selectedYear,
            tracker: results,
        });
    }
    catch (error) {
        console.error("Get agent performance tracker error:", error);
        return res.status(500).json({
            message: "Server error while fetching agent performance tracker.",
        });
    }
};
exports.getAgentPerformanceTracker = getAgentPerformanceTracker;
const getMonthlyGoalTracker = async (req, res) => {
    try {
        const month = typeof req.query.month === "string" ? Number(req.query.month) : undefined;
        const year = typeof req.query.year === "string" ? Number(req.query.year) : undefined;
        const teamMemberId = typeof req.query.teamMemberId === "string" ? req.query.teamMemberId : undefined;
        const { start, end, selectedMonth, selectedYear } = getMonthRange(month, year);
        const loans = await prisma_1.default.loanEntry.findMany({
            where: {
                createdDate: {
                    gte: start,
                    lte: end,
                },
                ...(teamMemberId ? { teamMemberId } : {}),
            },
            include: {
                teamMember: true,
            },
            orderBy: [
                { createdDate: "desc" },
                { createdAt: "desc" },
            ],
        });
        const totalPaid = loans
            .filter((loan) => loan.status === "DISBURSED")
            .reduce((sum, loan) => sum + (loan.amountDisbursed ?? 0), 0);
        const tracker = loans.map((loan) => ({
            loanId: loan.id,
            loanReference: loan.loanReference,
            agentName: loan.teamMember.fullName,
            loanType: loan.loanType,
            loanAmount: loan.loanAmount,
            status: loan.status,
            amountDisbursed: loan.amountDisbursed ?? 0,
            createdDate: loan.createdDate,
            disbursedDate: loan.disbursedDate,
        }));
        return res.status(200).json({
            month: selectedMonth,
            year: selectedYear,
            totalPaid,
            totalLoans: tracker.length,
            tracker,
        });
    }
    catch (error) {
        console.error("Get monthly goal tracker error:", error);
        return res.status(500).json({
            message: "Server error while fetching monthly goal tracker.",
        });
    }
};
exports.getMonthlyGoalTracker = getMonthlyGoalTracker;
const getTargetAchievedRate = async (req, res) => {
    try {
        const month = typeof req.query.month === "string" ? Number(req.query.month) : undefined;
        const year = typeof req.query.year === "string" ? Number(req.query.year) : undefined;
        const teamMemberId = typeof req.query.teamMemberId === "string" ? req.query.teamMemberId : undefined;
        const { start, end, selectedMonth, selectedYear } = getMonthRange(month, year);
        const members = await prisma_1.default.teamMember.findMany({
            where: {
                ...(teamMemberId ? { id: teamMemberId } : {}),
            },
            orderBy: {
                fullName: "asc",
            },
        });
        const results = await Promise.all(members.map(async (member) => {
            const [target, disbursedAgg] = await Promise.all([
                prisma_1.default.agentMonthlyTarget.findUnique({
                    where: {
                        teamMemberId_month_year: {
                            teamMemberId: member.id,
                            month: selectedMonth,
                            year: selectedYear,
                        },
                    },
                }),
                prisma_1.default.loanEntry.aggregate({
                    where: {
                        teamMemberId: member.id,
                        status: "DISBURSED",
                        disbursedDate: {
                            gte: start,
                            lte: end,
                        },
                    },
                    _sum: {
                        amountDisbursed: true,
                    },
                }),
            ]);
            const monthlyTarget = target?.targetAmount ?? 0;
            const disbursed = disbursedAgg._sum.amountDisbursed ?? 0;
            const achievedRate = monthlyTarget > 0 ? (disbursed / monthlyTarget) * 100 : 0;
            return {
                teamMemberId: member.id,
                name: member.fullName,
                monthlyTarget,
                disbursed,
                achievedRate,
            };
        }));
        return res.status(200).json({
            month: selectedMonth,
            year: selectedYear,
            tracker: results,
        });
    }
    catch (error) {
        console.error("Get target achieved rate error:", error);
        return res.status(500).json({
            message: "Server error while fetching target achieved rate.",
        });
    }
};
exports.getTargetAchievedRate = getTargetAchievedRate;
const getTeamPerformanceSummary = async (req, res) => {
    try {
        const month = typeof req.query.month === "string" ? Number(req.query.month) : undefined;
        const year = typeof req.query.year === "string" ? Number(req.query.year) : undefined;
        const { start, end, selectedMonth, selectedYear } = getMonthRange(month, year);
        const [teamTarget, disbursedAgg, pendingAgg, rejectedCount, disbursedCount] = await Promise.all([
            prisma_1.default.teamMonthlyTarget.findUnique({
                where: {
                    month_year: {
                        month: selectedMonth,
                        year: selectedYear,
                    },
                },
            }),
            prisma_1.default.loanEntry.aggregate({
                where: {
                    status: "DISBURSED",
                    disbursedDate: {
                        gte: start,
                        lte: end,
                    },
                },
                _sum: {
                    amountDisbursed: true,
                },
            }),
            prisma_1.default.loanEntry.aggregate({
                where: {
                    status: "PENDING",
                    createdDate: {
                        gte: start,
                        lte: end,
                    },
                },
                _sum: {
                    loanAmount: true,
                },
            }),
            prisma_1.default.loanEntry.count({
                where: {
                    status: "REJECTED",
                    createdDate: {
                        gte: start,
                        lte: end,
                    },
                },
            }),
            prisma_1.default.loanEntry.count({
                where: {
                    status: "DISBURSED",
                    disbursedDate: {
                        gte: start,
                        lte: end,
                    },
                },
            }),
        ]);
        const totalTeamTarget = teamTarget?.targetAmount ?? 0;
        const totalDisbursed = disbursedAgg._sum.amountDisbursed ?? 0;
        const totalPendingAmount = pendingAgg._sum.loanAmount ?? 0;
        const teamAchievedRate = totalTeamTarget > 0 ? (totalDisbursed / totalTeamTarget) * 100 : 0;
        return res.status(200).json({
            month: selectedMonth,
            year: selectedYear,
            summary: {
                totalTeamTarget,
                totalDisbursed,
                teamAchievedRate,
                totalPendingAmount,
                totalRejectedCount: rejectedCount,
                totalDisbursementCount: disbursedCount,
                targetLoanCount: teamTarget?.targetLoanCount ?? 0,
            },
        });
    }
    catch (error) {
        console.error("Get team performance summary error:", error);
        return res.status(500).json({
            message: "Server error while fetching team performance summary.",
        });
    }
};
exports.getTeamPerformanceSummary = getTeamPerformanceSummary;
