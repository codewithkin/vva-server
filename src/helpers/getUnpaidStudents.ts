import {getCurrentTerm} from "./getCurrentTerm";
import {prisma} from "./prisma";

const SCHOOL_FEES_PER_TERM = 130;

interface InvoiceItem {
  feeType: string;
  amount: number;
  description?: string;
}

interface UnpaidStudent {
  id: string;
  name: string;
  class: string;
  arrears: number;
}

export const getUnpaidStudents = async (): Promise<UnpaidStudent[]> => {
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
        uniforms: true,
      },
    });

    const unpaidStudents: UnpaidStudent[] = [];

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
          []) as unknown as InvoiceItem[];
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

        const arrears = Math.max(
          0,
          SCHOOL_FEES_PER_TERM - totalPaymentsAppliedToSchoolFees
        );

        if (arrears > 0) {
          unpaidStudents.push({
            id: student.id,
            name: student.name,
            class: student.class,
            arrears: arrears,
          });
        }
      }
    }

    return unpaidStudents;
  } catch (error) {
    console.error("Error in getUnpaidStudents:", error);
    throw new Error(
      "Failed to retrieve unpaid students data due to a server error."
    );
  } finally {
    await prisma.$disconnect();
  }
};
