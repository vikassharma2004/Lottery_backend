import express from "express";
const PaymentRouter = express.Router();

PaymentRouter.route("/order").post();
PaymentRouter.route("/verify").post();
PaymentRouter.route("/wallet").post();
PaymentRouter.route("/").get();
PaymentRouter.route("/user/:userId").get();

export default PaymentRouter;
