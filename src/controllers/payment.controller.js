import { catchAsyncError } from "../middleware/CatchAsyncError.js";
import { createRazorpayOrderService } from "../services/payment.service.js";
export const createRazorpayOrderController = catchAsyncError(async (req, res, next) => {
    const { userId } = req.user; // comes from auth middleware
    let amount = 500;
    const { order, payment,razorpayKeyId } = await createRazorpayOrderService({ userId, amount });

    res.status(201).json({
        message: "Razorpay order created successfully",
        order,     // send Razorpay order_id, amount, currency to frontend
        paymentId: payment._id, // optional: your DB payment ID
        razorpayKeyId
    });
});