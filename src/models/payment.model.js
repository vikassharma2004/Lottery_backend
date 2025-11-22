import mongoose from "mongoose";
import { generateReferralCode } from "../utils/otp.js";

const paymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: "INR" },

    OrderId: { type: String, required: true, unique: true },

    status: { type: String, enum: ["pending", "success", "failed"], default: "pending" },

    // Optional: store payment method/details
    paymentMethod: { type: String }, // card, wallet, etc.
  },
  { timestamps: true }
);

paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });

paymentSchema.post("save", async function (doc) {
  if (doc.status !== "success") return;

  const User = mongoose.model("User");
  const user = await User.findById(doc.userId);

  if (!user) return;

  // Only generate referral code once, after first successful payment
  if (!user.referralCode) {
    let code;
    let exists = true;

    // Guarantee unique referral codes even under high concurrency
    while (exists) {
      code = generateReferralCode();
      exists = await User.exists({ referralCode: code });
    }

    user.referralCode = code;
  }

  // Update payment-related flags
  user.hasPaid = true;
  user.lastPaymentDate = new Date();
  user.ticketCount = (user.ticketCount || 0) + 1;

  await user.save();
});
export const Payment = mongoose.model("Payment", paymentSchema);
