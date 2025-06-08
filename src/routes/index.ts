import { Router } from "express";
import accountingRouter from "./accounting";

const appRouter = Router();

// Register accounting-app routes
appRouter.use("/accounting", accountingRouter);

export default appRouter;