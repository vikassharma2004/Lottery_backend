// utils/authUtils.js
import jwt from "jsonwebtoken";
import { configDotenv } from "dotenv";
import { AppError } from "../middleware/ErrorHandler.js";
import logger from "../config/logger.js";
configDotenv()

export const generateToken = async (user, options = {}) => {
  if (!user || !user._id) throw new AppError("User object with _id is required");

  const payload = {
    id: user._id,
    email: user.email,
    role: user.userRole,
    referralCode: user.referralCode || null,

  };

  const token = await jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });

  return token;
};


export const setTokenCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("token", token, {
    httpOnly: true,                 // ALWAYS true (don’t be reckless)
    secure: isProduction,           // only true in production
    sameSite: isProduction ? "none" : "lax",  // mobile/web cross-origin only in prod
    path: "/",
    domain:".spinshare.in",
    maxAge: 21 * 24 * 60 * 60 * 1000,
  });
};

