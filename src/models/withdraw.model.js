import mongoose, { Schema } from "mongoose";

const WithdrawRequestSchema = new Schema(
  {
    requestedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },
    processedBy: { type: Schema.Types.ObjectId, ref: "User" }, // admin who processed
    processedAt: { type: Date },
    note: { type: String } // optional note by admin
  },
  { timestamps: true }
);

export const WithdrawRequest = mongoose.model("WithdrawRequest", WithdrawRequestSchema);
