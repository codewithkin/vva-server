import {Request, Response, Router} from "express";
import {
  createStudent,
  getAllStudents,
  getStudentById,
} from "../../../controllers/accounting/students";
import {getUnpaidStudents} from "../../../helpers/getUnpaidStudents";
import {getPaidStudents} from "../../../helpers/getPaidStudents";
import {prisma} from "../../../helpers/prisma";

const studentsRouter = Router();

// Get all students
studentsRouter.get("/", getAllStudents);

// Create student
studentsRouter.post("/new", (req: Request, res: Response) => {
  createStudent(req, res);
});

studentsRouter.get("/unpaid", async (req: Request, res: Response) => {
  const unpaidStudents = await getUnpaidStudents();

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const filter = (req.query.filter as string) ?? "all";
  const download = req.query.download === "csv";

  const skip = (page - 1) * limit;

  const totalCount = unpaidStudents.length;

  res.json({
    data: unpaidStudents,
    success: true,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    },
  });
});

studentsRouter.get("/paid", async (req: Request, res: Response) => {
  const paidStudents = await getPaidStudents();

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const filter = (req.query.filter as string) ?? "all";
  const download = req.query.download === "csv";

  const skip = (page - 1) * limit;

  const totalCount = paidStudents.length;

  res.json({
    data: paidStudents,
    success: true,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    },
  });
});

studentsRouter.get("/:id", async (req: Request, res: Response) => {
  res.json(await getStudentById(req, res));
});

export default studentsRouter;
