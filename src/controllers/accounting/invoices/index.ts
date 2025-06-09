import {Request, Response} from "express";
import { prisma } from "../../../helpers/prisma";

export const getAllInvoices = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const take = limit === 0 ? undefined : limit; // Return all if limit is 0
    const status = req.query.status as string | undefined;
    const skip = (page - 1) * limit;

    const whereClause = status ? {status} : {};

    const [invoices, totalCount] = await Promise.all([
      prisma.invoice.findMany({
        skip,
        take, // Use 'take' instead of 'limit'
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
        totalPages: limit === 0 ? 1 : Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch invoices",
    });
  }
};

export const createInvoice = async (req: Request, res: Response) => {
  try {
    const {studentId, items, dueDate} = req.body;

    // Validate input
    if (!studentId || !items || !dueDate) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    // Calculate total
    const total = items.reduce(
      (sum: number, item: any) => sum + item.amount,
      0
    );

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        studentId,
        items,
        total,
        dueDate: new Date(dueDate),
        status: "Pending",
      },
    });

    res.status(201).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error("Failed to create invoice:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create invoice",
    });
  }
};