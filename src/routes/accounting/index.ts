import {Router} from "express";
import getAllData from "../../controllers/accounting";
import studentsRouter from "./students";
import invoicesRouter from "./invoices";

const accountingRouter = Router();

accountingRouter.get("/", getAllData);

// Students
accountingRouter.use("/students", studentsRouter);

// Invoices
accountingRouter.use("/invoices", invoicesRouter);

export default accountingRouter;
