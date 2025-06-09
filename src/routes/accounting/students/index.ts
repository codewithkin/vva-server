import {Request, Response, Router} from "express";
import {
  createStudent,
  getAllStudents,
} from "../../../controllers/accounting/students";

const studentsRouter = Router();

// Get all students
studentsRouter.get("/", getAllStudents);

// Create student
studentsRouter.post("/new", (req: Request, res: Response) => {
  createStudent(req, res);
});

export default studentsRouter;
