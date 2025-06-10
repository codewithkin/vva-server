import {Request, Response} from "express";
import {prisma} from "../../../helpers/prisma";
import sendNotificationEmail from "../../../fucntions/email/sendNotificationEmail";
import nodemailer from "nodemailer";

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
// Placeholder for SMS sending function
// In a real application, you would integrate with an SMS API like Twilio, Vonage, etc.
async function sendSMS(to: string, message: string): Promise<void> {
  console.log(`[SMS Mock] Sending SMS to ${to}: ${message}`);
  // Implement actual SMS API call here
  // Twilio code removed
}

// Assuming principalContact and email are available from environment variables or config
const PRINCIPAL_CONTACT = process.env.PRINCIPAL_PHONE_NUMBER || "0771234567"; // Replace with actual principal number
const PRINCIPAL_EMAIL =
  process.env.PRINCIPAL_EMAIL || "kinzinzombe07@gmail.com"; // Replace with actual principal email

export const createInvoice = async (req: Request, res: Response) => {
  try {
    // Destructure new fields: amountDue and linkedInvoiceId
    const {
      studentId,
      items,
      dueDate,
      paymentMethod,
      amountDue,
      linkedInvoiceId,
    } = req.body;

    // --- Initial Validation ---
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
        error: "Invoice must contain at least one item",
      });
    }

    const total = items.reduce(
      (sum: number, item: InvoiceItem) => sum + item.amount,
      0
    );

    // --- Determine Invoice Type Flags ---
    const isCreditPayment = paymentMethod === "Credit";
    const isFulfillmentInvoice = items.some(
      (item: InvoiceItem) => item.feeType === "Fulfillment"
    );

    // --- Specific Validations based on type ---
    if (
      isCreditPayment &&
      (amountDue === undefined ||
        typeof amountDue !== "number" ||
        amountDue < 0)
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Valid 'amountDue' (non-negative number) is required for 'Credit' payment method.",
      });
    }
    // For fulfillment invoice, enforce single item and linkedInvoiceId
    if (isFulfillmentInvoice) {
      if (!linkedInvoiceId) {
        return res.status(400).json({
          success: false,
          error: "'linkedInvoiceId' is required for 'Fulfillment' fee type.",
        });
      }
      if (items.length !== 1 || items[0].feeType !== "Fulfillment") {
        return res.status(400).json({
          success: false,
          error:
            "A 'Fulfillment' invoice must contain exactly one item, and that item must be of type 'Fulfillment'.",
        });
      }
      if (paymentMethod === "Credit") {
        return res.status(400).json({
          success: false,
          error:
            "Fulfillment invoices cannot have 'Credit' as a payment method, as they represent an actual payment.",
        });
      }
    }

    // --- Fetch Student Details (for SMS) ---
    const student = await prisma.student.findUnique({
      where: {id: studentId},
      select: {id: true, name: true, parentContact: true},
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        error: "Student not found.",
      });
    }

    // --- Determine the status of the new invoice ---
    let newInvoiceStatus: "Pending" | "Paid";
    if (isCreditPayment) {
      newInvoiceStatus = "Pending";
    } else {
      newInvoiceStatus = "Paid"; // Immediate payment or fulfillment
    }

    // --- Create New Invoice ---
    const invoice = await prisma.invoice.create({
      data: {
        studentId,
        items: items as any, // Cast to any if Prisma schema expects Json
        total,
        dueDate: new Date(dueDate),
        status: newInvoiceStatus,
      },
    });

    // --- Create Payment Record (Conditional) ---
    // A payment record is created only if it's not a 'Credit' invoice (meaning, an actual payment was made)
    if (!isCreditPayment) {
      await prisma.payment.create({
        data: {
          invoiceId: invoice.id,
          amount: total, // For fulfillment, this is the amount paid
          method: paymentMethod,
          date: new Date(),
        },
      });
    }

    // --- Handle Fulfillment Invoice Specific Updates ---
    if (isFulfillmentInvoice && linkedInvoiceId) {
      // Find and update the original credit invoice
      const originalCreditInvoice = await prisma.invoice.findUnique({
        where: {id: linkedInvoiceId},
      });

      if (originalCreditInvoice) {
        await prisma.invoice.update({
          where: {id: linkedInvoiceId},
          data: {
            status: "Paid", // Mark the original credit invoice as paid
          },
        });
        console.log(
          `Original credit invoice ${linkedInvoiceId} marked as Paid.`
        );
      } else {
        console.warn(
          `Attempted to fulfill non-existent invoice with ID: ${linkedInvoiceId}`
        );
        // Depending on your business logic, you might want to return an error here
        // However, for robustness, we'll continue creating the fulfillment invoice
      }

      // Send SMS to parent (thanking for payment) and principal (notification)
      // if (student.parentContact) {
      //   await sendSMS(
      //     student.parentContact,
      //     `Dear VVA Parent, Thank you for your payment of $${total.toFixed(
      //       2
      //     )} for ${student.name}'s invoice. Your account has been updated. VVA.`
      //   );
      // } else {
      //   console.warn(
      //     `No parent contact found for student ${student.name} (${student.id}). Cannot send payment confirmation SMS.`
      //   );
      // }

      // await sendSMS(
      //   PRINCIPAL_CONTACT,
      //   `New payment of $${total.toFixed(2)} received for student ${
      //     student.name
      //   }. Invoice ID: ${invoice.id.substring(0, 6)}...`
      // );
    }

    // --- Handle Uniform Issue Creation (Existing Logic) ---
    const uniformItems = items.filter(
      (item: InvoiceItem) => item.feeType === "Uniform"
    );

    if (uniformItems.length > 0) {
      const isCreditForUniformIssue = isCreditPayment; // Uniform issue credit status depends on the overall invoice payment method
      for (const item of uniformItems) {
        await prisma.uniformIssue.create({
          data: {
            studentId: studentId,
            items: {
              // Ensure this matches your UniformIssue model's Json field structure
              feeType: item.feeType,
              amount: item.amount,
              description: item.description,
            } as any,
            date: new Date(),
            isCredit: isCreditForUniformIssue,
          },
        });
      }
    }

    // --- Check for "School Fees" (Existing Logic) ---
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
          `- ${item.feeType}: $${item.amount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}${item.description ? ` (${item.description})` : ""}`
      )
      .join("\n");

    const emailSubject = isFulfillmentInvoice
      ? "Invoice Fulfilled & Payment Received"
      : "New Invoice Created";

    const emailContent = `
A new invoice has been created.

Student Name: ${student.name}
Student ID: ${student.id}
Due Date: ${new Date(dueDate).toLocaleDateString()}
Payment Method: ${paymentMethod}
Status: ${invoice.status}
Total Amount: $${total.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}
${
  isCreditPayment && amountDue !== undefined
    ? `Amount Due: $${amountDue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : ""
}
${
  isFulfillmentInvoice && linkedInvoiceId
    ? `Fulfilling previous Invoice ID: ${linkedInvoiceId}`
    : ""
}

Items:
${itemList}
    `.trim();

    // Nodemailer transporter setup
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "kinzinzombe07@gmail.com", // Ensure EMAIL_USER is set in your environment
        pass: "bqsv aqfa rjrg ugtn",
      },
    });

    // Send the email to default recipient and principal
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: `kinzinzombe07@gmail.com, ${PRINCIPAL_EMAIL}`, // Include principal email
      subject: emailSubject,
      text: emailContent,
    });

    // --- Send SMS for New Credit Invoices (if applicable) ---
    // if (isCreditPayment) {
    //   if (student.parentContact) {
    //     await sendSMS(
    //       student.parentContact,
    //       `Dear VVA Parent, Please note that ${
    //         student.name
    //       }'s invoice for $${total.toFixed(2)} is due on ${new Date(
    //         dueDate
    //       ).toLocaleDateString()}. Kindly pay before then. VVA.`
    //     );
    //   } else {
    //     console.warn(
    //       `No parent contact found for student ${student.name} (${student.id}). Cannot send credit invoice SMS.`
    //     );
    //   }
    // }

    res.status(201).json({
      success: true,
      message: "Invoice and associated records created successfully!",
      data: invoice,
    });
  } catch (error: any) {
    // Type 'error' as 'any' for better error handling access
    console.error(
      "Failed to create invoice or send notification:",
      error.message || error
    ); // Log specific error message
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create invoice due to a server error.", // Send specific error message
    });
  } finally {
    await prisma.$disconnect();
  }
};
