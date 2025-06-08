import express, {Request, Response} from "express";
import morgan from "morgan";
import cors from "cors";
import appRouter from "./routes";
import {config} from "dotenv";

const app = express();

config();

// Middleware
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// CORS Middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE"],
  })
);

// Morgan middleare
app.use(morgan("dev"));

// Routes
app.use("/api", appRouter);

// Catch-All route
// app.use("*", (req: Request, res: Response) => {
//   res.send("Hello there ! This is Vumba View Academy's API");
// });

const PORT = process.env.PORT;

// Listen for requests
app.listen(PORT, () => {
  console.log("Vumba View Academy Accounting server running on port " + PORT);
});
