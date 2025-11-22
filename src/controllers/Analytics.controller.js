
import { catchAsyncError } from "../middleware/CatchAsyncError.js"
import { PaymentHistory } from "../models/Payment.History.js";
import { User } from "../models/User.model.js";
import { WithdrawRequest } from "../models/withdraw.model.js";
import { Payment } from "../models/payment.model.js";
import { AppError } from "../middleware/ErrorHandler.js";
export const getStats = catchAsyncError(async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      throw new AppError("Access denied. Admins only.", 403);
    }

    // RUN ALL QUERIES IN PARALLEL
    const [
      totalWithdrawAgg,
      activeUsersCount,
      pendingRequestsCount,
      totalDepositsAgg
    ] = await Promise.all([

      // 1️⃣ Total Withdrawals Amount (type=withdrawal + status=completed)
      PaymentHistory.aggregate([
        { $match: { type: "withdrawal", status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),

      // 2️⃣ Active users count
      User.countDocuments(),

      // 3️⃣ Pending withdrawal requests
      WithdrawRequest.countDocuments({ status: "pending" }),

      // 4️⃣ Total deposits amount
      PaymentHistory.aggregate([
        { $match: { type: "deposit", status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    const totalWithdrawals =
      totalWithdrawAgg.length > 0 ? totalWithdrawAgg[0].total : 0;

    const paymentsProcessed =
      totalDepositsAgg.length > 0 ? totalDepositsAgg[0].total : 0;

    res.status(200).json({
      success: true,
      stats: {
        totalWithdrawals,     // total completed withdrawals amount
        activeUsers: activeUsersCount,
        pendingRequests: pendingRequestsCount,
        paymentsProcessed,    // total completed deposits amount
      },
    });

  } catch (err) {
    next(err);
  }
});


export const getAnalytics = catchAsyncError(async (req, res, next) => {
 
        const { role } = req.user;
          if (role !== "admin") {
              return next(new AppError("Access denied. Admins only.", 403));
          }
  try {
    // RUN ALL ANALYTICS IN PARALLEL
    const [
      withdrawalStats,
      userStats,
      paymentStatusStats,
      recentTransactions
    ] = await Promise.all([

      /* 1️⃣ MONTHLY WITHDRAWALS (Amount + Count) */
      PaymentHistory.aggregate([
        { $match: { type: "withdrawal", status: "completed" } },
        {
          $group: {
            _id: { month: { $month: "$createdAt" } },
            amount: { $sum: "$amount" },
            count: { $sum: 1 },
          }
        },
        { $sort: { "_id.month": 1 } }
      ]),

      /* 2️⃣ MONTHLY USERS (New + Active) */
      User.aggregate([
        {
          $group: {
            _id: { month: { $month: "$createdAt" } },
            new: { $sum: 1 }, // new users
            // If active logic needed -> modify here
            active: { $sum: 1 }
          },
        },
        { $sort: { "_id.month": 1 } }
      ]),

      /* 3️⃣ PAYMENT STATUS DISTRIBUTION (Pie Chart Data) */
      Payment.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 }
          }
        }
      ]),

      /* 4️⃣ RECENT TRANSACTIONS (Latest payments) */
      Payment.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .select("amount type status createdAt userId")
        .populate("userId", "name email"),

    ]);

    // FORMAT PAYMENT STATUS COLORS FOR FRONTEND
    const statusColorMap = {
      success: "#10b981",
      pending: "#f59e0b",
      failed: "#ef4444",
    };

    const formattedPaymentStatus = paymentStatusStats.map((s) => ({
      name: s._id,
      value: s.count,
      color: statusColorMap[s._id] || "#6b7280",
    }));

    res.status(200).json({
      success: true,
      withdrawalData: withdrawalStats.map((m) => ({
        month: getMonthName(m._id.month),
        amount: m.amount,
        count: m.count,
      })),

      usersData: userStats.map((m) => ({
        month: getMonthName(m._id.month),
        new: m.new,
        active: m.active,
      })),

      paymentsData: formattedPaymentStatus,

      recentTransactions,
    });

  } catch (err) {
    next(err);
  }
});

// Helper Function to Convert Month Number → Name
function getMonthName(month) {
  return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][month - 1];
}


