// src/routes/accounting/invoices.ts

import {Request, Response, Router} from "express";
import {
  createInvoice,
  deleteInvoice,
  getAllInvoices,
  getCreditInvoicesForStudent,
} from "../../../controllers/accounting/invoices";

const invoicesRouter = Router();

// Existing routes
invoicesRouter.get("/", getAllInvoices);

invoicesRouter.delete("/:id", deleteInvoice);

invoicesRouter.post("/new", (req: Request, res: Response) => {
  createInvoice(req, res);
});

// NEW ROUTE: Get outstanding credit invoices for a specific student
invoicesRouter.get(
  "/student/:studentId/credit-outstanding",
  async (req: Request, res: Response) => {
    res.json(await getCreditInvoicesForStudent(req, res));
  }
);

export default invoicesRouter;
