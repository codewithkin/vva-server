import {Request, Response} from "express";
import {prisma} from "../../../helpers/prisma";
import sendNotificationEmail from "../../../fucntions/email/sendNotificationEmail";
import nodemailer from "nodemailer";

export const getAllInvoices = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const take = limit === 0 ? undefined : limit;
    const status = req.query.status as string | undefined;
    const skip = (page - 1) * limit;

    const whereClause = status ? {status} : {};

    const [invoices, totalCount] = await Promise.all([
      prisma.invoice.findMany({
        skip,
        take,
        where: whereClause,
        orderBy: {dueDate: "asc"},
        include: {
          student: true,
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

interface InvoiceItem {
  feeType: string;
  amount: number;
  description?: string;
}

interface InvoiceItem {
  feeType: string;
  amount: number;
  description?: string;
}

export const createInvoice = async (req: Request, res: Response) => {
  try {
    const {studentId, items, dueDate, paymentMethod} = req.body;

    if (!studentId || !items || !dueDate || !paymentMethod) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required fields: studentId, items, dueDate, or paymentMethod",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Items must be a non-empty array",
      });
    }

    const total = items.reduce(
      (sum: number, item: InvoiceItem) => sum + item.amount,
      0
    );

    const invoice = await prisma.invoice.create({
      data: {
        studentId,
        items: items as any,
        total,
        dueDate: new Date(dueDate),
        status: paymentMethod === "Credit" ? "Pending" : "Paid",
      },
    });

    await prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        amount: total,
        method: paymentMethod,
        date: new Date(),
      },
    });

    const uniformItems = items.filter(
      (item: InvoiceItem) => item.feeType === "Uniform"
    );

    if (uniformItems.length > 0) {
      const isCredit = paymentMethod === "Credit";
      for (const item of uniformItems) {
        await prisma.uniformIssue.create({
          data: {
            studentId: studentId,
            items: {
              feeType: item.feeType,
              amount: item.amount,
              description: item.description,
            } as any,
            date: new Date(),
            isCredit: isCredit,
          },
        });
      }
    }

    // --- Check for "School Fees" ---
    const hasSchoolFeesItem = items.some(
      (item: InvoiceItem) => item.feeType === "School Fees"
    );
    if (hasSchoolFeesItem) {
      console.log(
        `Invoice ${invoice.id} includes "School Fees". Unpaid student data might need to be refreshed.`
      );
    }

    // --- Send Notification Email Logic ---
    const itemList = items
      .map(
        (item: InvoiceItem) =>
          `- ${item.feeType}: $${item.amount}${
            item.description ? ` (${item.description})` : ""
          }`
      )
      .join("\n");

    const emailContent = `
A new invoice has been created.

Student ID: ${studentId}
Due Date: ${new Date(dueDate).toLocaleDateString()}
Payment Method: ${paymentMethod}
Status: ${paymentMethod === "Credit" ? "Pending" : "Paid"}
Total Amount: $${total.toLocaleString()}

Items:
${itemList}
      `.trim();

    // Nodemailer transporter setup
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "kinzinzombe07@gmail.com",
        pass: process.env.EMAIL_PASS,
      },
    });

    // Send the email
    await transporter.sendMail({
      from: process.env.EMAIL_USER, // Ensure EMAIL_USER is set in your environment
      to: "stephchikamhi@gmail.com", // Or a configurable recipient
      subject: "New Invoice Created",
      text: emailContent,
    });

    res.status(201).json({
      success: true,
      message: "Invoice and associated records created successfully!",
      data: invoice,
    });
  } catch (error) {
    console.error(
      "Failed to create invoice or send notification email:",
      error
    ); // More specific error log
    res.status(500).json({
      success: false,
      error: "Failed to create invoice due to a server error.",
    });
  } finally {
    await prisma.$disconnect();
  }
};
