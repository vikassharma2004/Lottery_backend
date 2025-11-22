import { User } from "../models/User.model.js";
import { Otp } from "../models/otp.model.js";
import { AppError } from "../middleware/ErrorHandler.js";
import { sendEmail } from "../config/nodemailer.config.js";
import { generateOTP } from "../utils/otp.js";
export const CreateOtpService = async (email, type) => {
  try {
    const UserExists = await User.findOne({ email,isSuspended:false });
    if (!UserExists) {
      throw new AppError("User not found", 404);
    }
   
    if (type === "resetPassword" && !UserExists.isVerified) {
      throw new AppError("Email not verified. Cannot reset password.", 400);
    }

    if (type === "verifyEmail" && UserExists.isVerified) {
      throw new AppError("Email already verified.", 400);
    }

    // Delete all existing OTPs
    await Otp.deleteMany({ email });

    // Generate OTP
    const otpCode = generateOTP(6);

    // Save OTP to database
    await Otp.create({
      email,
      type,
      otp: otpCode,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min expiry
    });

    // Send email
    await sendEmail({
      to: email,
      subject: "OTP Verification - Valid for 5 Minutes",
      html: `
        <h2>Email Verification</h2>
        <p>Your OTP is:</p>
        <h1>${otpCode}</h1>
        <p>This code expires in 5 minutes.</p>
          <p>If you did not request this verification, please ignore this email.</p>
              <br/>
              <p>Thank you,<br/>The SpinShare Team</p>
              <hr/>
              <p style="font-size:12px; color:gray;">
                © ${new Date().getFullYear()} Lottery. All rights reserved.
              </p>
            </body>
      `,
    });

    return { message: "OTP sent successfully" };

  } catch (error) {
    console.error("OTP SERVICE ERROR:", error);
    throw error; // IMPORTANT: pass to controller
  }
};


export const VerifyOtpService = async ({ email, otpCode, type }) => {
  console.log(email, otpCode, type);

  // Include type in the query
  const otpRecord = await Otp.findOne({ email});

  if (!otpRecord) throw new AppError("Invalid OTP", 400);
  if (otpRecord.expiresAt < new Date()) throw new AppError("OTP expired", 400);

if(otpRecord.otp != otpCode) throw new AppError("Invalid otp", 400);
if(otpRecord.type != type) throw new AppError("Invalid otp", 400);

  // Find the user
  const user = await User.findOne({ email: otpRecord.email });
  if (!user) throw new AppError("User not found", 404);

  // Mark as verified
  user.isVerified = true;
  await user.save();

  // Delete all OTPs for this email and type
  await Otp.deleteMany({ email, type });

  return { message: "OTP verified successfully", userId: user._id };
};
