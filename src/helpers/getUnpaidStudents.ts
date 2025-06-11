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
    const {startDate, endDate} = currentTermInfo;

    const allStudents = await prisma.student.findMany({
      include: {
        invoices: {
          include: {
            payments: true,
          },
        },
        uniforms: true, // Kept from your original code, remove if not needed
      },
    });

    const unpaidStudents: UnpaidStudent[] = [];

    for (const student of allStudents) {
      let totalPaymentsAppliedToSchoolFees = 0;

      for (const invoice of student.invoices) {
        const invoiceDueDate = new Date(invoice.dueDate);
        const isWithinTerm =
          invoiceDueDate >= startDate && invoiceDueDate <= endDate;

        if (isWithinTerm) {
          const invoiceItems: InvoiceItem[] = (invoice.items ||
            []) as unknown as InvoiceItem[];
          console.log("Invoice items: ", invoiceItems);
          const containsSchoolFees = invoiceItems.some(
            (item) => item.feeType === "School Fees"
          );

          console.log("School fees invoices: ", containsSchoolFees);

          if (containsSchoolFees) {
            totalPaymentsAppliedToSchoolFees += invoice.payments.reduce(
              (sum, payment) => sum + payment.amount,
              0
            );
          }
        }
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
