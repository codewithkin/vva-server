import {Request, Response, Router} from "express";
import {
  createInvoice,
  getAllInvoices,
} from "../../../controllers/accounting/invoices";

const invoicesRouter = Router();

invoicesRouter.get("/", getAllInvoices);

invoicesRouter.post("/new", (req: Request, res: Response) => {
  createInvoice(req, res);
});

export default invoicesRouter;
