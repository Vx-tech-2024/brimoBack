import { Request, Response } from "express";
import prisma from "../config/prisma";
import { isNonEmptyString } from "../utils/validators";
import { generateLoanReference } from "../utils/generateLoanReference";
import { LoanStatus } from "@prisma/client";
import { getParam } from "../utils/getParam";

const validStatuses = ["PENDING", "DISBURSED", "REJECTED"];

export const createLoanEntry = async (req: Request, res: Response) => {
  try {
    const {
      teamMemberId,
      loanType,
      loanAmount,
      amountDisbursed,
      status,
      createdDate,
      disbursedDate,
      notes,
    } = req.body;

    if (!isNonEmptyString(teamMemberId)) {
      return res.status(400).json({ message: "Team member is required." });
    }

    if (!isNonEmptyString(loanType)) {
      return res.status(400).json({ message: "Loan type is required." });
    }

    if (typeof loanAmount !== "number" || loanAmount <= 0) {
      return res.status(400).json({ message: "Loan amount must be greater than 0." });
    }

    if (!isNonEmptyString(createdDate)) {
      return res.status(400).json({ message: "Created date is required." });
    }

    const teamMember = await prisma.teamMember.findUnique({
      where: { id: teamMemberId },
    });

    if (!teamMember) {
      return res.status(404).json({ message: "Assigned team member not found." });
    }

    const normalizedStatus =
      typeof status === "string" && validStatuses.includes(status as (typeof validStatuses)[number])
        ? status
        : "PENDING";

    if (
      normalizedStatus === "DISBURSED" &&
      (typeof amountDisbursed !== "number" || amountDisbursed <= 0)
    ) {
      return res.status(400).json({
        message: "Amount disbursed must be greater than 0 when status is DISBURSED.",
      });
    }

    if (normalizedStatus === "REJECTED" && amountDisbursed && amountDisbursed > 0) {
      return res.status(400).json({
        message: "Rejected loans cannot have amount disbursed greater than 0.",
      });
    }

    const loan = await prisma.loanEntry.create({
      data: {
        loanReference: generateLoanReference(),
        teamMemberId,
        loanType: loanType.trim(),
        loanAmount,
        amountDisbursed:
          normalizedStatus === "DISBURSED"
            ? amountDisbursed
            : normalizedStatus === "REJECTED"
            ? 0
            : amountDisbursed ?? null,
        status: normalizedStatus as LoanStatus,
        createdDate: new Date(createdDate),
        disbursedDate:
          normalizedStatus === "DISBURSED" && disbursedDate
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
  } catch (error) {
    console.error("Create loan entry error:", error);
    return res.status(500).json({ message: "Server error while creating loan entry." });
  }
};

export const getAllLoanEntries = async (req: Request, res: Response) => {
  try {
    const { status, teamMemberId, loanType } = req.query;

    const loans = await prisma.loanEntry.findMany({
      where: {
        ...(typeof status === "string" && validStatuses.includes(status) ? { status: status as "PENDING" | "DISBURSED" | "REJECTED" } : {}),
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
  } catch (error) {
    console.error("Get all loans error:", error);
    return res.status(500).json({ message: "Server error while fetching loan entries." });
  }
};

export const getLoanEntryById = async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);

    const loan = await prisma.loanEntry.findUnique({
      where: { id },
      include: {
        teamMember: true,
      },
    });

    if (!loan) {
      return res.status(404).json({ message: "Loan entry not found." });
    }

    return res.status(200).json({ loan });
  } catch (error) {
    console.error("Get loan by id error:", error);
    return res.status(500).json({ message: "Server error while fetching loan entry." });
  }
};

export const updateLoanEntry = async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    const {
      teamMemberId,
      loanType,
      loanAmount,
      amountDisbursed,
      status,
      createdDate,
      disbursedDate,
      notes,
    } = req.body;

    const existingLoan = await prisma.loanEntry.findUnique({
      where: { id },
    });

    if (!existingLoan) {
      return res.status(404).json({ message: "Loan entry not found." });
    }

    if (!isNonEmptyString(teamMemberId)) {
      return res.status(400).json({ message: "Team member is required." });
    }

    if (!isNonEmptyString(loanType)) {
      return res.status(400).json({ message: "Loan type is required." });
    }

    if (typeof loanAmount !== "number" || loanAmount <= 0) {
      return res.status(400).json({ message: "Loan amount must be greater than 0." });
    }

    if (!isNonEmptyString(createdDate)) {
      return res.status(400).json({ message: "Created date is required." });
    }

    const teamMember = await prisma.teamMember.findUnique({
      where: { id: teamMemberId },
    });

    if (!teamMember) {
      return res.status(404).json({ message: "Assigned team member not found." });
    }

    const normalizedStatus =
      typeof status === "string" && validStatuses.includes(status as (typeof validStatuses)[number])
        ? status
        : "PENDING";

    if (
      normalizedStatus === "DISBURSED" &&
      (typeof amountDisbursed !== "number" || amountDisbursed <= 0)
    ) {
      return res.status(400).json({
        message: "Amount disbursed must be greater than 0 when status is DISBURSED.",
      });
    }

    if (normalizedStatus === "REJECTED" && amountDisbursed && amountDisbursed > 0) {
      return res.status(400).json({
        message: "Rejected loans cannot have amount disbursed greater than 0.",
      });
    }

    const updatedLoan = await prisma.loanEntry.update({
      where: { id },
      data: {
        teamMemberId,
        loanType: loanType.trim(),
        loanAmount,
        amountDisbursed:
          normalizedStatus === "DISBURSED"
            ? amountDisbursed
            : normalizedStatus === "REJECTED"
            ? 0
            : amountDisbursed ?? null,
        status: normalizedStatus as LoanStatus,
        createdDate: new Date(createdDate),
        disbursedDate:
          normalizedStatus === "DISBURSED"
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
  } catch (error) {
    console.error("Update loan entry error:", error);
    return res.status(500).json({ message: "Server error while updating loan entry." });
  }
};

export const deleteLoanEntry = async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);

    const existingLoan = await prisma.loanEntry.findUnique({
      where: { id },
    });

    if (!existingLoan) {
      return res.status(404).json({ message: "Loan entry not found." });
    }

    await prisma.loanEntry.delete({
      where: { id },
    });

    return res.status(200).json({ message: "Loan entry deleted successfully." });
  } catch (error) {
    console.error("Delete loan entry error:", error);
    return res.status(500).json({ message: "Server error while deleting loan entry." });
  }
};