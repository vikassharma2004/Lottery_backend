import express from "express";
import { isAuthenticated } from "../middleware/Authenticated.js";
import { getReferralSummary, getWalletInfo } from "../controllers/user.controller.js";


const userRouter = express.Router();


// ==================== REFERRAL ROUTES ====================
userRouter.get("/referrals", isAuthenticated, getReferralSummary);


// ==================== WALLET ROUTES ======================
userRouter.get("/wallet", isAuthenticated, getWalletInfo);


export default userRouter;
