import {Router} from "express";
import getAllData from "../../controllers/accounting";
import studentsRouter from "./students";

const accountingRouter = Router();

accountingRouter.get("/", getAllData);

// Students
accountingRouter.use("/students", studentsRouter);

export default accountingRouter;
