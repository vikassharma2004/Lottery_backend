import express from "express";
import { createOrder, createRazorpayOrderController, getOrderStatus, verifyRazorpayPaymentController } from "../controllers/payment.controller.js";
import { isAuthenticated } from "../middleware/Authenticated.js";
import { GetPaymentHistoryController } from "../controllers/paymenthistory.js";
const PaymentRouter = express.Router();

PaymentRouter.route("/order").post(isAuthenticated,createRazorpayOrderController);
PaymentRouter.route("/verify-payment").post(isAuthenticated,verifyRazorpayPaymentController);
// Other routes can be added here
PaymentRouter.route("/history").get(isAuthenticated,GetPaymentHistoryController);
PaymentRouter.route("/HistoryId/delete").patch(isAuthenticated,verifyRazorpayPaymentController);
PaymentRouter.route("/HistoryId/delete").delete(isAuthenticated,verifyRazorpayPaymentController);
PaymentRouter.route("/create-order").post(isAuthenticated,createOrder);
PaymentRouter.route("/status/:orderId").post(isAuthenticated,getOrderStatus);



export default PaymentRouter;
