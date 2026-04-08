"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const authMiddleware_1 = require("./middleware/authMiddleware");
const teamMemberRoutes_1 = __importDefault(require("./routes/teamMemberRoutes"));
const loanRoutes_1 = __importDefault(require("./routes/loanRoutes"));
const dashboardRoutes_1 = __importDefault(require("./routes/dashboardRoutes"));
const targetRoutes_1 = __importDefault(require("./routes/targetRoutes"));
const perfomanceRoutes_1 = __importDefault(require("./routes/perfomanceRoutes"));
const leaderboardRoutes_1 = __importDefault(require("./routes/leaderboardRoutes"));
const reportRoutes_1 = __importDefault(require("./routes/reportRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL,
    credentials: true,
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.get("/", (_req, res) => {
    res.json({ message: "Brimo Team API is running" });
});
app.use("/api/auth", authRoutes_1.default);
app.use("/api/team-members", teamMemberRoutes_1.default);
app.use("/api/loans", loanRoutes_1.default);
app.use("/api/dashboard", dashboardRoutes_1.default);
app.use("/api/targets", targetRoutes_1.default);
app.use("/api/performance", perfomanceRoutes_1.default);
app.use("/api/leaderboards", leaderboardRoutes_1.default);
app.use("/api/reports", reportRoutes_1.default);
app.get("/api/protected-test", authMiddleware_1.protect, (req, res) => {
    res.json({ message: "You accesses a protected route" });
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
