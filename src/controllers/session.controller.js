import { sendEmail } from "../config/nodemailer.config.js";
import { catchAsyncError } from "../middleware/CatchAsyncError.js";
import { AbortSesssionService, AllSessionService } from "../services/session.service.js";
import { generateOTP } from "../utils/otp.js";


export const GetAllSession = catchAsyncError(async () => {
    const { userId } = req.user;

    const { session, length } = await AllSessionService(userId);
    return res.status(200).json({ message: "sesssion fetched", session, length })
})
export const AbortSessionController = catchAsyncError(async () => {
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