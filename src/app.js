
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import AuthRouter from "./routes/authRoutes.js";
import OtpRouter from "./routes/otpRoutes.js";
import AdminRouter from "./routes/admin.route.js";
import ReportRouter from "./routes/report.route.js";
import analyticsRouter from "./routes/analyticsrouter.js";
import { errorHandler } from "./middleware/ErrorHandler.js";
import cookieParser from "cookie-parser";
import PaymentRouter from "./routes/paymentRoutes.js";
import WithdrawRouter from "./routes/withdraw.route.js";
import SessionRouter from "./routes/session.route.js";

// Initialize app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(cookieParser());

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ message: "Server is healthy" });
});
app.get("/",(req,res)=>{
  res.status(200).json({ message: "Server is healthy" });
})
app.use("/api/auth",AuthRouter)
app.use("/api/otp",OtpRouter)
app.use("/api/admin",AdminRouter)
app.use("/api/report",ReportRouter)
app.use("/api/analytics",analyticsRouter)
app.use("/api/payment",PaymentRouter)
app.use("/api/payment",WithdrawRouter)
app.use("/api/sessions",SessionRouter)
app.use("/api/withdraw",WithdrawRouter)
app.use(errorHandler)
// 404 handler
app.use((req, res) => {
  console.log(req.path);
  res.status(404).json({ error: "Route not found" });
});

export default app;
