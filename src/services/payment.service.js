import Razorpay from "razorpay";
import crypto from "crypto";
import { Payment } from "../models/payment.model.js";
import { User } from "../models/User.model.js";
import { AppError } from "../middleware/ErrorHandler.js";
import { razorpayInstance as razorpay } from "../config/razorpayConfig.js";
import { PaymentHistory } from "../models/Payment.History.js";
import { configDotenv } from "dotenv";
configDotenv({path:"../../.env"})

// ------------------- Create Razorpay Order -------------------
export const createRazorpayOrderService = async ({ userId, amount, currency = "INR" }) => {
  const amountInPaise = Math.round(amount * 100); // Razorpay expects paise

  // Fetch user email for prefill
  const user = await User.findById(userId).select("email");
  if (!user) throw new AppError("User not found", 404);

  // Create order in Razorpay
  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency,
    receipt: `rcpt_${Date.now()}`,
    payment_capture: 1, // auto capture payment
    notes: { userId: String(userId) },
  });

  // Save in your Payment collection
  const payment = await Payment.create({
    userId,
    amount,
    currency,
    razorpayOrderId: order.id,
    receipt: order.receipt || `rcpt_${Date.now()}`,
    status: "pending",
    createdAt: new Date(),
  });

  // Record in DB
    await PaymentHistory.create({
      user: userId,
      type: "deposit",
      amount,
      currency: "INR",
      status: "pending",
      method:"upi",
      balanceBefore: user.walletBalance || 0, // assume this exists in User model
      balanceAfter: user.walletBalance || 0,  // not yet updated
      referenceId: order.id,             // razorpay order id
    });
  // Minimal but complete response for React Native
  return {
    message: "Razorpay order created successfully",
    order: {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      status: order.status,
      receipt: order.receipt,
    },
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    prefill: {
      email: user.email,
    },
    paymentId: payment._id,
  };
};




// ------------------- Wallet Deduction Payment -------------------

// ------------------- Get All Payments (Admin) -------------------
// ------------------- Get All Payments with Pagination & Email Filter -------------------
export const getAllPayments = async ({ page = 1, limit = 10, email, ...filters } = {}) => {
  const query = { ...filters };

  // If email filter is provided, we need to filter by user's email
  if (email) {
    query['userId'] = await User.find({ email: { $regex: email, $options: 'i' } }).select('_id');
  }

  const skip = (page - 1) * limit;

  const payments = await Payment.find(query)
    .populate("userId", "name email phone")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Payment.countDocuments(query);

  return {
    payments,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};



