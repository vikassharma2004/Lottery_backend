import mongoose, { Schema } from "mongoose";
import { generateWithdrawId } from "../utils/otp.js";

const WithdrawRequestSchema = new Schema(
  {
    requestedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    withdrawId: { type: String, unique: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    upiId: { type: String, required: true }, // ✅ added UPI ID field
    status: {
      type: String,
      enum: ["pending", "approved","Processing", "completed", "cancelled"],
      default: "pending"
    },
    processedBy: { type: Schema.Types.ObjectId, ref: "User" }, // admin who processed
    processedAt: { type: Date },
    note: { type: String } // optional note by admin
  },
  { timestamps: true }
);

// 🔹 Pre-save Hook (ensures uniqueness)
WithdrawRequestSchema.pre("save", async function (next) {
  if (this.isNew && !this.withdrawId) {
    let unique = false;
    let newId;

    while (!unique) {
      newId = await generateWithdrawId();
      const existing = await mongoose.models.WithdrawRequest.findOne({ withdrawId: newId });
      if (!existing) unique = true;
    }
    this.withdrawId = newId;
  }
  next();
});
WithdrawRequestSchema.index({ createdAt: -1 });
WithdrawRequestSchema.index({ status: 1 });
WithdrawRequestSchema.index({ requestedBy: 1 });
// WithdrawRequestSchema.index({ withdrawId: 1 });

export const WithdrawRequest = mongoose.model("WithdrawRequest", WithdrawRequestSchema);
