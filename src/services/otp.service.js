import { User } from "../models/User.model.js";
import { Otp } from "../models/otp.model.js";
import { AppError } from "../middleware/ErrorHandler.js";
import { sendEmail } from "../config/nodemailer.config.js";
import { generateOTP } from "../utils/otp.js";
export const CreateOtpService = async (email) => {

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

  return {message:"otp send sucessfully"}
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