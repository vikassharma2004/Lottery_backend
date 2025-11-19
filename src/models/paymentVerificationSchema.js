// models/PaymentVerification.js
import mongoose from "mongoose";

const paymentVerificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    email: { type: String, required: true },
    utrId: { type: String, required: true },
    proofImageUrl: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    adminNote: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("PaymentVerification", paymentVerificationSchema);
