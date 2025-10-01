import { catchAsyncError } from "../middleware/CatchAsyncError.js";
import { LogoutService, RegisterService, generateResetToken, getProfile, loginService, resetPassword } from "../services/auth.service.js";
import { setTokenCookie } from "../utils/auth.utils.js";
import { StatusCodes, ReasonPhrases } from "http-status-codes";
import { userValidationSchema } from "../validations/user.validation.js";
import { AppError } from "../middleware/ErrorHandler.js";
export const Login = catchAsyncError(async (req, res, next) => {
    const { email, password ,deviceInfo} = req.body ||{};

    if (!email || !password || req.body == "undefined" || !email.trim() || !password.trim()) {
        return next(new AppError("Please enter email and password", 400));
    }

     const { deviceName, platform, timezone } = deviceInfo || {};
    const { token, user } = await loginService({ email, password, deviceName, platform, timezone });
    
    // await setTokenCookie(res, token);

    res.status(StatusCodes.OK).json({
        message: "Logged in successfully",
        user,
        token
    });
});

export const Register = catchAsyncError(async (req, res, next) => {
    // 1. Validate request body
    const { error, value } = userValidationSchema.validate(req.body, {
        abortEarly: false, // show all errors, not just the first
    });

    if (error) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            errors: error.details.map((err) => err.message), // collect all messages
        });
    }
    // 2. If valid, extract sanitized values
    const { email,  password, referralCode } = value;
    await RegisterService({ email,  password, referralCode });
    return res.status(StatusCodes.CREATED).json({ message: "Account Created verify email" })
})
export const Logout = catchAsyncError(async (req, res, next) => {
    const { message } = await LogoutService(res);
    res.status(200).json({ message });
})
export const ResetToken = catchAsyncError(async (req, res, next) => {
    const { email } = req.body
    if (!email || req.body == "undefined") {
        return next(new AppError("Please enter email", 400));
    }
    const { message } = await generateResetToken(email)
    res.status(StatusCodes.OK).json({ message })
})
export const ResetPassword = catchAsyncError(async (req, res, next) => {
    const { password } = req.body;
    const { token } = req.params;

    if (!req.body || Object.keys(req.body).length === 0 || !password) {
        return next(new AppError("Password is required", 400));
    }

    if (!token) {
        return next(new AppError("Token not found in URL", 400));
    }

    const { message } = await resetPassword({ token, newPassword: password });
    res.status(StatusCodes.OK).json({ message });
});

export const ChangePassword = catchAsyncError(async (req, res, next) => {
    res.status(200).json({ message: "Change Password Success" });
})
export const GetProfile = catchAsyncError(async (req, res, next) => {
    const { userId } = req.user;
    console.log(req.user)
    const { user } = await getProfile(userId);
    return res.status(StatusCodes.OK).json({ user })
})

export const verifytoken=catchAsyncError(async (req, res, next) => {
    const { token } = req.params;
    return res.status(StatusCodes.OK).json({ message })
})