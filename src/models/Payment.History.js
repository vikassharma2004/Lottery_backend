// models/PaymentHistory.js

import mongoose from "mongoose";
import { Schema } from "mongoose";

const PAYMENT_TYPES = ['deposit', 'withdrawal'];
const PAYMENT_STATUS = ['pending', 'completed', 'failed', 'cancelled'];
const PAYMENT_METHODS = ['wallet', 'bank_transfer', 'card', 'upi', 'external_provider'];

// You can expand currency list or use ISO codes validation
const PaymentSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  // deposit | withdrawal
  type: { type: String, enum: PAYMENT_TYPES, required: true },

  // Amount in smallest unit (e.g., cents/paise) to avoid float issues
  amount: { type: Number, required: true, min: 0 },

  currency: { type: String, required: true, default: 'INR' },

  // pending, completed, failed, cancelled
  status: { type: String, enum: PAYMENT_STATUS, required: true, default: 'pending', index: true },

  method: { type: String, enum: PAYMENT_METHODS, required: true },

  

  // snapshot of user's balance before and after this transaction (in smallest unit)
  balanceBefore: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  // Unique external reference (payment gateway id or idempotency key)
  referenceId: { type: String, required: true, unique: true, index: true },

//   // fees (smallest unit)
//   fee: { type: Number, default: 0 },
  deleted: { type: Boolean, default: false, index: true },

}, {
  timestamps: true, // createdAt, updatedA
});

// Compound index for fast per-user history queries
PaymentSchema.index({ user: 1, createdAt: -1 });



export const PaymentHistory = mongoose.model('PaymentHistory', PaymentSchema);
