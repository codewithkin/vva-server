import {Request, Response} from "express";
import {prisma} from "../../../helpers/prisma";
import {stringify} from "csv-stringify/sync";

export const createStudent = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      name,
      class: studentClass,
      contact,
      parentContact,
    } = req.body;

    if (!name || !studentClass || !contact || !parentContact) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existing = await prisma.student.findFirst({
      where: { name },
    });

    if (existing) {
      return res.status(409).json({ error: "Admission ID already exists" });
    }

    const student = await prisma.student.create({
      data: {
        name,
        class: studentClass,
        contact,
        parentContact,
      },
    });

    return res.status(201).json(student);
  } catch (error: any) {
    console.error("Create Student Error:", error);
    return res.status(500).json({
      error: "Something went wrong while creating student.",
    });
  }
};

export const getAllStudents = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const filter = (req.query.filter as string) ?? "all";
    const download = req.query.download === "csv";

    const skip = (page - 1) * limit;
    const now = new Date();
    const year = now.getFullYear();

    const terms = [
      {start: new Date(`${year}-01-14`), end: new Date(`${year}-04-10`)},
      {start: new Date(`${year}-05-13`), end: new Date(`${year}-08-07`)},
      {start: new Date(`${year}-09-09`), end: new Date(`${year}-12-01`)},
    ];
    const currentTerm =
      terms.find((t) => now >= t.start && now <= t.end) ?? terms[2];

    const students = await prisma.student.findMany({
      skip,
      take: download ? undefined : limit,
      include: {invoices: true, uniforms: true},
    });

    const filtered = students.filter((student) => {
      const hasPaid = student.invoices.some((inv: any) => {
        const d = new Date(inv.dueDate);
        return (
          inv.items?.feeType === "Fees" &&
          inv.status === "Paid" &&
          d >= currentTerm.start &&
          d <= currentTerm.end
        );
      });
      if (filter === "paid") return hasPaid;
      if (filter === "unpaid") return !hasPaid;
      return true;
    });

    if (download) {
      const header = [
        "Admission ID",
        "Name",
        "Class",
        "Contact",
        "Parent Contact",
      ];
      const records = filtered.map((s) => [
        s.name,
        s.class,
        s.contact,
        s.parentContact,
      ]);
      const csv = stringify([header, ...records]);
      res
        .header("Content-Type", "text/csv")
        .attachment(`students-${filter}-${year}-term.csv`)
        .send(csv);
      return;
    }

    const totalCount = await prisma.student.count();
    res.status(200).json({
      success: true,
      data: filtered,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.log("Failed to fetch students: ", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch students",
    });
  }
};
