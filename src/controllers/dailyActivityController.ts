import { Request, Response } from "express";
import prisma from "../config/prisma";
import { getParam } from "../utils/getParam";

const VALID_ACTIVITY_TYPES = [
    "DATA_FOLLOW_UP",
    "FIELD_WORK",
    "INSTITUTIONAL_VISIT",
    "OTHERS",
];

const isValidDate = (value: unknown): value is string => {
    if (typeof value !== "string" || !value.trim()) {
        return false;
    }

    return !Number.isNaN(new Date(value).getTime());
};

export const createDailyActivity = async (req: Request, res: Response) => {
    try {
        const {
            teamMemberId,
            activityType,
            prospectsGiven,
            actualProspectsCalled,
            loanCreated,
            loanId,
            supervisorComment,
            date,
        } = req.body;

        if (typeof teamMemberId !== "string" || !teamMemberId.trim()) {
            return res.status(400).json({
                message: "Team member is required",
            });
        }

        const teamMember = await prisma.teamMember.findUnique({
            where: { id: teamMemberId.trim() },
        });

        if (!teamMember) {
            return res.status(404).json({
                message: "Team member not found",
            });
        }

        if (
            typeof activityType !== "string" ||
            !VALID_ACTIVITY_TYPES.includes(activityType)
        ) {
            return res.status(400).json({
                message: "Invalid activity type",
            });
        }

        if (
            typeof prospectsGiven !== "number" ||
            !Number.isInteger(prospectsGiven) ||
            prospectsGiven < 0
        ) {
            return res.status(400).json({
                message: "Prospects given must be a non-negative integer",
            });
        }

        if (
            typeof actualProspectsCalled !== "number" ||
            !Number.isInteger(actualProspectsCalled) ||
            actualProspectsCalled < 0
        ) {
            return res.status(400).json({
                message: "Actual prospects called must be a non-negative integer",
            });
        }

        if (actualProspectsCalled > prospectsGiven) {
            return res.status(400).json({
                message:
                    "Actual prospects called cannot be greater than prospects given",
            });
        }

        if (!isValidDate(date)) {
            return res.status(400).json({
                message: "A valid date is required",
            });
        }

        const variance = prospectsGiven - actualProspectsCalled;

        const isLoanCreated = loanCreated === true;

        if (isLoanCreated && typeof loanId !== "string") {
            return res.status(400).json({
                message: "Loan ID is required when a loan is created",
            });
        }

        const activity = await prisma.dailyActivity.create({
            data: {
                teamMemberId: teamMemberId.trim(),
                activityType: activityType as
                    | "DATA_FOLLOW_UP"
                    | "FIELD_WORK"
                    | "INSTITUTIONAL_VISIT"
                    | "OTHERS",
                prospectsGiven,
                actualProspectsCalled,
                variance,
                loanCreated: isLoanCreated,
                loanId: isLoanCreated ? loanId.trim() : null,
                supervisorComment:
                    typeof supervisorComment === "string"
                        ? supervisorComment.trim() || null
                        : null,
                date: new Date(date),
            },
            include: {
                teamMember: {
                    select: {
                        id: true,
                        fullName: true,
                        employmentNumber: true,
                    },
                },
            },
        });

        return res.status(201).json({
            message: "Daily activity created successfully",
            activity,
        });
    } catch (error) {
        console.error("Create daily activity error:", error);

        return res.status(500).json({
            message: "Server error while creating daily activity",
        });
    }
};

export const getDailyActivities = async (
    req: Request,
    res: Response
) => {
    try {
        const { teamMemberId, activityType, date } = req.query;

        const where: any = {};

        if (typeof teamMemberId === "string" && teamMemberId.trim()) {
            where.teamMemberId = teamMemberId.trim();
        }

        if (
            typeof activityType === "string" &&
            VALID_ACTIVITY_TYPES.includes(activityType)
        ) {
            where.activityType = activityType;
        }

        if (typeof date === "string" && isValidDate(date)) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 1);

            where.date = {
                gte: startDate,
                lt: endDate,
            };
        }

        const activities = await prisma.dailyActivity.findMany({
            where,
            orderBy: {
                date: "desc",
            },
            include: {
                teamMember: {
                    select: {
                        id: true,
                        fullName: true,
                        employmentNumber: true,
                    },
                },
            },
        });

        return res.status(200).json({
            activities,
        });
    } catch (error) {
        console.error("Get daily activities error:", error);

        return res.status(500).json({
            message: "Server error while fetching daily activities",
        });
    }
};

export const getDailyActivityById = async (
    req: Request,
    res: Response
) => {
    try {
        const id = getParam(req.params.id);

        const activity = await prisma.dailyActivity.findUnique({
            where: { id },
            include: {
                teamMember: {
                    select: {
                        id: true,
                        fullName: true,
                        employmentNumber: true,
                    },
                },
            },
        });

        if (!activity) {
            return res.status(404).json({
                message: "Daily activity not found",
            });
        }

        return res.status(200).json({
            activity,
        });
    } catch (error) {
        console.error("Get daily activity error:", error);

        return res.status(500).json({
            message: "Server error while fetching daily activity",
        });
    }
};

export const updateDailyActivity = async (
    req: Request,
    res: Response
) => {
    try {
        const id = getParam(req.params.id);

        const existingActivity = await prisma.dailyActivity.findUnique({
            where: { id },
        });

        if (!existingActivity) {
            return res.status(404).json({
                message: "Daily activity not found",
            });
        }

        const {
            teamMemberId,
            activityType,
            prospectsGiven,
            actualProspectsCalled,
            loanCreated,
            loanId,
            supervisorComment,
            date,
        } = req.body;

        if (typeof teamMemberId !== "string" || !teamMemberId.trim()) {
            return res.status(400).json({
                message: "Team member is required",
            });
        }

        const teamMember = await prisma.teamMember.findUnique({
            where: { id: teamMemberId.trim() },
        });

        if (!teamMember) {
            return res.status(404).json({
                message: "Team member not found",
            });
        }

        if (
            typeof activityType !== "string" ||
            !VALID_ACTIVITY_TYPES.includes(activityType)
        ) {
            return res.status(400).json({
                message: "Invalid activity type",
            });
        }

        if (
            typeof prospectsGiven !== "number" ||
            !Number.isInteger(prospectsGiven) ||
            prospectsGiven < 0
        ) {
            return res.status(400).json({
                message: "Prospects given must be a non-negative integer",
            });
        }

        if (
            typeof actualProspectsCalled !== "number" ||
            !Number.isInteger(actualProspectsCalled) ||
            actualProspectsCalled < 0
        ) {
            return res.status(400).json({
                message: "Actual prospects called must be a non-negative integer",
            });
        }

        if (actualProspectsCalled > prospectsGiven) {
            return res.status(400).json({
                message:
                    "Actual prospects called cannot be greater than prospects given",
            });
        }

        if (!isValidDate(date)) {
            return res.status(400).json({
                message: "A valid date is required",
            });
        }

        const variance = prospectsGiven - actualProspectsCalled;
        const isLoanCreated = loanCreated === true;

        if (isLoanCreated && typeof loanId !== "string") {
            return res.status(400).json({
                message: "Loan ID is required when a loan is created",
            });
        }

        const activity = await prisma.dailyActivity.update({
            where: { id },
            data: {
                teamMemberId: teamMemberId.trim(),
                activityType: activityType as
                    | "DATA_FOLLOW_UP"
                    | "FIELD_WORK"
                    | "INSTITUTIONAL_VISIT"
                    | "OTHERS",
                prospectsGiven,
                actualProspectsCalled,
                variance,
                loanCreated: isLoanCreated,
                loanId: isLoanCreated ? loanId.trim() : null,
                supervisorComment:
                    typeof supervisorComment === "string"
                        ? supervisorComment.trim() || null
                        : null,
                date: new Date(date),
            },
            include: {
                teamMember: {
                    select: {
                        id: true,
                        fullName: true,
                        employmentNumber: true,
                    },
                },
            },
        });

        return res.status(200).json({
            message: "Daily activity updated successfully",
            activity,
        });
    } catch (error) {
        console.error("Update daily activity error:", error);

        return res.status(500).json({
            message: "Server error while updating daily activity",
        });
    }
};

export const deleteDailyActivity = async (
    req: Request,
    res: Response
) => {
    try {
        const id = getParam(req.params.id);

        const existingActivity = await prisma.dailyActivity.findUnique({
            where: { id },
        });

        if (!existingActivity) {
            return res.status(404).json({
                message: "Daily activity not found",
            });
        }

        await prisma.dailyActivity.delete({
            where: { id },
        });

        return res.status(200).json({
            message: "Daily activity deleted successfully",
        });
    } catch (error) {
        console.error("Delete daily activity error:", error);

        return res.status(500).json({
            message: "Server error while deleting daily activity",
        });
    }
};