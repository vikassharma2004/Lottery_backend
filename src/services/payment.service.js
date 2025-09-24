import Razorpay from "razorpay";
import crypto from "crypto";
import { Payment } from "../models/payment.model.js";
import { User } from "../models/User.model.js";
import { AppError } from "../middleware/ErrorHandler.js";

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

// ------------------- Create Razorpay Order -------------------
export const createRazorpayOrder = async (userId, amount) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  const options = {
    amount: amount * 100, // convert to paise
    currency: "INR",
    receipt: `receipt_${Date.now()}`,
  };

  const order = await razorpay.orders.create(options);

  // Save order in DB
  const payment = await Payment.create({
    userId,
    amount,
    currency: "INR",
    razorpayOrderId: order.id,
    status: "pending",
  });

  return {
    orderId: order.id,
    amount,
    currency: "INR",
  };
};

// ------------------- Verify Razorpay Payment -------------------
export const verifyRazorpayPayment = async ({ userId, razorpayPaymentId, razorpayOrderId, razorpaySignature }) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  if (generatedSignature !== razorpaySignature) {
    throw new AppError("Payment verification failed", 400);
  }

  // Update Payment record
  const payment = await Payment.findOne({ razorpayOrderId });
  if (!payment) throw new AppError("Payment record not found", 404);

  payment.razorpayPaymentId = razorpayPaymentId;
  payment.status = "success";
  await payment.save();
  await user.save();

  return { message: "Payment verified successfully", paymentId: razorpayPaymentId };
};

// ------------------- Wallet Deduction Payment -------------------
export const payWithWallet = async ({ userId, amount }) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);
  if (user.walletBalance < amount) throw new AppError("Insufficient wallet balance", 400);

  user.walletBalance -= amount;
  user.hasPaid = true;
  user.ticketCount += 1;
  user.lastPaymentDate = new Date();
  await user.save();

  const payment = await Payment.create({
    userId,
    amount,
    currency: "INR",
    razorpayOrderId: "WALLET_" + Date.now(),
    razorpayPaymentId: "WALLET_" + Date.now(),
    status: "success",
    walletUsed: true,
  });

  return { message: "Payment successful via wallet", paymentId: payment._id };
};

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

// ------------------- Get Payments for Specific User with Pagination -------------------
export const getUserPayments = async (userId, { page = 1, limit = 10 } = {}) => {
  const skip = (page - 1) * limit;

  const payments = await Payment.find({ userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Payment.countDocuments({ userId });

  return {
    payments,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

