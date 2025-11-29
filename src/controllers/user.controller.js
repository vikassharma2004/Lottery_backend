import { User } from "../models/User.model.js";
import { AppError } from "../middleware/ErrorHandler.js";
import { catchAsyncError } from "../middleware/CatchAsyncError.js";
import { PaymentHistory } from "../models/Payment.History.js";
import logger from "../config/logger.js";
export const getReferralSummary = catchAsyncError(async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).select(
      "hasPaid referralCount successfulReferrals referralCode"
    );

    if (!user) {
      throw new AppError("Token invalid", 404);
    }
    let total=await User.find().countDocuments();

    
    const amountEarned = user.successfulReferrals * 100;

    return res.status(200).json({
        message:"Referral summary fetched successfully",
      success: true,
      data: {
        hasPaid: user.hasPaid,
        referCode: user.referralCode,
        totalReferrals: user.referralCount,       // correct field
        successfulReferrals: user.successfulReferrals,
        amountEarned,
       totalUsers:total > 500 ? total : 500

      },
    });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

export const getWalletInfo = catchAsyncError(async (req, res) => {
  try {
    const userId = req.user.userId;

    // Fetch wallet balance
    const user = await User.findById(userId).select("walletBalance");

    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Fetch latest 15 transactions
    const transactions = await PaymentHistory.find({ user:userId })
      .sort({ createdAt: -1 })
      .limit(4);

    return res.status(200).json({
        message:"Wallet fetched successfully",
      success: true,
      wallet: {
        walletBalance: user.walletBalance,
        recentTransactions: transactions,
      },
    });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

