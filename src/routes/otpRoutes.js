import express from "express";
import { CreateOtp, VerifyOtp } from "../controllers/otp.controller.js";
const OtpRouter = express.Router();

OtpRouter.route("/generate").post(CreateOtp);
OtpRouter.route("/verify").post(VerifyOtp);

export default OtpRouter;
