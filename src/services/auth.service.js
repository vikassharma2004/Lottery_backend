
import { User } from "../models/User.model.js";
import { AppError } from "../middleware/ErrorHandler.js";
import { generateToken, setTokenCookie } from "../utils/auth.utils.js";
import { generateOTP } from "../utils/otp.js";
import { ResetPassword } from "../models/reset.model.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Otp } from "../models/otp.model.js";
import { sendEmail } from "../config/nodemailer.config.js";
import mongoose from "mongoose";
import { CreateOtpService } from "./otp.service.js";
import { Notification } from "../models/Notification.js";


export const loginService = async ({ email, password, deviceName, platform, timezone, res, req }) => {
  // 1️⃣ Find user

  const user = await User.findOne({ email }).populate("referredBy", "email");
  if (!user) throw new AppError("Account not found", 404);
  if (user.isSuspended) throw new AppError("Account suspended. Contact support.", 403);

  // 2️⃣ Verify passwo
  const total = await User.countDocuments({ hasPaid: true })
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) throw new AppError("Incorrect password", 401);
  if (!user.isVerified) {
    let type = "verifyEmail"
    await CreateOtpService(email, type)
    return res.status(400).json({ message: "Email not verified", email: user.email });
  }
  // 3️⃣ Generate JWT token
  const token = await generateToken(user); // returns string token
  await setTokenCookie(res, token);

  // 4️⃣ Create session ONLY for admin
  if (user.userRole === "admin") {
  

   
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
                    <li><b>Login Time:</b> ${new Date().toLocaleString()}</li>
                </ul>
                <p>If this was you, you can safely ignore this message. Otherwise, please revoke your sessions immediately.</p>
                <hr/>
                <p style="font-size:12px; color:gray;">
                    © ${new Date().getFullYear()} SpinShare. All rights reserved.
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
    name: user.name,
    role: user.userRole,
    referralCode: user.referralCode || null,
    referralCount: user.referralCount,
    successfulReferrals: user.successfulReferrals,
    walletBalance: user.walletBalance,
    totalPaidUsers: total,
    isVerified: user.isVerified,
    hasPaid: user.hasPaid,
    ticketCount: user.ticketCount,
    isSuspended: user.isSuspended,
    referredBy: user.referredBy ? user.referredBy.email : "",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
  return {
    token,
    user: safeUser // convert mongoose doc to plain object
  };
};

export const RegisterService = async ({ email, password, referralCode, name }) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1️⃣ Check if user exists
    const existingUser = await User.findOne({ email }).session(session);
    if (existingUser) throw new AppError("Account already exists", 409);


    // 2️⃣ Create new user
    let user = await User.create([{ email, password, isVerified: false, name }], { session });
    user = user[0];

    // 3️⃣ Handle referral code
    if (referralCode) {
      const referrer = await User.findOne({ referralCode }).session(session);
      if (!referrer) throw new AppError("Invalid referral code", 404);
      if (!referrer.hasPaid) throw new AppError("Referrer has not paid", 400);

      user.referredBy = referrer._id;
      referrer.referralCount = (referrer.referralCount || 0) + 1;
      await referrer.save({ session });
      await Notification.create({
        userId: referrer._id,
        type: "referral",
        message: `You have a new referral: ${user.name}`,
      })
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
    await  sendEmail({
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
              © ${new Date().getFullYear()} SpinShare. All rights reserved.
            </p>
          </body>
        </html>
      `,
    });

    return { success: true, message: "Account created successfully" };
  } catch (error) {
    await session.abortTransaction();
    throw new AppError(error.message, 500);
  } finally {
    session.endSession();
  }
};

export const getProfile = async (userId) => {
  const user = await User.findById(userId).populate("referredBy", "email").select("-password");
  if (!user) throw new AppError("User not found", 404)
  // 🔹 Embed directly in user object (virtual field style)

  const safeUser = {
    id: user._id,
    email: user.email,
    name: user.name,
    role: user.userRole,
    referralCode: user.referralCode || null,
    referralCount: user.referralCount,
    successfulReferrals: user.successfulReferrals,
    walletBalance: user.walletBalance,
    isVerified: user.isVerified,
    hasPaid: user.hasPaid,
    ticketCount: user.ticketCount,
    isSuspended: user.isSuspended,
    referredBy: user.referredBy ? user.referredBy.email : "",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };

  return {
    user: safeUser
  }
}

export const LogoutService = async (res) => {
  // Clear cookie on client
  res.cookie("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 0,
  });

  return { message: "Logged out successfully", success: true };
};

export const generateResetToken = async (email) => {
  const user = await User.findOne({ email });
  if (!user) throw new AppError("User not found", 404);
  if (!user.isVerified) {
    throw new AppError("Email not verified. Cannot reset password.", 400);
  }
  // Delete previous unused tokens
  await ResetPassword.deleteMany({ email: user.email, used: false });
  // Generate random token
  // Generate random token
  const resetToken = crypto.randomBytes(32).toString("hex");
  // Hash token before saving
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");



  // Save token to DB
  const resetRecord = await ResetPassword.create({
    email: user.email,
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
    You requested to reset your password. Here is your OTP for verification:
  </p>

  <h3 style="color:#2b6cb0;"> ${process.env.FRONTEND_URL}/auth/reset-password/${resetToken}</h3>

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
export const resetPassword = async ({ token, newPassword }) => {
  // 1. Fetch reset record
  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  const resetRecord = await ResetPassword.findOne({
    used: false,
    resetToken: hashedToken,
    expiresAt: { $gt: Date.now() }, // only fetch non-expired
  });

  if (!resetRecord) {
    throw new AppError("Invalid or expired token", 400);
  }





  // 3. Find the user
  const user = await User.findOne({ email: resetRecord.email });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // 4. Update password (your pre-save hook will hash)
  user.password = newPassword;
  await user.save();

  // 5. Mark reset token as used
  resetRecord.used = true;
  await resetRecord.save();

  // 6. Notification
  await Notification.create({
    userId: user._id,
    message: "Your password has been reset successfully.",
  });

  return { message: "Password reset successfully" };
};
export const changePassword = async ({ oldPassword, newPassword, userId }) => {

  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);
  const isPasswordCorrect = await user.comparePassword(oldPassword);
  if (!isPasswordCorrect) throw new AppError("Incorrect password", 401);
  user.password = newPassword;
  await user.save();
  const notification = await Notification.create({
    userId: user._id,
    message: `Your password has been changed successfully.`,
  });
  return { message: "Password changed successfully" };
}
