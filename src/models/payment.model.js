import mongoose from "mongoose";
import { generateReferralCode } from "../utils/otp.js";

const paymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: "INR" },

    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: { type: String, unique: true, sparse: true },

    status: { type: String, enum: ["pending", "success", "failed"], default: "pending" },

    // Optional: store payment method/details
    paymentMethod: { type: String }, // card, wallet, etc.
    walletUsed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// 🔥 Post-save hook: update user after successful payment
paymentSchema.post("save", async function (doc) {
  if (doc.status === "success") {
    const User = mongoose.model("User");
    const user = await User.findById(doc.userId);

    if (user) {
      // Generate referral code only after first successful payment
      if (!user.referralCode) {
        const code = generateReferralCode();
        user.referralCode = code;
      }

      user.hasPaid = true;
      user.lastPaymentDate = new Date();
      user.ticketCount += 1;

      await user.save();
    }
  }
});

export const Payment = mongoose.model("Payment", paymentSchema);
