import express from "express";
import {
  createReportController,
  deleteReportController,
  getAllReportsController,
  getReportByIdController,
  updateReportStatusController,
} from "../controllers/report.controller.js";
const ReportRouter = express.Router();
import {isAuthenticated} from "../middleware/Authenticated.js";

ReportRouter.route("/").post(createReportController);
ReportRouter.route("/").get(isAuthenticated,getAllReportsController);
ReportRouter.route("/:id").get(isAuthenticated,getReportByIdController);
ReportRouter.route("/:id").put(isAuthenticated,updateReportStatusController);
ReportRouter.route("/:id").delete(isAuthenticated,deleteReportController);
export default ReportRouter;
