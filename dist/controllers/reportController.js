"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportMonthlyReportCsv = exports.getMonthlyReport = exports.getWeeklyReport = exports.getDailyReport = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const getStartOfDay = (date) => {
    const base = date ? new Date(date) : new Date();
    const start = new Date(base);
    start.setHours(0, 0, 0, 0);
    return start;
};
const getEndOfDay = (date) => {
    const base = date ? new Date(date) : new Date();
    const end = new Date(base);
    end.setHours(23, 59, 59, 999);
    return end;
};
const getWeekRange = (date) => {
    const base = date ? new Date(date) : new Date();
    const day = base.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const start = new Date(base);
    start.setDate(base.getDate() + diffToMonday);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
};
const getMonthRange = (month, year) => {
    const now = new Date();
    const selectedMonth = month ?? now.getMonth() + 1;
    const selectedYear = year ?? now.getFullYear();
    const start = new Date(selectedYear, selectedMonth - 1, 1, 0, 0, 0, 0);
    const end = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999);
    return { start, end, selectedMonth, selectedYear };
};
const escapeCsv = (value) => {
    if (value === null || value === undefined)
        return "";
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
};
const getBaseLoanWhere = (start, end, filters) => {
    return {
        createdDate: {
            gte: start,
            lte: end,
        },
        ...(filters.teamMemberId ? { teamMemberId: filters.teamMemberId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.loanType ? { loanType: filters.loanType } : {}),
    };
};
const getDisbursedWhere = (start, end, filters) => {
    return {
        status: "DISBURSED",
        disbursedDate: {
            gte: start,
            lte: end,
        },
        ...(filters.teamMemberId ? { teamMemberId: filters.teamMemberId } : {}),
        ...(filters.loanType ? { loanType: filters.loanType } : {}),
    };
};
const getDailyReport = async (req, res) => {
    try {
        const date = typeof req.query.date === "string" ? req.query.date : undefined;
        const teamMemberId = typeof req.query.teamMemberId === "string" ? req.query.teamMemberId : undefined;
        const status = typeof req.query.status === "string" ? req.query.status : undefined;
        const loanType = typeof req.query.loanType === "string" ? req.query.loanType : undefined;
        const start = getStartOfDay(date);
        const end = getEndOfDay(date);
        const filters = { teamMemberId, status, loanType };
        const loanWhere = getBaseLoanWhere(start, end, filters);
        const disbursedWhere = getDisbursedWhere(start, end, { teamMemberId, loanType });
        const [loans, createdAgg, disbursedAgg, pendingCount, rejectedCount] = await Promise.all([
            prisma_1.default.loanEntry.findMany({
                where: loanWhere,
                include: {
                    teamMember: true,
                },
                orderBy: [{ createdDate: "desc" }, { createdAt: "desc" }],
            }),
            prisma_1.default.loanEntry.aggregate({
                where: loanWhere,
                _sum: {
                    loanAmount: true,
                },
            }),
            prisma_1.default.loanEntry.aggregate({
                where: disbursedWhere,
                _sum: {
                    amountDisbursed: true,
                },
            }),
            prisma_1.default.loanEntry.count({
                where: {
                    ...loanWhere,
                    status: "PENDING",
                },
            }),
            prisma_1.default.loanEntry.count({
                where: {
                    ...loanWhere,
                    status: "REJECTED",
                },
            }),
        ]);
        return res.status(200).json({
            reportType: "daily",
            date: date ?? start.toISOString(),
            summary: {
                totalLoans: loans.length,
                totalLoanAmount: createdAgg._sum.loanAmount ?? 0,
                totalAmountDisbursed: disbursedAgg._sum.amountDisbursed ?? 0,
                pendingCount,
                rejectedCount,
            },
            loans,
        });
    }
    catch (error) {
        console.error("Get daily report error:", error);
        return res.status(500).json({
            message: "Server error while fetching daily report.",
        });
    }
};
exports.getDailyReport = getDailyReport;
const getWeeklyReport = async (req, res) => {
    try {
        const date = typeof req.query.date === "string" ? req.query.date : undefined;
        const teamMemberId = typeof req.query.teamMemberId === "string" ? req.query.teamMemberId : undefined;
        const status = typeof req.query.status === "string" ? req.query.status : undefined;
        const loanType = typeof req.query.loanType === "string" ? req.query.loanType : undefined;
        const { start, end } = getWeekRange(date);
        const filters = { teamMemberId, status, loanType };
        const loanWhere = getBaseLoanWhere(start, end, filters);
        const disbursedWhere = getDisbursedWhere(start, end, { teamMemberId, loanType });
        const [loans, createdAgg, disbursedAgg, groupedByStatus] = await Promise.all([
            prisma_1.default.loanEntry.findMany({
                where: loanWhere,
                include: {
                    teamMember: true,
                },
                orderBy: [{ createdDate: "desc" }, { createdAt: "desc" }],
            }),
            prisma_1.default.loanEntry.aggregate({
                where: loanWhere,
                _sum: {
                    loanAmount: true,
                },
            }),
            prisma_1.default.loanEntry.aggregate({
                where: disbursedWhere,
                _sum: {
                    amountDisbursed: true,
                },
            }),
            prisma_1.default.loanEntry.groupBy({
                by: ["status"],
                where: loanWhere,
                _count: {
                    status: true,
                },
            }),
        ]);
        return res.status(200).json({
            reportType: "weekly",
            startDate: start,
            endDate: end,
            summary: {
                totalLoans: loans.length,
                totalLoanAmount: createdAgg._sum.loanAmount ?? 0,
                totalAmountDisbursed: disbursedAgg._sum.amountDisbursed ?? 0,
                breakdownByStatus: groupedByStatus.map((item) => ({
                    status: item.status,
                    count: item._count.status,
                })),
            },
            loans,
        });
    }
    catch (error) {
        console.error("Get weekly report error:", error);
        return res.status(500).json({
            message: "Server error while fetching weekly report.",
        });
    }
};
exports.getWeeklyReport = getWeeklyReport;
const getMonthlyReport = async (req, res) => {
    try {
        const month = typeof req.query.month === "string" ? Number(req.query.month) : undefined;
        const year = typeof req.query.year === "string" ? Number(req.query.year) : undefined;
        const teamMemberId = typeof req.query.teamMemberId === "string" ? req.query.teamMemberId : undefined;
        const status = typeof req.query.status === "string" ? req.query.status : undefined;
        const loanType = typeof req.query.loanType === "string" ? req.query.loanType : undefined;
        const { start, end, selectedMonth, selectedYear } = getMonthRange(month, year);
        const filters = { teamMemberId, status, loanType };
        const loanWhere = getBaseLoanWhere(start, end, filters);
        const disbursedWhere = getDisbursedWhere(start, end, { teamMemberId, loanType });
        const [loans, createdAgg, disbursedAgg, groupedByStatus, groupedByLoanType, disbursedCount,] = await Promise.all([
            prisma_1.default.loanEntry.findMany({
                where: loanWhere,
                include: {
                    teamMember: true,
                },
                orderBy: [{ createdDate: "desc" }, { createdAt: "desc" }],
            }),
            prisma_1.default.loanEntry.aggregate({
                where: loanWhere,
                _sum: {
                    loanAmount: true,
                },
            }),
            prisma_1.default.loanEntry.aggregate({
                where: disbursedWhere,
                _sum: {
                    amountDisbursed: true,
                },
            }),
            prisma_1.default.loanEntry.groupBy({
                by: ["status"],
                where: loanWhere,
                _count: {
                    status: true,
                },
            }),
            prisma_1.default.loanEntry.groupBy({
                by: ["loanType"],
                where: loanWhere,
                _count: {
                    loanType: true,
                },
                _sum: {
                    loanAmount: true,
                },
            }),
            prisma_1.default.loanEntry.count({
                where: disbursedWhere,
            }),
        ]);
        return res.status(200).json({
            reportType: "monthly",
            month: selectedMonth,
            year: selectedYear,
            summary: {
                totalLoans: loans.length,
                totalLoanAmount: createdAgg._sum.loanAmount ?? 0,
                totalAmountDisbursed: disbursedAgg._sum.amountDisbursed ?? 0,
                totalDisbursedCount: disbursedCount,
                breakdownByStatus: groupedByStatus.map((item) => ({
                    status: item.status,
                    count: item._count.status,
                })),
                breakdownByLoanType: groupedByLoanType.map((item) => ({
                    loanType: item.loanType,
                    count: item._count.loanType,
                    totalLoanAmount: item._sum.loanAmount ?? 0,
                })),
            },
            loans,
        });
    }
    catch (error) {
        console.error("Get monthly report error:", error);
        return res.status(500).json({
            message: "Server error while fetching monthly report.",
        });
    }
};
exports.getMonthlyReport = getMonthlyReport;
const exportMonthlyReportCsv = async (req, res) => {
    try {
        const month = typeof req.query.month === "string" ? Number(req.query.month) : undefined;
        const year = typeof req.query.year === "string" ? Number(req.query.year) : undefined;
        const teamMemberId = typeof req.query.teamMemberId === "string" ? req.query.teamMemberId : undefined;
        const status = typeof req.query.status === "string" ? req.query.status : undefined;
        const loanType = typeof req.query.loanType === "string" ? req.query.loanType : undefined;
        const { start, end, selectedMonth, selectedYear } = getMonthRange(month, year);
        const loans = await prisma_1.default.loanEntry.findMany({
            where: getBaseLoanWhere(start, end, { teamMemberId, status, loanType }),
            include: {
                teamMember: true,
            },
            orderBy: [{ createdDate: "desc" }, { createdAt: "desc" }],
        });
        const headers = [
            "Loan Reference",
            "Agent Name",
            "Loan Type",
            "Loan Amount",
            "Status",
            "Amount Disbursed",
            "Created Date",
            "Disbursed Date",
            "Notes",
        ];
        const rows = loans.map((loan) => [
            escapeCsv(loan.loanReference),
            escapeCsv(loan.teamMember.fullName),
            escapeCsv(loan.loanType),
            escapeCsv(loan.loanAmount),
            escapeCsv(loan.status),
            escapeCsv(loan.amountDisbursed ?? 0),
            escapeCsv(loan.createdDate.toISOString()),
            escapeCsv(loan.disbursedDate ? loan.disbursedDate.toISOString() : ""),
            escapeCsv(loan.notes ?? ""),
        ]);
        const csvContent = [headers.map(escapeCsv).join(","), ...rows.map((row) => row.join(","))].join("\n");
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="monthly-report-${selectedYear}-${selectedMonth}.csv"`);
        return res.status(200).send(csvContent);
    }
    catch (error) {
        console.error("Export monthly CSV error:", error);
        return res.status(500).json({
            message: "Server error while exporting monthly report CSV.",
        });
    }
};
exports.exportMonthlyReportCsv = exportMonthlyReportCsv;
