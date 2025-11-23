import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import { AppError } from "./ErrorHandler.js";
import { User } from "../models/User.model.js";
// console.log(process.env.JWT_SECRET);
export const isAuthenticated = async (req, res, next) => {
  try {
    let token =
      req.cookies?.token ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : null);

    if (!token)
      return next(
        new AppError("Session expired", StatusCodes.UNAUTHORIZED)
      );

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
   


    if (!user)
      return next(new AppError("User no longer exists. Please login again.", StatusCodes.UNAUTHORIZED));

    if (user.isSuspended)
      return next(
        new AppError("Account suspended. Contact support.", StatusCodes.FORBIDDEN)
      );

    req.user = {
      userId: user._id,
      name:user.name,
      email: user.email,
      role: user.userRole,
      hasPaid:user.hasPaid,
      isVerified: user.isVerified,
      isSuspended: user.isSuspended,
    };

    next();
  } catch (err) {
    return next(
      new AppError("Invalid or expired token.", StatusCodes.UNAUTHORIZED)
    );
  }
};

