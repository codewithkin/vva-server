import {Request, Response} from "express";
import asyncHandler from "express-async-handler";
import {prisma} from "../../helpers/prisma";
import sendSMS from "../../fucntions/sms/sendSMS";

const getAllData = asyncHandler(async (req: Request, res: Response) => {
  try {
    // Send sms basic
    // sendSMS("+263783532164", "Hi Kin");

    // Fetch all data in parallel for performance
    const [students, invoices, uniforms] = await Promise.all([
      prisma.student.findMany({
        take: 200, // Limit to 10 recent students (adjust as needed)
        include: {
          invoices: {take: 20}, // Include last 3 invoices per student
          uniforms: {take: 20}, // Include last 2 uniform issues
        },
      }),
      prisma.invoice.findMany({
        where: {status: "Pending"}, // Focus on pending invoices
        take: 100,
        include: {
          student: true,
        },
        orderBy: {dueDate: "asc"}, // Sort by urgency
      }),
      prisma.uniformIssue.findMany({
        take: 100,
        orderBy: {date: "desc"},
        include: {student: true}, // Include student details
      }),
    ]);

    // Aggregate dashboard stats
    const totalStudents = await prisma.student.count();
    const pendingInvoices = await prisma.invoice.count({
      where: {status: "Pending"},
    });
    const totalRevenue = await prisma.invoice.aggregate({
      _sum: {total: true},
      where: {status: "Paid"},
    });

    res.status(200).json({
      students,
      invoices,
      uniforms,
      stats: {
        totalStudents,
        pendingInvoices,
        totalRevenue: totalRevenue._sum.total || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching all data:", error);
    res.status(500).json({
      error: "Failed to load dashboard data",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default getAllData;
