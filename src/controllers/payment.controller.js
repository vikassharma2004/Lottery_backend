import { catchAsyncError } from "../middleware/CatchAsyncError.js";
import { Payment } from "../models/payment.model.js";
import { User } from "../models/User.model.js";
import { createRazorpayOrderService } from "../services/payment.service.js";
import { Notification } from "../models/Notification.js";
import { AppError } from "../middleware/ErrorHandler.js";
import crypto from "crypto";
import { PaymentHistory } from "../models/Payment.History.js";
import cashfree from "../config/cashfree.config.js";
import axios from "axios"

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
        await Notification.create({
            userId: user._id,
            type: "payment",
            message: `failed payment of 500`,
        })
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
        await Notification.create({
            userId: referrer._id,
            type: "referral",
            message: `Congrats! You've earned ₹100 in your wallet. ${user.email} has successfully paid for a ticket.`,
        });

    }
    await user.save();

    await Notification.create({
        userId: user._id,
        type: "payment",
        message: `Congrats! You've successfully paid for a ticket. worth ₹500`,
    })
    return res.status(200).json({
        success: true,
        message: "Payment completed",
        paymentId: razorpayPaymentId,
        user
    });
});


export const createOrder = async (req, res) => {
  try {
    const { amount=500 } = req.body;
    const user=req.user

    const request = {
      order_id: "order_" + Date.now(),
      order_amount: amount,
      order_currency: "INR",

      customer_details: {
        customer_id: user?.userId,
        customer_email: user.email,
        customer_phone: user.phone || "9999999999",
        customer_name: user.name,
      },

      order_meta: {
        return_url: `${process.env.FRONTEND_URL}/payment-success?order_id={order_id}`,
        notify_url: `${process.env.BACKEND_URL}/webhook/cashfree`,
      },
    };

    const response = await cashfree.PGCreateOrder(request);
     const order = response.data; // IMPORTANT
     console.log(order)
 // Step 1: Delete all previous pending payments for user
    await Payment.deleteMany({
      userId: user.userId,
      status: "pending",
    });
      await PaymentHistory.deleteMany({
      user: user.userId,
      status: "pending",
      type:"deposit"
    });
   const payment = await Payment.create({
      userId: user.userId,
      amount,
      currency: "INR",
      OrderId: order.order_id,
       paymentMethod: "upi",
      status: "pending",
      createdAt: new Date(),
    });

  // Record in DB
    await PaymentHistory.create({
      user: user.userId,
      type: "deposit",
      amount,
      currency: "INR",
      status: "pending",
      method:"upi",
      balanceBefore: user.walletBalance || 0, // assume this exists in User model
      balanceAfter: user.walletBalance || 0,  // not yet updated
      referenceId:order.order_id,             // razorpay order id
    });
    return res.json({
      success: true,
      order: response.data
    });
  } catch (err) {
    console.log("Cashfree Error:", err.response?.data || err.message);
    return res.status(500).json({
      success: false,
      message: "Unable to create order",
    });
  }
};

export const getOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
const user=req.user.userId;
    if (!orderId) {
      return res.status(400).json({ success: false, message: "Order ID missing" });
    }

    const response = await axios.get(
      `https://sandbox.cashfree.com/pg/orders/${orderId}`,
      {
        headers: {
          "x-client-id": process.env.CASHFREE_CLIENT_ID,
          "x-client-secret": process.env.CASHFREE_CLIENT_SECRET,
          "x-api-version": "2023-08-01",
        },
      }
    );

        if(response.data.order_status=="PAID"){
          const payment = await Payment.findOne({ OrderId: orderId });
          if (payment) {
            payment.status = "success";
            await payment.save();
          }
          const history=await PaymentHistory.findOne({referenceId:orderId})
          if(history){
            history.status="completed"
            await history.save()
          }

        }
        else if(response.data.order_status=="FAILED"){
          const payment = await Payment.findOne({ OrderId: orderId });
          if (payment) {
            payment.status = "failed";
            await payment.save();
          }
          const history=await PaymentHistory.findOne({referenceId:orderId})
          if(history){
            history.status="failed"
            await history.save()
          }
        }
      
        await Notification.create({
          userId: user,
          type: "payment",
          message: `Your payment has been ${response.data.order_status}`,
        })
    return res.json({
      success: true,
      status: response.data.order_status, // PAID, FAILED, PENDING
      order: response.data,
    });
  } catch (err) {
    console.error("Error fetching order:", err?.response?.data || err);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch order",
    });
  }
};