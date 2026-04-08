import { Request, Response } from "express";
import prisma from "../config/prisma";

const getStartOfDay = (date?: string) => {
  const base = date ? new Date(date) : new Date();
  const start = new Date(base);
  start.setHours(0, 0, 0, 0);
  return start;
};

const getEndOfDay = (date?: string) => {
  const base = date ? new Date(date) : new Date();
  const end = new Date(base);
  end.setHours(23, 59, 59, 999);
  return end;
};

const getWeekRange = (date?: string) => {
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

const getMonthRange = (month?: number, year?: number) => {
  const now = new Date();
  const selectedMonth = month ?? now.getMonth() + 1;
  const selectedYear = year ?? now.getFullYear();

  const start = new Date(selectedYear, selectedMonth - 1, 1, 0, 0, 0, 0);
  const end = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999);

  return { start, end, selectedMonth, selectedYear };
};

const buildRankingForRange = async (start: Date, end: Date) => {
  const members = await prisma.teamMember.findMany({
    orderBy: {
      fullName: "asc",
    },
  });

  const ranking = await Promise.all(
    members.map(async (member) => {
      const [disbursedAgg, disbursedCount, createdTodayCount] = await Promise.all([
        prisma.loanEntry.aggregate({
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
        prisma.loanEntry.count({
          where: {
            teamMemberId: member.id,
            status: "DISBURSED",
            disbursedDate: {
              gte: start,
              lte: end,
            },
          },
        }),
        prisma.loanEntry.count({
          where: {
            teamMemberId: member.id,
            createdDate: {
              gte: start,
              lte: end,
            },
          },
        }),
      ]);

      return {
        teamMemberId: member.id,
        name: member.fullName,
        totalDisbursed: disbursedAgg._sum.amountDisbursed ?? 0,
        disbursedLoanCount: disbursedCount,
        createdLoanCount: createdTodayCount,
      };
    })
  );

  return ranking.sort((a, b) => {
    if (b.totalDisbursed !== a.totalDisbursed) {
      return b.totalDisbursed - a.totalDisbursed;
    }

    if (b.disbursedLoanCount !== a.disbursedLoanCount) {
      return b.disbursedLoanCount - a.disbursedLoanCount;
    }

    return a.name.localeCompare(b.name);
  });
};

export const getLeaderboardOverview = async (req: Request, res: Response) => {
  try {
    const date =
      typeof req.query.date === "string" ? req.query.date : undefined;
    const month =
      typeof req.query.month === "string" ? Number(req.query.month) : undefined;
    const year =
      typeof req.query.year === "string" ? Number(req.query.year) : undefined;

    const dayStart = getStartOfDay(date);
    const dayEnd = getEndOfDay(date);
    const weekRange = getWeekRange(date);
    const monthRange = getMonthRange(month, year);

    const [dailyRanking, weeklyRanking, monthlyRanking] = await Promise.all([
      buildRankingForRange(dayStart, dayEnd),
      buildRankingForRange(weekRange.start, weekRange.end),
      buildRankingForRange(monthRange.start, monthRange.end),
    ]);

    return res.status(200).json({
      overview: {
        dailyTopPerformer: dailyRanking[0] ?? null,
        weeklyChampion: weeklyRanking[0] ?? null,
        monthlySalesLead: monthlyRanking[0] ?? null,
      },
    });
  } catch (error) {
    console.error("Get leaderboard overview error:", error);
    return res.status(500).json({
      message: "Server error while fetching leaderboard overview.",
    });
  }
};

export const getDailyLeaderboard = async (req: Request, res: Response) => {
  try {
    const date =
      typeof req.query.date === "string" ? req.query.date : undefined;

    const start = getStartOfDay(date);
    const end = getEndOfDay(date);

    const ranking = await buildRankingForRange(start, end);

    return res.status(200).json({
      period: "daily",
      date: date ?? start.toISOString(),
      leaderboard: ranking,
    });
  } catch (error) {
    console.error("Get daily leaderboard error:", error);
    return res.status(500).json({
      message: "Server error while fetching daily leaderboard.",
    });
  }
};

export const getWeeklyLeaderboard = async (req: Request, res: Response) => {
  try {
    const date =
      typeof req.query.date === "string" ? req.query.date : undefined;

    const { start, end } = getWeekRange(date);

    const ranking = await buildRankingForRange(start, end);

    return res.status(200).json({
      period: "weekly",
      startDate: start,
      endDate: end,
      leaderboard: ranking,
    });
  } catch (error) {
    console.error("Get weekly leaderboard error:", error);
    return res.status(500).json({
      message: "Server error while fetching weekly leaderboard.",
    });
  }
};

export const getMonthlyLeaderboard = async (req: Request, res: Response) => {
  try {
    const month =
      typeof req.query.month === "string" ? Number(req.query.month) : undefined;
    const year =
      typeof req.query.year === "string" ? Number(req.query.year) : undefined;

    const { start, end, selectedMonth, selectedYear } = getMonthRange(month, year);

    const ranking = await buildRankingForRange(start, end);

    return res.status(200).json({
      period: "monthly",
      month: selectedMonth,
      year: selectedYear,
      leaderboard: ranking,
    });
  } catch (error) {
    console.error("Get monthly leaderboard error:", error);
    return res.status(500).json({
      message: "Server error while fetching monthly leaderboard.",
    });
  }
};

export const getMostImprovedAgent = async (req: Request, res: Response) => {
  try {
    const month =
      typeof req.query.month === "string" ? Number(req.query.month) : undefined;
    const year =
      typeof req.query.year === "string" ? Number(req.query.year) : undefined;

    const now = new Date();
    const selectedMonth = month ?? now.getMonth() + 1;
    const selectedYear = year ?? now.getFullYear();

    const currentStart = new Date(selectedYear, selectedMonth - 1, 1, 0, 0, 0, 0);
    const currentEnd = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999);

    const previousMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
    const previousYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;

    const previousStart = new Date(previousYear, previousMonth - 1, 1, 0, 0, 0, 0);
    const previousEnd = new Date(previousYear, previousMonth, 0, 23, 59, 59, 999);

    const members = await prisma.teamMember.findMany({
      orderBy: {
        fullName: "asc",
      },
    });

    const comparison = await Promise.all(
      members.map(async (member) => {
        const [currentAgg, previousAgg] = await Promise.all([
          prisma.loanEntry.aggregate({
            where: {
              teamMemberId: member.id,
              status: "DISBURSED",
              disbursedDate: {
                gte: currentStart,
                lte: currentEnd,
              },
            },
            _sum: {
              amountDisbursed: true,
            },
          }),
          prisma.loanEntry.aggregate({
            where: {
              teamMemberId: member.id,
              status: "DISBURSED",
              disbursedDate: {
                gte: previousStart,
                lte: previousEnd,
              },
            },
            _sum: {
              amountDisbursed: true,
            },
          }),
        ]);

        const currentMonthDisbursed = currentAgg._sum.amountDisbursed ?? 0;
        const previousMonthDisbursed = previousAgg._sum.amountDisbursed ?? 0;
        const improvementAmount = currentMonthDisbursed - previousMonthDisbursed;

        return {
          teamMemberId: member.id,
          name: member.fullName,
          previousMonthDisbursed,
          currentMonthDisbursed,
          improvementAmount,
        };
      })
    );

    const sorted = comparison.sort((a, b) => {
      if (b.improvementAmount !== a.improvementAmount) {
        return b.improvementAmount - a.improvementAmount;
      }

      return a.name.localeCompare(b.name);
    });

    return res.status(200).json({
      month: selectedMonth,
      year: selectedYear,
      previousMonth,
      previousYear,
      mostImproved: sorted[0] ?? null,
      leaderboard: sorted,
    });
  } catch (error) {
    console.error("Get most improved agent error:", error);
    return res.status(500).json({
      message: "Server error while fetching most improved agent leaderboard.",
    });
  }
};