import { catchAsyncError } from "../middleware/CatchAsyncError.js";
import { LogoutService, RegisterService, changePassword, generateResetToken, getProfile, loginService, resetPassword } from "../services/auth.service.js";
import { setTokenCookie } from "../utils/auth.utils.js";
import { StatusCodes, ReasonPhrases } from "http-status-codes";
import { userValidationSchema } from "../validations/user.validation.js";
import { AppError } from "../middleware/ErrorHandler.js";
import jwt from "jsonwebtoken";
import { configDotenv } from "dotenv";
configDotenv();

export const Login = catchAsyncError(async (req, res, next) => {
    const { email, password, deviceInfo } = req.body || {};

    if (!email || !password || req.body == "undefined" || !email.trim() || !password.trim()) {
        return next(new AppError("Please enter email and password", 400));
    }

    const { deviceName, platform, timezone } = deviceInfo || {};
    const { token, user } = await loginService({ email, password, deviceName, platform, timezone ,req,res});

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
    const { email, password, referralCode } = value;
    await RegisterService({ email, password, referralCode });
    return res.status(StatusCodes.CREATED).json({ message: "Account Created verify email" })
})
export const Logout = catchAsyncError(async (req, res, next) => {
    const { message } = await LogoutService(res);
    res.status(200).json({ message });
})
export const ResetToken = catchAsyncError(async (req, res, next) => {
    const { email} = req.body|| {}

    if (!email || req.body == "undefined") {
      throw new AppError("Email is required", 400);
    }
    const { message } = await generateResetToken(email)
    res.status(StatusCodes.OK).json({ message,success:true });
})
export const ResetPassword = catchAsyncError(async (req, res, next) => {
    const { password,otp } = req.body;
const userId=req.user?.userId;
    if (!req.body || Object.keys(req.body).length === 0 || !password) {
        return next(new AppError("Password is required", 400));
    }

    if (!otp) {
        return next(new AppError("OTP is required", 400));
    }

    const { message } = await resetPassword({ token: otp, newPassword: password, userId });
    res.status(StatusCodes.OK).json({ message });
});

export const ChangePassword = catchAsyncError(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  const { userId } = req.user;
   
    if (!oldPassword || !newPassword || !oldPassword.trim() || !newPassword.trim()) {
    return next(new AppError("Password is required", 400));
  }
    if(newPassword.length <6){
        return next(new AppError("password must be at least 6 characters long", 400));
    }
    const { message } = await changePassword({ oldPassword, newPassword, userId });
    res.status(200).json({ message });
})
export const GetProfile = catchAsyncError(async (req, res, next) => {
    const { userId } = req.user;
    const { user } = await getProfile(userId);
    return res.status(StatusCodes.OK).json({ user })
})

export const verifytoken = catchAsyncError(async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        // 1️⃣ Check header exists and starts correctly
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                valid: false,
                message: "No token provided or invalid format",
            });
        }

        // 2️⃣ Extract token from "Bearer <token>"
        const token = authHeader.split(" ")[1];
        if (!token) {
            return res
                .status(StatusCodes.BAD_REQUEST)
                .json({ valid: false, message: "Token not provided" });
        }

        // ✅ Verify JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // You can also attach it to req.user if needed
        req.user = decoded;

        return res.status(StatusCodes.OK).json({
            valid: true,
            message: "Token is valid",
        });
    } catch (err) {
        // Handle invalid or expired token
        return res.status(StatusCodes.UNAUTHORIZED).json({
            valid: false,
            message:
                err.name === "TokenExpiredError"
                    ? "Token has expired"
                    : "Invalid token",
        });
    }
});