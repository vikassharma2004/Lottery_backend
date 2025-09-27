import { catchAsyncError } from "../middleware/CatchAsyncError.js";
import { AppError } from "../middleware/ErrorHandler.js";
import { getUserByIdService, toggleSuspendUserService } from "../services/adminservice.js";
import { StatusCodes, ReasonPhrases } from "http-status-codes";
export const toggleSuspendUser = catchAsyncError(async (req, res, next) => {
    const { userId } = req.body || {};

    if (!userId || req.body == "undefined") {
        return next(new AppError("User Id is required", 400));
    }

    const { message } = await toggleSuspendUserService(userId);

    res.status(StatusCodes.OK).json({ message });
});

export const getUserController = catchAsyncError(async (req, res, next) => {
    const { userId } = req.params;
    const { user } = await getUserByIdService(userId);

    if (!user) return next(new AppError("User not found", 404));

    res.status(StatusCodes.OK).json({ user });
});


export const getAllUsersController = catchAsyncError(async (req, res, next) => {
    const { users, pagination } = await getAllUsersService();
    res.status(StatusCodes.OK).json({ users, pagination });
});