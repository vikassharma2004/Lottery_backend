import { catchAsyncError } from "../middleware/CatchAsyncError.js";
import { AppError } from "../middleware/ErrorHandler.js";
import {
    createReportService,
    deleteReportService,
    getAllReportsService,
    getReportByIdService,
    updateReportStatusService,
} from "../services/report.service.js";

// User creates a report
export const createReportController = catchAsyncError(async (req, res, next) => {
    const { issueType, description } = req.body;
    const { userId } = req.user;

    if (!description || !issueType) return next(new AppError("Description and issue type is required", 400));

    const report = await createReportService({ userId, issueType, description });
    res.status(201).json({ message: "Report created successfully", report });
});

// Admin/User gets all reports (with filters & pagination)
export const getAllReportsController = catchAsyncError(async (req, res, next) => {
    const { page, limit, issueType, status } = req.query;
    const result = await getAllReportsService({ page, limit, issueType, status });
    res.status(200).json(result);
});

// Get a single report by ID
export const getReportByIdController = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const report = await getReportByIdService(id);
    res.status(200).json(report);
});

// Admin updates report status
export const updateReportStatusController = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["pending", "in_progress", "resolved", "rejected"].includes(status)) {
        return next(new AppError("Invalid status", 400));
    }

    const updatedReport = await updateReportStatusService(id, status);
    res.status(200).json({ message: "Report updated successfully", updatedReport });
});
export const deleteReportController = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;

    const result = await deleteReportService(id);
    res.status(200).json({ message: "Report deleted successfully" });
});