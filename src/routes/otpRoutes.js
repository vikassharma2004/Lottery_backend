import express from "express";
import { VerifyOtp } from "../controllers/otp.controller.js";
const OtpRouter = express.Router();

// OtpRouter.route("/generate").post();
OtpRouter.route("/verify").post(VerifyOtp);

export default OtpRouter;
