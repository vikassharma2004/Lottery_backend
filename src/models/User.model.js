import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// ==================== USER SCHEMA ====================
const userSchema = new mongoose.Schema({


  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true 
  },

  phone: { 
    type: String,  
    unique: true, 
    match: /^[0-9]{10}$/ 
  },

  password: { 
    type: String,
    required: true,
    minLength: 6,
  },

  referralCode: { 
    type: String, 
    unique: true,
    sparse: true ,
    default:""
  },
userRole: {
  type: String,
  enum: ["user", "admin"], // only allows "user" or "admin"
  default: "user",
  required: true,
}
,

  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  walletBalance: { type: Number, default: 0, min: 0 },

  isVerified: { type: Boolean, default: false },

  // 🚀 New fields
  hasPaid: { type: Boolean, default: false },  // true after first successful payment
  ticketCount: { type: Number, default: 0, min: 0 }, // total tickets purchased
  lastPaymentDate: { type: Date }, // track when last payment was made,
  isSuspended: { type: Boolean, default: false },

}, { timestamps: true });

// Hash password before save
userSchema.pre("save", async function(next) {
  if (this.isModified("password") && this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});
// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};
export const User=mongoose.model("User", userSchema);