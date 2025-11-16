import { User } from "../models/User.model.js";
import { AppError } from "../middleware/ErrorHandler.js";
import { catchAsyncError } from "../middleware/CatchAsyncError.js";
import { PaymentHistory } from "../models/Payment.History.js";
export const getReferralSummary = catchAsyncError(async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).select(
      "hasPaid referralCount successfulReferrals referralCode"
    );

    if (!user) {
      throw new AppError("Token invalid", 404);
    }

    // ⛔ YOU WERE DOING IT WRONG
    // referredBy IN YOUR MODEL = ObjectId of parent user
    const referredUsers = await User.find({ referredBy: userId }).select(
      "name email hasPaid createdAt"
    );

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
        referredUsers
      },
    });
  } catch (err) {
    console.log(err);
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
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

