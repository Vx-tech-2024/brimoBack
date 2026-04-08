import { Request, Response } from "express";
import prisma from "../config/prisma";

const isValidMonth = (month: unknown) =>
  Number.isInteger(month) && Number(month) >= 1 && Number(month) <= 12;

const isValidYear = (year: unknown) =>
  Number.isInteger(year) && Number(year) >= 2000 && Number(year) <= 3000;

const isValidPositiveNumber = (value: unknown) =>
  typeof value === "number" && value > 0;

const isValidNonNegativeInteger = (value: unknown) =>
  Number.isInteger(value) && Number(value) >= 0;

/*AGENT TARGETS*/
export const createAgentMonthlyTarget = async (req: Request, res: Response) => {
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

    const member = await prisma.teamMember.findUnique({
      where: { id: teamMemberId },
    });

    if (!member) {
      return res.status(404).json({ message: "Team member not found." });
    }

    const existingTarget = await prisma.agentMonthlyTarget.findUnique({
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

    const target = await prisma.agentMonthlyTarget.create({
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
  } catch (error) {
    console.error("Create agent monthly target error:", error);
    return res.status(500).json({
      message: "Server error while creating agent monthly target.",
    });
  }
};

export const getAllAgentMonthlyTargets = async (req: Request, res: Response) => {
  try {
    const { month, year, teamMemberId } = req.query;

    const targets = await prisma.agentMonthlyTarget.findMany({
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
  } catch (error) {
    console.error("Get all agent monthly targets error:", error);
    return res.status(500).json({
      message: "Server error while fetching agent monthly targets.",
    });
  }
};

export const getAgentMonthlyTargetById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const target = await prisma.agentMonthlyTarget.findUnique({
      where: { id },
      include: {
        teamMember: true,
      },
    });

    if (!target) {
      return res.status(404).json({ message: "Agent monthly target not found." });
    }

    return res.status(200).json({ target });
  } catch (error) {
    console.error("Get agent monthly target by ID error:", error);
    return res.status(500).json({
      message: "Server error while fetching agent monthly target.",
    });
  }
};

export const updateAgentMonthlyTarget = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { teamMemberId, month, year, targetAmount, targetLoanCount } = req.body;

    const existingTarget = await prisma.agentMonthlyTarget.findUnique({
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

    const member = await prisma.teamMember.findUnique({
      where: { id: teamMemberId },
    });

    if (!member) {
      return res.status(404).json({ message: "Team member not found." });
    }

    const duplicateTarget = await prisma.agentMonthlyTarget.findFirst({
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

    const target = await prisma.agentMonthlyTarget.update({
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
  } catch (error) {
    console.error("Update agent monthly target error:", error);
    return res.status(500).json({
      message: "Server error while updating agent monthly target.",
    });
  }
};

export const deleteAgentMonthlyTarget = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existingTarget = await prisma.agentMonthlyTarget.findUnique({
      where: { id },
    });

    if (!existingTarget) {
      return res.status(404).json({ message: "Agent monthly target not found." });
    }

    await prisma.agentMonthlyTarget.delete({
      where: { id },
    });

    return res.status(200).json({
      message: "Agent monthly target deleted successfully.",
    });
  } catch (error) {
    console.error("Delete agent monthly target error:", error);
    return res.status(500).json({
      message: "Server error while deleting agent monthly target.",
    });
  }
};

/*TEAM TARGETS*/

export const createTeamMonthlyTarget = async (req: Request, res: Response) => {
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

    const existingTarget = await prisma.teamMonthlyTarget.findUnique({
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

    const target = await prisma.teamMonthlyTarget.create({
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
  } catch (error) {
    console.error("Create team monthly target error:", error);
    return res.status(500).json({
      message: "Server error while creating team monthly target.",
    });
  }
};

export const getAllTeamMonthlyTargets = async (req: Request, res: Response) => {
  try {
    const { month, year } = req.query;

    const targets = await prisma.teamMonthlyTarget.findMany({
      where: {
        ...(typeof month === "string" ? { month: Number(month) } : {}),
        ...(typeof year === "string" ? { year: Number(year) } : {}),
      },
      orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
    });

    return res.status(200).json({ targets });
  } catch (error) {
    console.error("Get all team monthly targets error:", error);
    return res.status(500).json({
      message: "Server error while fetching team monthly targets.",
    });
  }
};

export const getTeamMonthlyTargetById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const target = await prisma.teamMonthlyTarget.findUnique({
      where: { id },
    });

    if (!target) {
      return res.status(404).json({ message: "Team monthly target not found." });
    }

    return res.status(200).json({ target });
  } catch (error) {
    console.error("Get team monthly target by ID error:", error);
    return res.status(500).json({
      message: "Server error while fetching team monthly target.",
    });
  }
};

export const updateTeamMonthlyTarget = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { month, year, targetAmount, targetLoanCount } = req.body;

    const existingTarget = await prisma.teamMonthlyTarget.findUnique({
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

    const duplicateTarget = await prisma.teamMonthlyTarget.findFirst({
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

    const target = await prisma.teamMonthlyTarget.update({
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
  } catch (error) {
    console.error("Update team monthly target error:", error);
    return res.status(500).json({
      message: "Server error while updating team monthly target.",
    });
  }
};

export const deleteTeamMonthlyTarget = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existingTarget = await prisma.teamMonthlyTarget.findUnique({
      where: { id },
    });

    if (!existingTarget) {
      return res.status(404).json({ message: "Team monthly target not found." });
    }

    await prisma.teamMonthlyTarget.delete({
      where: { id },
    });

    return res.status(200).json({
      message: "Team monthly target deleted successfully.",
    });
  } catch (error) {
    console.error("Delete team monthly target error:", error);
    return res.status(500).json({
      message: "Server error while deleting team monthly target.",
    });
  }
};