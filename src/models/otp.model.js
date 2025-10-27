import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false  // optional now
    },
    type: {
      type: String,
      enum: ["login", "resetPassword", "abortsession","verifyEmail"],
      required: true
    },
    email: {
      type: String,
      required: function () { return !this.userId; }, // require email if userId not present
      lowercase: true,
      trim: true
    },

    otp: { type: String, required: true },

    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }  // TTL index auto-deletes expired OTPs
    }
  },
  { timestamps: true }
);

otpSchema.index({ email: 1, expiresAt: 1 });
export const Otp = mongoose.model("Otp", otpSchema);
