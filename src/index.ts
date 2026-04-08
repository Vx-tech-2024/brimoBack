import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes";
import { protect } from "./middleware/authMiddleware";
import teamMemberRoutes from "./routes/teamMemberRoutes";
import loanRoutes from "./routes/loanRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import targetRoutes from "./routes/targetRoutes";
import perfomanceRoutes from "./routes/perfomanceRoutes";
import leaderboardRoutes from "./routes/leaderboardRoutes";
import reportRoutes from "./routes/reportRoutes";

dotenv.config();

const app = express();

app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
    })
);

app.use(express.json());
app.use(cookieParser());

app.get("/", (_req: Request, res: Response) => {
    res.json({ message: "Brimo Team API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/team-members", teamMemberRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/targets", targetRoutes);
app.use("/api/performance", perfomanceRoutes);
app.use("/api/leaderboards", leaderboardRoutes);
app.use("/api/reports", reportRoutes);

app.get("/api/protected-test", protect, (req: Request, res: Response) => {
    res.json({ message: "You accesses a protected route" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});