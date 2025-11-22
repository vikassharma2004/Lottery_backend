import express from "express";
import {  isAuthenticated } from "../middleware/Authenticated.js";
import {
 
  getStats,
  getAnalytics,
} from "../controllers/Analytics.controller.js";

const analyticsRouter = express.Router();


analyticsRouter.get("/stats", isAuthenticated, getStats);
analyticsRouter.get("/", isAuthenticated ,getAnalytics);

export default analyticsRouter;
