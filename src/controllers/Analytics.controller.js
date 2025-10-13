import { getPaidUsersCountService, getPaymentsByMonthService, getUsersByMonthService } from "../services/analytics.service.js";
import {catchAsyncError} from "../middleware/CatchAsyncError.js"
export const getPaidUsersCountController = catchAsyncError(async (req, res, next) => {
  const count = await getPaidUsersCountService();
  res.status(200).json({ paidUsersCount: count });
});
export const getUsersByMonthController = catchAsyncError(async (req, res, next) => {
  const data = await getUsersByMonthService();
  res.status(200).json({ usersByMonth: data });
});
export const getPaymentsByMonthController = catchAsyncError(async (req, res, next) => {
  const data = await getPaymentsByMonthService();
  res.status(200).json({ paymentsByMonth: data });
});

export const gettotalWithdrawalController = catchAsyncError(async (req, res, next) => {
  const data = await gettotalWithdrawalService();
  res.status(200).json({ totalWithdrawal: data });
});