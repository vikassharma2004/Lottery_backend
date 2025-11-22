import mongoose from "mongoose";

const paymentSettingsSchema = new mongoose.Schema({
  qrImage: {
    type: String, // Cloudinary / S3 URL
    required: true
  },
  upiId: {
    type: String,
    default: ""
  },
  instructions: {
    type: String,
    default: ""
  },
}, { timestamps: true });

export const PaymentSettings = mongoose.model("PaymentSettings", paymentSettingsSchema);
