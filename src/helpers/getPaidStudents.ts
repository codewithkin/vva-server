import {getCurrentTerm} from "./getCurrentTerm";
import {prisma} from "./prisma";

const SCHOOL_FEES_PER_TERM = 130;

interface InvoiceItem {
  feeType: string;
  amount: number;
  description?: string;
}

interface PaidStudent {
  id: string;
  name: string;
  class: string;
}

export const getPaidStudents = async (): Promise<PaidStudent[]> => {
  try {
    const currentTermInfo = getCurrentTerm();
    const {year, startDate, endDate} = currentTermInfo;

    const allStudents = await prisma.student.findMany({
      include: {
        invoices: {
          include: {
            payments: true,
          },
        },
      },
    });

    const paidStudents: PaidStudent[] = [];

    for (const student of allStudents) {
      let totalPaymentsAppliedToSchoolFees = 0;
      let hasRelevantSchoolFeesInvoiceThisTerm = false;

      const relevantInvoices = student.invoices.filter((invoice) => {
        const invoiceDueDate = new Date(invoice.dueDate);
        const isWithinTerm =
          invoiceDueDate >= startDate && invoiceDueDate <= endDate;

        if (!isWithinTerm) {
          return false;
        }

        const invoiceItems: InvoiceItem[] = (invoice.items ||
          []) as InvoiceItem[];
        const containsSchoolFees = invoiceItems.some(
          (item) => item.feeType === "School Fees"
        );

        if (containsSchoolFees) {
          hasRelevantSchoolFeesInvoiceThisTerm = true;
        }
        return containsSchoolFees;
      });

      if (hasRelevantSchoolFeesInvoiceThisTerm) {
        for (const invoice of relevantInvoices) {
          totalPaymentsAppliedToSchoolFees += invoice.payments.reduce(
            (sum, payment) => sum + payment.amount,
            0
          );
        }

        const arrears = SCHOOL_FEES_PER_TERM - totalPaymentsAppliedToSchoolFees;

        if (arrears <= 0) {
          paidStudents.push({
            id: student.id,
            name: student.name,
            class: student.class,
          });
        }
      }
    }

    return paidStudents;
  } catch (error) {
    console.error("Error in getPaidStudents:", error);
    throw new Error("Failed to retrieve paid students data.");
  } finally {
    await prisma.$disconnect();
  }
};
