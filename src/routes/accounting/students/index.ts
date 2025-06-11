import {Request, Response, Router} from "express";
import {
  createStudent,
  getAllStudents,
  getStudentById,
} from "../../../controllers/accounting/students";
import {getUnpaidStudents} from "../../../helpers/getUnpaidStudents";
import {getPaidStudents} from "../../../helpers/getPaidStudents";

const studentsRouter = Router();

// Get all students
studentsRouter.get("/", getAllStudents);

// Create student
studentsRouter.post("/new", (req: Request, res: Response) => {
  createStudent(req, res);
});

studentsRouter.get("/unpaid", async (req: Request, res: Response) => {
  const unpaidStudents = await getUnpaidStudents();

  res.json({data: unpaidStudents, success: true});
});

studentsRouter.get("/paid", async (req: Request, res: Response) => {
  const paidStudents = await getPaidStudents();

  res.json({data: paidStudents, success: true});
});

studentsRouter.get("/:id", async (req: Request, res: Response) => {
  res.json(await getStudentById(req, res));
});

export default studentsRouter;
