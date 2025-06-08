import {Request, Response} from "express";
import { prisma } from "../../../helpers/prisma";

export const getAllStudents = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [students, totalCount] = await Promise.all([
      prisma.student.findMany({
        skip,
        take: limit,
        include: {
          invoices: true,
          uniforms: true,
        },
      }),
      prisma.student.count(),
    ]);

    res.status(200).json({
      success: true,
      data: students,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch students",
    });
  }
};
