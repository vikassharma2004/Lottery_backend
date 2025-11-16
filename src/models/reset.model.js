import mongoose from "mongoose";

const resetPasswordSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    resetToken: {
      type:String,
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
resetPasswordSchema.index({ email: 1, resetToken: 1 ,used: 1});

export const ResetPassword = mongoose.model("ResetPassword", resetPasswordSchema);
