import express from "express";
import { isAuthenticated } from "../middleware/Authenticated.js";
import { GetPaymentHistoryController } from "../controllers/paymenthistory.js";
const PaymentRouter = express.Router();


// Other routes can be added here
PaymentRouter.route("/history").get(isAuthenticated, GetPaymentHistoryController);




export default PaymentRouter;
