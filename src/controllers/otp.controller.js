import { catchAsyncError } from "../middleware/CatchAsyncError.js";
import { CreateOtpService, VerifyOtpService } from "../services/otp.service.js";
import { AppError } from "../middleware/ErrorHandler.js";
export const VerifyOtp = catchAsyncError(async (req, res, next) => {
    const { email, otp,type } = req.body
    console.log(req.body);
    if(!type || req.body == "undefined" || !type.trim()) {
        throw new AppError("Please enter type", 400);
    }
    if (!email || !otp || req.body == "undefined" || !email.trim() ) {
        return next(new AppError("Please enter email and otp", 400));
    }
    const { message, userId } = await VerifyOtpService({ email, otpCode: otp,type });
    res.status(200).json({ message, userId })
})
export const CreateOtp = catchAsyncError(async (req, res, next) => {
    const { email,type } = req.body;
    console.log(req.body);
    if (!email || req.body == "undefined" || !email.trim()) {
        return next(new AppError("Please enter email", 400));
    }
    if(!type || req.body == "undefined" || !type.trim()) {
        return next(new AppError("Please enter type", 400));
    }
    const { message } = CreateOtpService(email,type);
    return res.status(200).json({ message })
})