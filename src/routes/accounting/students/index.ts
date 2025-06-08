import { Router } from "express";
import { getAllStudents } from "../../../controllers/accounting/students";

const studentsRouter = Router();

// Get all students
studentsRouter.get("/", getAllStudents);

export default studentsRouter;