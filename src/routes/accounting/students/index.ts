import {Request, Response, Router} from "express";
import {
  createStudent,
  getAllStudents,
} from "../../../controllers/accounting/students";
import { getUnpaidStudents } from "../../../helpers/getUnpaidStudents";
import { getPaidStudents } from "../../../helpers/getPaidStudents";

const studentsRouter = Router();

// Get all students
studentsRouter.get("/", getAllStudents);

// Create student
studentsRouter.post("/new", (req: Request, res: Response) => {
  createStudent(req, res);
});

studentsRouter.get("/unpaid",async (req: Request, res: Response) => {
  res.json(await getUnpaidStudents());
});

studentsRouter.get("/paid", async (req: Request, res: Response) => {
  res.json(await getPaidStudents());
});

export default studentsRouter;
