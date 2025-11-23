import mongoose from "mongoose";

const paymentSettingsSchema = new mongoose.Schema({
  qrImage: {
    type: String, // Cloudinary / S3 URL
  },
  upiId: {
    type: String,
    default: ""
  },
  publicId:{
    type: String, // Cloudinary public ID for deletion
    default: ""
  },
  isActive: {
    type: Boolean, default: true
  }
}, { timestamps: true });

export const PaymentSettings = mongoose.model("PaymentSettings", paymentSettingsSchema);
