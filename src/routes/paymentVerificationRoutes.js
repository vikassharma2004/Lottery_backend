import express from "express";
import {
  submitPaymentProof,
  getPendingPayments,
  verifyPayment
} from "../controllers/paymentVerificationController.js";
import { isAuthenticated } from "../middleware/Authenticated.js";

const paymentVerificationRouter = express.Router();



paymentVerificationRouter.route("/submit").post(isAuthenticated,submitPaymentProof);
paymentVerificationRouter.route("/all").get(isAuthenticated,getPendingPayments);
paymentVerificationRouter.route("/:id/verify").post(isAuthenticated,verifyPayment);









export default paymentVerificationRouter