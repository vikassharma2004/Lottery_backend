import { AppError } from "../middleware/ErrorHandler.js";
import { ReportIssue } from "../models/report.model.js";

// Create a new report
export const createReportService = async ({ userId, issueType, description }) => {
  const report = await ReportIssue.create({ userId, issueType, description });
  return report;
};

// Get all reports with optional filters and pagination
export const getAllReportsService = async ({ page = 1, limit = 10, issueType, status }) => {
  page = parseInt(page, 10);
  limit = parseInt(limit, 10);

  const query = {};
  if (issueType) query.issueType = issueType;
  if (status) query.status = status;

  const reports = await ReportIssue.find(query)
    .populate("userId", "name email") // fetch user's name/email
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 });

  const totalReports = await ReportIssue.countDocuments(query);
  const totalPages = Math.ceil(totalReports / limit);

  return {
    reports,
    pagination: { totalReports, totalPages, currentPage: page, pageSize: limit },
  };
};

// Get a single report by ID
export const getReportByIdService = async (reportId) => {
  const report = await ReportIssue.findById(reportId).populate("userId", "email phone");
  if (!report) throw new AppError("Report not found", 404);
  return report;
};

// Update report status (e.g., mark as resolved/rejected)
export const updateReportStatusService = async (reportId, status) => {
  const report = await ReportIssue.findById(reportId);
  if (!report) throw new AppError("Report not found", 404);

  report.status = status;
  if (status === "resolved" || status === "rejected") {
    report.resolvedAt = new Date();
  }

  await report.save();
  return report;
};

export const deleteReportService = async (reportId) => {
  const report = await ReportIssue.findById(reportId);
  if (!report) throw new AppError("Report not found", 404);

  await report.deleteOne(); // or remove()
  return { message: "Report deleted successfully" };
};
