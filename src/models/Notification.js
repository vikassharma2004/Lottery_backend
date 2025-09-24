import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },

  type: { 
    type: String, 
    enum: ["referral", "payment", "ticket", "other"], 
    default: "other" 
  },

  message: { type: String, required: true }, // text to show user

  relatedUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // optional, e.g. user who used referral

  read: { type: Boolean, default: false }, // has the user seen this notification?

}, { timestamps: true });

export const Notification = mongoose.model("Notification", notificationSchema);
