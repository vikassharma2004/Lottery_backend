import express from "express";
import { createRazorpayOrderController, verifyRazorpayPaymentController } from "../controllers/payment.controller.js";
import { isAuthenticated } from "../middleware/Authenticated.js";
import { GetPaymentHistoryController } from "../controllers/paymenthistory.js";
const PaymentRouter = express.Router();

PaymentRouter.route("/order").post(isAuthenticated,createRazorpayOrderController);
PaymentRouter.route("/verify-payment").post(isAuthenticated,verifyRazorpayPaymentController);
// Other routes can be added here
PaymentRouter.route("/History").get(isAuthenticated,GetPaymentHistoryController);
PaymentRouter.route("/HistoryId/delete").patch(isAuthenticated,verifyRazorpayPaymentController);



export default PaymentRouter;
