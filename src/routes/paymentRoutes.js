import express from "express";
import { createRazorpayOrderController } from "../controllers/payment.controller.js";
import { isAuthenticated } from "../middleware/Authenticated.js";
const PaymentRouter = express.Router();

PaymentRouter.route("/order").post(isAuthenticated,createRazorpayOrderController);
// PaymentRouter.route("/verify").post();
// PaymentRouter.route("/wallet").post();
// PaymentRouter.route("/").get();
// PaymentRouter.route("/user/:userId").get();

export default PaymentRouter;
