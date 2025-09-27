import express from "express";
import { adminSessionMiddleware } from "../middleware/Authenticated.js";
import {
  getPaidUsersCountController,
  getUsersByMonthController,
  getPaymentsByMonthController,
} from "../controllers/Analytics.controller.js";

const analyticsRouter = express.Router();

// User analytics
analyticsRouter.get("/users/paid-count", adminSessionMiddleware, getPaidUsersCountController);
analyticsRouter.get("/users/by-month", adminSessionMiddleware, getUsersByMonthController);

// Payment analytics
analyticsRouter.get("/payments/by-month", adminSessionMiddleware, getPaymentsByMonthController);

export default analyticsRouter;
