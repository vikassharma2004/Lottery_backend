import { User } from "../models/User.model.js";
import { Otp } from "../models/otp.model.js";
import { AppError } from "../middleware/ErrorHandler.js";
export const OtpService = async (email) => {

  // Delete all existing OTPs for this email
  await Otp.deleteMany({ email });

  // Generate new OTP
  const otpCode = generateOTP(6);

  // Save OTP to DB
  const otp = await Otp.create({
    email,
    otp: otpCode,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes expiry
  });

  // TODO: Send OTP via email/SMS
  console.log(`OTP for ${email}: ${otpCode}`);

  return otp;
};
export const VerifyOtpService = async ({ email, otpCode }) => {
  const otpRecord = await Otp.findOne({ email, otp: otpCode });

  if (!otpRecord) throw new AppError("Invalid OTP", 400);
  if (otpRecord.expiresAt < new Date()) throw new AppError("OTP expired", 400);

  // Mark user as verified
  const user = await User.findById(otpRecord.userId);
  if (!user) throw new AppError("User not found", 404);

  user.isVerified = true;
  await user.save();

  // Delete OTP after successful verification
  await Otp.deleteMany({ email });

  return { message: "OTP verified successfully", userId: user._id };
};