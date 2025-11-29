import { User } from "../models/User.model.js";
import { WithdrawRequest } from "../models/withdraw.model.js";
import { AppError } from "../middleware/ErrorHandler.js";
import { catchAsyncError } from "../middleware/CatchAsyncError.js";
import { Notification } from "../models/Notification.js";
import { PaymentHistory } from "../models/Payment.History.js";
import { ReportIssue } from "../models/report.model.js";
import logger from "../config/logger.js";
// 1. User creates a withdraw request
export const createWithdrawRequest = catchAsyncError(async (req, res, next) => {

  const { amount, upiId } = req.body;
  const { userId } = req.user;
  if (!amount || amount <= 0) {
    throw new AppError("Invalid withdraw amount", 400);
  }

  if (!upiId || typeof upiId !== "string" || upiId.trim() === "") {
    throw new AppError("Invalid UPI ID", 400);
  }
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }
  if (user.walletBalance < amount) {
    throw new AppError("Insufficient wallet balance", 400);
  }



  const request = await WithdrawRequest.create({
    requestedBy: req.user.userId,
    amount,
    upiId
  });
  let balanceAfter = user.walletBalance - amount;
  const payment = await PaymentHistory.create({
    user: userId,
    amount,
    method: "upi",
    balanceBefore: user.walletBalance,
    balanceAfter: balanceAfter,
    status: "pending",
    type: "withdrawal",
    referenceId: request._id,
    withdrawId: request.withdrawId
  })
  await payment.save();

  const notification = await Notification.create({
    userId,
    type: "withdraw",
    message: `Your withdraw request of amount ${amount} has been created and is pending approval.`,
  });

  user.walletBalance -= amount;
  await user.save();
  await notification.save();
  res.status(201).json({ message: "Withdraw request created", data: request });
});

// 2. Admin fetches all withdraw requests
export const getAllWithdrawRequests = catchAsyncError(async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      throw new AppError("Access denied. Admins only.", 403);
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // ----------- Filters -----------
    const filters = {};

    if (req.query.status) filters.status = req.query.status;

    if (req.query.withdrawId) {
      filters.withdrawId = { $regex: req.query.withdrawId, $options: "i" };
    }

    if (req.query.startDate || req.query.endDate) {
      filters.createdAt = {};
      if (req.query.startDate) {
        filters.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        const end = new Date(req.query.endDate);
        end.setHours(23, 59, 59, 999);
        filters.createdAt.$lte = end;
      }
    }

    // Email filter → lookup userIds first
    let userIds = null;
    if (req.query.email) {
      const users = await User.find(
        { email: { $regex: req.query.email, $options: "i" } },
        { _id: 1 }
      ).lean();

      userIds = users.map((u) => u._id);
      filters.requestedBy = { $in: userIds };
    }

    // ----------- Aggregation with $lookup (FASTER THAN POPULATE) -----------
    const withdraws = await WithdrawRequest.aggregate([
      { $match: filters },

      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },

      // Join user info
      {
        $lookup: {
          from: "users",
          localField: "requestedBy",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },

      // Only select needed fields
      {
        $project: {
          _id: 1,
          amount: 1,
          status: 1,
          withdrawId: 1,
          createdAt: 1,
          "user.name": 1,
          "user.email": 1,
        }
      }
    ]);

    // Count faster (no populate, no hydration)
    const total = await WithdrawRequest.countDocuments(filters);

    res.status(200).json({
      message: "Withdraw requests fetched successfully",
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      withdraws,
    });

  } catch (err) {
    next(err);
  }
});



// 3. Admin approves/rejects a request
export const processWithdrawRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    const { role } = req.user;

    if (!id) return next(new AppError('Withdraw ID is required', 400));
    if (role !== 'admin') return next(new AppError('Access denied. Admins only.', 403));
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // 1. get the request first (we need its withdrawId string)
    const request = await WithdrawRequest.findById(id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    // 2. parallel reads now use the correct foreign key
    const [user, paymentHistory] = await Promise.all([
      User.findById(request.requestedBy),
      PaymentHistory.findOne({ withdrawId: request.withdrawId }) // String field
    ]);

    if (!paymentHistory) return res.status(404).json({ message: 'Payment record not found' });

    /* rest of your logic (wallet refund, notifications, etc.) stays identical */
    if (status === 'rejected') {
      user.walletBalance += request.amount;
      await user.save();
      await Notification.insertMany([
        {
          userId: request.requestedBy,
          message: `Your withdraw request of amount ${request.amount} has been rejected by admin. Reason: ${note}`,
          type: 'withdraw'
        },
        {
          userId: request.requestedBy,
          message: 'Your withdraw amount has been refunded to your wallet.',
          type: 'withdraw'
        }
      ]);
    } else {
      await Notification.create({
        userId: request.requestedBy,
        message: `Your withdraw request of amount ${request.amount} has been approved by admin.`,
        type: 'withdraw'
      });
    }

    paymentHistory.status = status === 'approved' ? 'completed' : 'cancelled';
    await paymentHistory.save();

    await request.deleteOne();

    res.status(200).json({ success: true, data: request });
  } catch (err) {
    next(err);
  }
};
export const getWithdrawById = async (req, res) => {
  try {
    const { id } = req.params;

    const withdraw = await WithdrawRequest.findById(id)
      .select(" upiId amount");
    if (!withdraw) {
      return res.status(404).json({ message: "Withdraw request not found" });
    }



    return res.status(200).json({
      withdraw
    });

  } catch (error) {
    logger.error(" Get withdraw by ID error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
export const getUserWithdrawRequests = catchAsyncError(async (req, res, next) => {
  const { userId } = req.user;
  const requests = await WithdrawRequest.find({ requestedBy: userId }).sort({ createdAt: -1 });
  res.status(200).json({ message: "Withdraw requests fetched", success: true, data: requests });
});