import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// ==================== USER SCHEMA ====================
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    default: ""
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  phone: {
    type: String,
    match: /^[0-9]{10}$/, // validate format
    default: undefined      // optional
  }
  ,
  password: {
    type: String,
    required: true,
    minLength: 6,
  },
  referralCode: {
    type: String,
    sparse: true, // harmless to keep
    minlength: 8,
    maxlength: 8,
    default: null,
  },


  userRole: {
    type: String,
    enum: ["user", "admin"], // only allows "user" or "admin"
    default: "user",
    required: true,
  }
  ,

  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  referralCount: { type: Number, default: 0 },    // total signups using this user's code
  successfulReferrals: { type: Number, default: 0 }, // total who also made payment
  walletBalance: { type: Number, default: 0, min: 0 },

  isVerified: { type: Boolean, default: false },
fraudPaymentCount: {
  type: Number,
  default: 0,
},
  // 🚀 New fields
  hasPaid: { type: Boolean, default: false },  // true after first successful payment
  ticketCount: { type: Number, default: 0, min: 0 }, // total tickets purchased
  lastPaymentDate: { type: Date }, // track when last payment was made,
  isSuspended: { type: Boolean, default: false },

}, { timestamps: true });

userSchema.index({ hasPaid: 1 });
userSchema.index({ referredBy: 1 ,isSuspended: 1});
userSchema.index({ createdAt: 1 });

// Hash password before save
userSchema.pre("save", async function (next) {
  if (this.isModified("password") && this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});
// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};
export const User = mongoose.model("User", userSchema);