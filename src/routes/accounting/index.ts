import {Router} from "express";
import getAllData from "../../controllers/accounting";

const accountingRouter = Router();

accountingRouter.get("/", getAllData);

export default accountingRouter;
