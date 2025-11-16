import express from "express";
import {
  createReportController,
  deleteReportController,
  getAllReportsController,
  getReportByIdController,
  updateReportStatusController,
} from "../controllers/report.controller.js";
const ReportRouter = express.Router();
import {isAuthenticated,adminSessionMiddleware} from "../middleware/Authenticated.js";

ReportRouter.route("/").post(createReportController);
ReportRouter.route("/").get(adminSessionMiddleware,getAllReportsController);
ReportRouter.route("/:id").get(adminSessionMiddleware,getReportByIdController);
ReportRouter.route("/:id").put(adminSessionMiddleware,updateReportStatusController);
ReportRouter.route("/:id").delete(adminSessionMiddleware,deleteReportController);
export default ReportRouter;
