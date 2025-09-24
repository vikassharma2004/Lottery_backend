import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import { AppError } from "./ErrorHandler.js";
import { User } from "../models/User.model.js";
console.log(process.env.JWT_SECRET);
export const isAuthenticated = async (req, res, next) => {
  try {
    // 1. Get token from cookie or Authorization header
    let token = null;

    if (req.cookies && req.cookies.token) {
      token = req.cookies.token; // if you’re storing in cookies
    }


    if (!token) {
      return next(new AppError("Session Expired", StatusCodes.UNAUTHORIZED));
    }

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Fetch user and attach to request
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return next(new AppError("User not found.", StatusCodes.UNAUTHORIZED));
    }

    if (user.isSuspended) {
      return next(new AppError("Account suspended. Contact support.", StatusCodes.FORBIDDEN));
    }

    req.user = {
      userId: user._id,
      email: user.email,
      role: user.userRole,
      isVerified: user.isVerified,
      isSuspended: user.isSuspended,
    };
    next();
  } catch (err) {
    return next(new AppError("Invalid or expired token.", StatusCodes.UNAUTHORIZED));
  }
};
