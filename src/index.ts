import express, { Request, Response } from "express";
import morgan from "morgan";

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Morgan middleare
app.use(morgan("dev"));

// Routes

// Catch-All route
app.use("*", (req: Request, res: Response) => {
    res.send("Hello there ! This is Vumba View Academy's API");
})

const PORT = process.env.PORT;

// Listen for requests
app.listen(PORT, () => {
    console.log("Vumba View Academy Accounting server running on port " + PORT)
})