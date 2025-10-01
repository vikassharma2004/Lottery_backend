import { catchAsyncError } from "../middleware/CatchAsyncError.js";
import { CreateOtpService, VerifyOtpService } from "../services/otp.service.js";

export const VerifyOtp=catchAsyncError(async (req, res, next) => {
    const {email,otp}=req.body
   const {message,userId} =await VerifyOtpService({email,otpCode:otp})
    res.status(200).json({message,userId})
})
export const CreateOtp=catchAsyncError(async(req,res,next)=>{
    const {email}=req.body;
    const {message}=CreateOtpService(email);
    return res.status(200).json({message})
})