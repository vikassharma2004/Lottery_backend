
import { User } from "../models/User.model.js";
import { AppError } from "../middleware/ErrorHandler.js";
import { generateToken } from "../utils/auth.utils.js";
import { generateOTP } from "../utils/otp.js";
import { ResetPassword } from "../models/reset.model.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Otp } from "../models/otp.model.js";
import { sendEmail } from "../config/nodemailer.config.js";
import { Session } from "../models/session.model.js";
import mongoose from "mongoose";
import { CreateOtpService } from "./otp.service.js";


export const loginService = async ({ email, password, deviceName, platform, timezone,res,req }) => {
  // 1️⃣ Find user
  const user = await User.findOne({ email })
  if (!user) throw new AppError("Account not found", 404);
  if (user.isSuspended) throw new AppError("Account suspended. Contact support.", 403);

  // 2️⃣ Verify password
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) throw new AppError("Incorrect password", 401);
  if (!user.isVerified) {
    let type = "verifyEmail"
    await CreateOtpService(email, type)
   return res.status(400).json({ message: "Email not verified",email:user.email });
  }
  // 3️⃣ Generate JWT token
  const token = await generateToken(user); // returns string token

  // 4️⃣ Create session ONLY for admin
  if (user.userRole === "admin") {
    const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days from now

    const session = await Session.create({
      userId: user._id,
      jwtToken: token,
      ipAddress: "Unknown",
      deviceName,
      platform,
      timezone,
      expiresAt,
      valid: true
    });

    await session.save();
    await sendEmail({
      to: email,
      subject: "New Admin Login Detected",
      html: `
        <!DOCTYPE html>
        <html>
            <body>
                <h2>New Login Detected</h2>
                <p>Hello, ${user.email}</p>
                <p>A new login to your admin account was detected. Here are the details:</p>
                <ul>
                    <li><b>Device Name:</b> ${deviceName}</li>
                    <li><b>Platform:</b> ${platform}</li>
                    <li><b>Timezone:</b> ${timezone}</li>
                    <li><b>Login Time:</b> ${session.createdAt}</li>
                </ul>
                <p>If this was you, you can safely ignore this message. Otherwise, please revoke your sessions immediately.</p>
                <hr/>
                <p style="font-size:12px; color:gray;">
                    © ${new Date().getFullYear()} YourAppName. All rights reserved.
                </p>
            </body>
        </html>
        `
    });

  }
  // 5️⃣ Return token and user info
  const safeUser = {
    id: user._id,
    email: user.email,
    role: user.userRole,
    referralCode: user.referralCode || null,
    referralCount: user.referralCount,
    successfulReferrals: user.successfulReferrals,
    walletBalance: user.walletBalance,
    isVerified: user.isVerified,
    hasPaid: user.hasPaid,
    ticketCount: user.ticketCount,
    isSuspended: user.isSuspended,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
  return {
    token,
    user: safeUser // convert mongoose doc to plain object
  };
};

export const RegisterService = async ({ email, password, referralCode }) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1️⃣ Check if user exists
    const existingUser = await User.findOne({ email }).session(session);
    if (existingUser) throw new AppError("Account already exists", 409);

    // 2️⃣ Create new user
    let user = await User.create([{ email, password, isVerified: false }], { session });
    user = user[0];

    // 3️⃣ Handle referral code
    if (referralCode) {
      const referrer = await User.findOne({ referralCode }).session(session);
      if (!referrer) throw new AppError("Invalid referral code", 404);
      if (!referrer.hasPaid) throw new AppError("Referrer has not paid", 400);

      user.referredBy = referrer._id;
      referrer.referralCount = (referrer.referralCount || 0) + 1;
      await referrer.save({ session });
    }

    await user.save({ session });

    // 4️⃣ Remove existing OTPs
    await Otp.deleteMany({ email }).session(session);

    // 5️⃣ Generate new OTP
    const otpCode = generateOTP(6);
    await Otp.create(
      [
        {
          email,
          otp: otpCode,
          type: "verifyEmail",
          userId: user._id,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        },
      ],
      { session }
    );

    // 6️⃣ Commit transaction
    await session.commitTransaction();

    // 7️⃣ Send email outside transaction
    await sendEmail({
      to: email,
      subject: "OTP Verification - Valid for 5 Minutes",
      html: `
        <html>
          <body>
            <h2>Email Verification</h2>
            <p>Hello,</p>
            <p>Please use the following OTP to verify your email. Valid for 5 minutes.</p>
            <h1>${otpCode}</h1>
            <p>If you did not request this, ignore this email.</p>
            <hr/>
            <p style="font-size:12px; color:gray;">
              © ${new Date().getFullYear()} YourAppName. All rights reserved.
            </p>
          </body>
        </html>
      `,
    });

    return { success: true, message: "OTP sent successfully" };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const getProfile = async (userId) => {
  const user = await User.findById(userId).populate("referredBy", "email").select("-password");
  if (!user) throw new AppError("User not found", 404)
  return {
    user
  }
}

export const LogoutService = async (res) => {
  // Clear cookie on client
  res.cookie("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
    maxAge: 0,
  });

  return { message: "Logged out successfully" };
};

export const generateResetToken = async (email) => {
  const user = await User.findOne({ email });
  if (!user) throw new AppError("User not found", 404);
if(!user.isVerified){
  throw new AppError("Email not verified. Cannot reset password.", 400);
}
  // Delete previous unused tokens
  await ResetPassword.deleteMany({ userId: user._id, used: false });

  // Generate random token
  const resetToken = generateOTP(6);


  // Save token to DB
  const resetRecord = await ResetPassword.create({
    userId: user._id,
    resetToken,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min expiry
  });
  await resetRecord.save();
  // Return **plain token** to send via email
  await sendEmail({
    to: email,
    subject: "Password Reset - Valid for 10 Minutes",
    html: `
      <!DOCTYPE html>
      <html>
       <body>
  <h2>Password Reset Request</h2>
  
  <p>
    You requested to reset your password. Here is your OTP for verification:
  </p>

  <h3 style="color:#2b6cb0;">${resetToken}</h3>

  <p>
    This OTP is <b>valid for 10 minutes</b>.
  </p>

  <p>
    If you didn’t request a password reset, please ignore this email.
  </p>

  <hr/>
  <p style="font-size:12px; color:gray;">
    © ${new Date().getFullYear()} SpinShare. All rights reserved.
  </p>
</body>

      </html>
    `,
  });
  return { message: " Reset Email sent successfully" }
}
export const resetPassword = async ({ token, newPassword,userId }) => {
  // 1. Find the reset record by token (unused)
  const resetRecord = await ResetPassword.findOne({ used: false,userId});
  if (!resetRecord) throw new AppError("Invalid or expired token", 400);

  if( resetRecord.resetToken != token){
    throw new AppError("Invalid otp", 400);
  }
  // 3. Check token expiry
  if (new Date() > resetRecord.expiresAt) {
    throw new AppError("Token expired", 400);
  }

  // 4. Find user by userId in resetRecord
  const user = await User.findById(resetRecord.userId);
  if (!user) throw new AppError("User not found", 404);

  // 5. Update password
  user.password = newPassword; // hashed by pre-save hook
  await user.save();

  // 6. Mark token as used
  resetRecord.used = true;
  await resetRecord.save();

  return { message: "Password reset successfully" };
};
export const changePassword = async ({ oldPassword, newPassword, userId }) => {

  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);
  const isPasswordCorrect = await user.comparePassword(oldPassword);
  if (!isPasswordCorrect) throw new AppError("Incorrect password", 401);
  user.password = newPassword;
  await user.save();
  return { message: "Password changed successfully" };
}
