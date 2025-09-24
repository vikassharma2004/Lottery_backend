import mongoose from "mongoose";

const resetPasswordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    resetToken: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    used: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Optional TTL index to auto-delete expired tokens
resetPasswordSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const ResetPassword = mongoose.model("ResetPassword", resetPasswordSchema);
