import { sendEmail } from "../config/nodemailer.config.js";
import { catchAsyncError } from "../middleware/CatchAsyncError.js";
import { AbortSesssionService, AllSessionService } from "../services/session.service.js";
import { generateOTP } from "../utils/otp.js";


export const GetAllSession = catchAsyncError(async (req,res) => {
    const { userId } = req.user;
    console.log(req.user);
    console.log(userId);

  const { session, length } = await AllSessionService({ userId });

    return res.status(200).json({ message: "sesssion fetched", session, length })
})
export const AbortSessionController = catchAsyncError(async (req,res) => {
    const { deviceInfo, sessionId } = req.body;
    const { message } = await AbortSesssionService(sessionId, deviceInfo);
    return res.status(200).json({ message })
})
export const GenerateSessionOtp = catchAsyncError(async () => {
    const otp = generateOTP()
    await sendEmail({
        to: "",
        subject: "",
        html: "",
        text: ""
    })

    return res.status(200).json({ message: "otp send succesfuly" })
})