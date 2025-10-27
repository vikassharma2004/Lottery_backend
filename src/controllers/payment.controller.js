import { catchAsyncError } from "../middleware/CatchAsyncError.js";
import { Payment } from "../models/payment.model.js";
import { User } from "../models/User.model.js";
import { createRazorpayOrderService } from "../services/payment.service.js";
import { Notification } from "../models/Notification.js";
import { AppError } from "../middleware/ErrorHandler.js";
import crypto from "crypto";
import { PaymentHistory } from "../models/Payment.History.js";
export const createRazorpayOrderController = catchAsyncError(async (req, res, next) => {
    const { userId } = req.user; // from auth middleware
    const amount = 500; // or dynamic from req.body.amount if needed

    const responseData = await createRazorpayOrderService({ userId, amount });

    res.status(201).json(responseData);
});
export const verifyRazorpayPaymentController = catchAsyncError(async (req, res, next) => {
    const { userId } = req.user; // from auth middleware
    const { razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

    if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
        throw new AppError("Missing payment verification fields", 400);
    }

    // Validate user
    const user = await User.findById(userId);
    if (!user) throw new AppError("User not found", 404);

    // Generate expected signature
    const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET) // always use _KEY_SECRET
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");

    // Compare signatures
    if (generatedSignature !== razorpaySignature) {
        // Update payment as failed
        await Payment.findOneAndUpdate(
            { razorpayOrderId },
            { status: "failed" },
            { new: true }
        );
        await PaymentHistory.findOneAndUpdate(
            { referenceId: razorpayOrderId },
            { status: "failed" },
            { new: true }
        );
        throw new AppError("Payment verification failed", 400);
    }

    // Find the related payment record
    const paymentRecord = await PaymentHistory.findOne({ referenceId: razorpayOrderId });
    if (!paymentRecord) return res.status(404).json({ message: "Payment not found" });
    paymentRecord.status = "completed";
    await paymentRecord.save();

    // Update payment record as success
    const payment = await Payment.findOne({ razorpayOrderId });
    if (!payment) throw new AppError("Payment record not found", 404);

    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.status = "success";
    await payment.save();
    user.hasPaid = true;
    user.ticketCount += 1;
    if (user.referredBy != null || user.referredBy != undefined) {
        const referrer = await User.findById(user.referredBy);
        if (referrer) {
            referrer.successfulReferrals += 1;
            referrer.walletBalance += 100; // Referral bonus
            await referrer.save();
        }
       await  Notification.create({
            userId: referrer._id,
            type:"referral",
            message: `You earned ₹100 for a successful referral!`,
        });
    }
    await user.save();

    return res.status(200).json({
        success: true,
        message: "Payment verified successfully",
        paymentId: razorpayPaymentId,
        user
    });
});