// controllers/paymentVerificationController.js
import logger from "../config/logger.js";
import { AppError } from "../middleware/ErrorHandler.js";
import { Notification } from "../models/Notification.js";
import { PaymentHistory } from "../models/Payment.History.js";
import { Payment } from "../models/payment.model.js";
import PaymentVerification from "../models/paymentVerificationSchema.js";
import { User } from "../models/User.model.js";
import { deleteCloudinaryAsset } from "../utils/imageupload.js";
import mongoose from "mongoose";
export const submitPaymentProof = async (req, res) => {
  try {
    const { email,haspaid } = req.user
    const { utrId, proofImageUrl, publicId } = req.body;

    if (!utrId)
      return res.status(400).json({ message: " UTR required" });

    if(haspaid){
      throw new AppError("payment already completed")
    }

    // check if alrady for verification
    const alrady = await PaymentVerification.findOne({ email, status: "pending" });
    if (alrady) {
      return res.status(400).json({ message: "A pending verification already exists for this email" });
    }


    const record = await PaymentVerification.create({
      email,
      utrId,
      proofImageUrl,
      publicId,
      status: "pending"
    });

    return res.status(201).json({
      message: "Payment verification submitted"
    });
  } catch (err) {
    logger.error("Error submitting payment proof", err);
    return res.status(500).json({ message: "Server error" });
  }
};



export const getPendingPayments = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return next(new AppError("Access denied. Admins only.", 403));
    }

    // Pagination
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Date filters
    const { startDate, endDate } = req.query;
    const filter = { status: "pending" };

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate + "T00:00:00.000Z"),
        $lte: new Date(endDate + "T23:59:59.999Z"),
      };
    } else if (startDate) {
      filter.createdAt = { $gte: new Date(startDate + "T00:00:00.000Z") };
    } else if (endDate) {
      filter.createdAt = { $lte: new Date(endDate + "T23:59:59.999Z") };
    }

    // Get paginated list
    const list = await PaymentVerification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Total count (same filter)
    const total = await PaymentVerification.countDocuments(filter);

    return res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      list,
    });

  } catch (err) {
    console.error("Error getting pending payments", err);
    return res.status(500).json({ message: "Server error" });
  }
};


export const verifyPayment = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { id } = req.params;
    const { role } = req.user;
    const { status, adminNote } = req.body;

    if (role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const record = await PaymentVerification.findById(id).session(session);
    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    const user = await User.findOne({ email: record.email }).session(session);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // -----------------------------------
    // REJECTED PAYMENT
    // -----------------------------------
    if (status === "rejected") {
      await Notification.create(
        [
          {
            userId: user._id,
            message: adminNote ? `Payment rejected: ${adminNote}` : "Payment rejected",
            type: "payment",
          },
        ],
        { session }
      );

      await PaymentVerification.deleteOne({ _id: id }, { session });

      await session.commitTransaction();

      // OUTSIDE TRANSACTION
      await deleteCloudinaryAsset(record.publicId);

      return res.json({ message: "Payment rejected" });
    }

    // -----------------------------------
    // APPROVED PAYMENT
    // -----------------------------------
    await Payment.create(
      [
        {
          userId: user._id,
          amount: 500,
          currency: "INR",
          status: "success",
          paymentMethod: "upi",
        },
      ],
      { session }
    );

    await PaymentHistory.create(
      [
        {
          user: user._id,
          type: "deposit",
          amount: 500,
          currency: "INR",
          status: "completed",
          method: "upi",
          balanceBefore: 0,
          balanceAfter: 0,
          referenceId: `VERIF-${record._id}`,
        },
      ],
      { session }
    );

    await Notification.create(
      [
        {
          userId: user._id,
          message: "Payment approved successfully",
          type: "payment",
        },
      ],
      { session }
    );

    await PaymentVerification.deleteOne({ _id: id }, { session });

    await session.commitTransaction();

    // OUTSIDE TRANSACTION
    await deleteCloudinaryAsset(record.publicId);

    return res.json({ message: "Payment approved" });
  } catch (err) {
    logger.error("Verify payment error:", err);

    try {
      await session.abortTransaction();
    } catch (e) {
      // prevent "abort after commit" crash
    }

    return res.status(500).json({ message: "Server error" });
  } finally {
    session.endSession();
  }
};

