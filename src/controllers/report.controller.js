import { catchAsyncError } from "../middleware/CatchAsyncError.js";
import { AppError } from "../middleware/ErrorHandler.js";
import {
    createReportService,
    deleteReportService,
    getAllReportsService,
    getReportByIdService,
    updateReportStatusService,
} from "../services/report.service.js";
import { Notification } from "../models/Notification.js";
// User creates a report
export const createReportController = catchAsyncError(async (req, res, next) => {
    const { issueType, description, email } = req.body;

    if (!description || !issueType) return next(new AppError("Description and issue type is required", 400));

    const report = await createReportService({ email, issueType, description });
    res.status(201).json({ message: "issue reported", success: true });
});

// Admin/User gets all reports (with filters & pagination)
export const getAllReportsController = catchAsyncError(async (req, res, next) => {
    const { page, limit, issueType, status } = req.query;
    const { role } = req.user;
    if (role !== "admin") {
        return next(new AppError("Access denied. Admins only.", 403));
    }
    const result = await getAllReportsService({ page, limit, issueType, status });
    res.status(200).json({ message: "reports fetched successfully", ...result });
});

// Get a single report by ID
export const getReportByIdController = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    if (!id) {
        throw new AppError("Report ID is required", 400);
    }
    const { role } = req.user;
    if (role !== "admin") {
        return next(new AppError("Access denied. Admins only.", 403));
    }
    const report = await getReportByIdService(id);
    res.status(200).json(report);
});

// Admin updates report status
export const updateReportStatusController = catchAsyncError(async (req, res, next) => {

    const { id } = req.params;
    if (!id) {
        throw new AppError("Report ID is required", 400);
    }
    const { status } = req.body;
    const { role } = req.user;
    if (role !== "admin") {
        return next(new AppError("Access denied. Admins only.", 403));
    }
    if (!status || !["pending", "in_progress", "resolved", "rejected"].includes(status)) {
        return next(new AppError("Invalid status", 400));
    }

    const updatedReport = await updateReportStatusService(id, status);
    res.status(200).json({ message: "Report updated successfully", updatedReport });
});
export const deleteReportController = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    if (!id) {
        throw new AppError("Report ID is required", 400);
    }

    const { role } = req.user;
    if (role !== "admin") {
        return next(new AppError("Access denied. Admins only.", 403));
    }
    const result = await deleteReportService(id);
    res.status(200).json({ message: "Report deleted successfully" });
});