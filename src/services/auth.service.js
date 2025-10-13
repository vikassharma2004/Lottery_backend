
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


export const loginService = async ({ email, password, deviceName, platform, timezone }) => {
  // 1️⃣ Find user
  const user = await User.findOne({ email });
  if (!user) throw new AppError("Account not found", 404);
  if (!user.isVerified) throw new AppError("User email not verified", 403);
  if (user.isSuspended) throw new AppError("Account suspended. Contact support.", 403);

  // 2️⃣ Verify password
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) throw new AppError("Incorrect password", 401);

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
  return {
    token,
    user: {
      id: user._id,
      email: user.email,
      phone: user.phone,
      role: user.userRole,
    },
  };
};





export const RegisterService = async ({ email, password, referralCode }) => {
  // Start a session
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check if user already exists (inside session)
    let user = await User.findOne({ email }).session(session);
    if (user) {
      throw new AppError("Account already exists", 409);
    }

    if (!user) {
      // Create new temporary user
      user = await User.create(
        [
          { email, password, isVerified: false }
        ],
        { session } // make creation part of transaction
      );
      user = user[0]; // create returns an array when using array syntax

      // Assign referrer if referral code is provided
      if (referralCode) {
        const referrer = await User.findOne({ referralCode }).session(session);
        if (!referrer) {
          throw new AppError("Invalid referral code", 404);
        }
        if (!referrer.hasPaid) {
          throw new AppError("Referrer has not paid", 400);
        }
        user.referredBy = referrer._id;
        await user.save({ session });
      }
    }

    // Delete all existing OTPs for this email
    await Otp.deleteMany({ email }).session(session);

    // Generate new OTP
    const otpCode = generateOTP(6);

    // Save OTP to DB
    await Otp.create(
      [
        {
          email,
          otp: otpCode,
          userId: user._id,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        }
      ],
      { session }
    );

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Send OTP email **outside transaction**
    console.log(`OTP for ${email}: ${otpCode}`);
    await sendEmail({
      to: email,
      subject: "OTP Verification - Valid for 5 Minutes",
      html: `
        <!DOCTYPE html>
        <html>
          <body>
            <h2>Email Verification</h2>
            <p>Hello,</p>
            <p>
              Please use the following One-Time Password (OTP) to verify your email
              address. This code is <b>valid for only 5 minutes</b>.
            </p>
            <h1>${otpCode}</h1>
            <p>If you did not request this verification, please ignore this email.</p>
            <br/>
            <p>Thank you,<br/>The YourAppName Team</p>
            <hr/>
            <p style="font-size:12px; color:gray;">
              © ${new Date().getFullYear()} Lottery. All rights reserved.
            </p>
          </body>
        </html>
      `,
    });

    return { success: true, message: "OTP sent successfully" };
  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const getProfile = async (userId) => {
  const user = await User.findById(userId).populate("referredBy");
  if (!user) throw new AppError("User not found", 404)
  return {
    user: {


      id: user._id,
      email: user.email,
      phone: user.phone,
      role: user.userRole,
      referredBy: user.referredBy,
      isVerified: user.isVerified,
      payment: user.hasPaid,
      refferalCode: user.referralCode,
      walletBalance: user.walletBalance,
      ticket: user.ticketCount
    }
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

  // Delete previous unused tokens
  await ResetPassword.deleteMany({ userId: user._id, used: false });

  // Generate random token
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Hash token before saving
  const hashedToken = await bcrypt.hash(resetToken, 10);

  // Save token to DB
  const resetRecord = await ResetPassword.create({
    userId: user._id,
    resetToken: hashedToken,
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
            You requested to reset your password. This link is <b>valid for 10 minutes</b>.
          </p>

          <p>
            Click the link below to reset your password:
          </p>

          <p>
            <a href="${resetToken}">Reset Password</a>
            <p>"${resetToken}"</p>
          </p>

          <p>
            If you did not request a password reset, please ignore this email.
          </p>

          <hr/>
          <p style="font-size:12px; color:gray;">
            © ${new Date().getFullYear()} YourAppName. All rights reserved.
          </p>
        </body>
      </html>
    `,
  });
  return { message: " Reset Email sent successfully" }
}
export const resetPassword = async ({ token, newPassword }) => {
  console.log({ token, newPassword });
  // 1. Find the reset record by token (unused)
  const resetRecord = await ResetPassword.findOne({ used: false });
  if (!resetRecord) throw new AppError("Invalid or expired token", 400);
  //   console.log(resetRecord);

  // 2. Compare token (hashed in DB)
  console.log(token, resetRecord.resetToken);
  const isValid = await bcrypt.compare(token, resetRecord.resetToken);
  if (!isValid) throw new AppError("Invalid or expired token", 400);
  console.log(isValid);

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
