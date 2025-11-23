// models/PaymentVerification.js
import mongoose from "mongoose";


const paymentVerificationSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    utrId: { type: String, required: true },
    proofImageUrl: { type: String, required: true },
    publicId: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    adminNote: { type: String },
  },
  { timestamps: true }
);

paymentVerificationSchema.index({ status: 1, email: 1, createdAt: -1, proofImageUrl: 1 });
export default mongoose.model("PaymentVerification", paymentVerificationSchema);
