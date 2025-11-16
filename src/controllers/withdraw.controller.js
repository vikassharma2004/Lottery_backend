import { User } from "../models/User.model.js";
import { WithdrawRequest } from "../models/withdraw.model.js";
import { AppError } from "../middleware/ErrorHandler.js";
import { catchAsyncError } from "../middleware/CatchAsyncError.js";
import { Notification } from "../models/Notification.js";
import { PaymentHistory } from "../models/Payment.History.js";
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
   let  balanceAfter=user.walletBalance-amount;
    const payment=await PaymentHistory.create({
      user:userId,
      amount,
      method:"upi",
      balanceBefore:user.walletBalance,
      balanceAfter:balanceAfter,
      status:"pending",
      type:"withdrawal",
      referenceId:request._id,
      withdrawId:request.withdrawId
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
export const getAllWithdrawRequests = async (req, res, next) => {
  try {
    const requests = await WithdrawRequest.find()
      .populate("requestedBy", "name email")
      .populate("processedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: requests });
  } catch (err) {
    next(err);
  }
};

// 3. Admin approves/rejects a request
export const processWithdrawRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body; // status = "approved" | "rejected"

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const request = await WithdrawRequest.findById(id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    if (request.status !== "pending") {
      return res.status(400).json({ message: "Request already processed" });
    }

    request.status = status;
    request.note = note || "";
    request.processedBy = req.user._id;
    request.processedAt = new Date();

    await request.save();

    res.status(200).json({ success: true, data: request });
  } catch (err) {
    next(err);
  }
};
export const getUserWithdrawRequests = catchAsyncError(async (req, res, next) => {
  const { userId } = req.user;
  const requests = await WithdrawRequest.find({ requestedBy: userId }).sort({ createdAt: -1 });
  res.status(200).json({ message: "Withdraw requests fetched", success: true, data: requests });
});