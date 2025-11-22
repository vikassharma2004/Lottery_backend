import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";

import AuthRouter from "./routes/authRoutes.js";
import OtpRouter from "./routes/otpRoutes.js";
import AdminRouter from "./routes/admin.route.js";
import ReportRouter from "./routes/report.route.js";
import analyticsRouter from "./routes/analyticsrouter.js";
import PaymentRouter from "./routes/paymentRoutes.js";
import WithdrawRouter from "./routes/withdraw.route.js";
import NotificationRouter from "./routes/NotificationRoute.js";
import userRouter from "./routes/user.route.js";
import announcementRouter from "./routes/announcementRoutes.js";
import paymentVerificationRouter from "./routes/paymentVerificationRoutes.js";

import { errorHandler } from "./middleware/ErrorHandler.js";
import logger from "./config/logger.js";

const app = express();

// 0️⃣ RAW webhook (must be before JSON parser)
app.use("/webhook/cashfree", express.raw({ type: "application/json" }));

// 1️⃣ Standard Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(helmet());
app.use(compression());
app.use(cookieParser());

// 2️⃣ Health Route
app.get("/", (req, res) => {
  res.status(200).json({ message: "Server is healthy" });
});

// 3️⃣ 🔥 Performance Logger (MUST be before routes)
app.use((req, res, next) => {
  const start = performance.now();

  res.on("finish", () => {
    const ms = performance.now() - start;
    logger.info(`${req.method} ${req.originalUrl} - ${ms.toFixed(2)}ms`);
  });

  next();
});

// 4️⃣ Routes
app.use("/api/auth", AuthRouter);
app.use("/api/otp", OtpRouter);
app.use("/api/admin", AdminRouter);
app.use("/api/report", ReportRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/payment", PaymentRouter);
app.use("/api/user", userRouter);
app.use("/api/withdraw", WithdrawRouter);
app.use("/api/Notification", NotificationRouter);
app.use("/api/announcements", announcementRouter);
app.use("/api/payment-verification", paymentVerificationRouter);

// 5️⃣ 404 Handler (AFTER ROUTES)
app.use((req, res) => {
  logger.warn(`404 - ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: "Route not found" });
});

// 6️⃣ Global error handler (LAST)
app.use(errorHandler);

export default app;
