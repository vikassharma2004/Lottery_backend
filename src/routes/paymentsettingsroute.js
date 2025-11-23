import express from "express";
import { 
  createPaymentSetting,
  updatePaymentSetting,
  deletePaymentSetting,
  getActivePayment,
  getAllPayments
} from "../controllers/paymentsettings.js";

import { isAuthenticated } from "../middleware/Authenticated.js";

const router = express.Router();

router.post("/", isAuthenticated, createPaymentSetting);
router.get("/", isAuthenticated, getAllPayments);
router.get("/active", getActivePayment);

router.patch("/:id", isAuthenticated, updatePaymentSetting);
router.delete("/:id", isAuthenticated, deletePaymentSetting);

export default router;
