import { catchAsyncError } from "../middleware/CatchAsyncError.js";
import { AppError } from "../middleware/ErrorHandler.js";
import { getAllUsersService, getUserByIdService, toggleSuspendUserService } from "../services/adminservice.js";
import { StatusCodes, ReasonPhrases } from "http-status-codes";
import { User } from "../models/User.model.js";
export const toggleSuspendUser = catchAsyncError(async (req, res, next) => {
    const { userId } = req.user;
    const { role } = req.user;
    if (role !== "admin") {
        return next(new AppError("Access denied. Admins only.", 403));
    }
    const { message } = await toggleSuspendUserService(userId);

    res.status(StatusCodes.OK).json({ message });
});

export const getUserController = catchAsyncError(async (req, res, next) => {
    const { userId } = req.user;
    const { role } = req.user;
    if (role !== "admin") {
        return next(new AppError("Access denied. Admins only.", 403));
    }
    const { user } = await getUserByIdService(userId);

    if (!user) return next(new AppError("User not found", 404));

    res.status(StatusCodes.OK).json({ user });
});


// export const getAllUsersController = catchAsyncError(async (req, res, next) => {

//     const { role } = req.user;
//     if (role !== "admin") {
//         return next(new AppError("Access denied. Admins only.", 403));
//     }
//     const { users, pagination } = await getAllUsersService();
//     res.status(StatusCodes.OK).json({ users, pagination });
// });


export const getAllUsers = catchAsyncError(async (req, res, next) => {
    if (req.user.role !== "admin") {
        throw new AppError("Access denied. Admin only", 403);
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filters = {};

    // Email regex search
    if (req.query.email) {
        filters.email = { $regex: req.query.email, $options: "i" };
    }

    // hasPaid filter: "true" or "false"
    if (req.query.hasPaid) {
        filters.hasPaid = req.query.hasPaid === "true";
    }

    // isSuspended filter
    if (req.query.isSuspended) {
        filters.isSuspended = req.query.isSuspended === "true";
    }

    // Query (FAST using lean + index)
    const users = await User.find(filters)
        .select("name email hasPaid isSuspended createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    const total = await User.countDocuments(filters);

    res.status(200).json({
        success: true,
        page,
        totalPages: Math.ceil(total / limit),
        total,
        users,
    });
});

