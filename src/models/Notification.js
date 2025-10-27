import mongoose from "mongoose";
const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  type: {
    type: String,
    enum: ["withdraw", "payment", "ticket", "other","referral","report"],
    default: "other"
  },

  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  read: { type: Boolean, default: false },
}, { timestamps: true });

notificationSchema.index({ userId: 1, read: 1 });

export const Notification = mongoose.model("Notification", notificationSchema);