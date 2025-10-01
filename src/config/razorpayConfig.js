import Razorpay from "razorpay";
import { configDotenv } from "dotenv";
configDotenv({path:"../../.env"})
// console.log(process.env.RAZORPAY_KEY_ID, process.env.RAZORPAY_KEY_SECRET)
export const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// console.log(razorpayInstance)