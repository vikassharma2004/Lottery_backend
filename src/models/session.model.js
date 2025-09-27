import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  jwtToken: { type: String, required: true },
  ipAddress: { type: String },
  deviceName: { type: String },   // e.g., "Pixel 7", "iPhone 14"
  platform: { type: String },     // Android / iOS
  timezone: { type: String },     // e.g., "Asia/Kolkata"
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true }, // set to 21 days later
  valid: { type: Boolean, default: true } // revoked = false
});

// TTL index — MongoDB will automatically delete expired sessions
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
sessionSchema.index({userId: 1, jwtToken: 1,valid: 1});
export const Session = mongoose.model("Session", sessionSchema);
