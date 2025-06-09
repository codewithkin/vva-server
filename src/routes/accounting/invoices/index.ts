import {Router} from "express";
import { getAllInvoices } from "../../../controllers/accounting/invoices";

const invoicesRouter = Router();

invoicesRouter.get("/invoices/", getAllInvoices);

export default invoicesRouter;
