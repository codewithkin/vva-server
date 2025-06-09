import {Request, Response} from "express";
import { prisma } from "../../../helpers/prisma";

export const getAllInvoices = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string | undefined;
    const skip = (page - 1) * limit;

    const whereClause = status ? {status} : {};

    const [invoices, totalCount] = await Promise.all([
      prisma.invoice.findMany({
        skip,
        take: limit,
        where: whereClause,
        orderBy: {dueDate: "asc"},
        include: {
          student: {
            select: {
              name: true,
              admissionId: true,
            },
          },
          payments: true,
        },
      }),
      prisma.invoice.count({where: whereClause}),
    ]);

    res.status(200).json({
      success: true,
      data: invoices,
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
      error: "Failed to fetch invoices",
    });
  }
};
