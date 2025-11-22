import { PaymentHistory } from "../models/Payment.History.js";
import { catchAsyncError } from "../middleware/CatchAsyncError.js";
import { AppError } from "../middleware/ErrorHandler.js";

export const GetPaymentHistoryController = catchAsyncError(async (req, res, next) => {
  const userId = req.user?.userId; // from auth middleware


  // Pagination params
  let { page = 1, limit = 10, status } = req.query;

  page = parseInt(page, 10);
  limit = parseInt(limit, 10);

  if (isNaN(page) || page <= 0) page = 1;
  if (isNaN(limit) || limit <= 0) limit = 10;

  const skip = (page - 1) * limit;

  // ✅ Base query
  const query = { user: userId, deleted: false };

  // ✅ Add status filter only if provided
  if (status && status.trim() !== "") {
    query.status = status;
  }

  // Fetch data
  const [paymentHistories, total] = await Promise.all([
    PaymentHistory.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    PaymentHistory.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / limit);

  res.status(200).json({
    message: "Payment histories fetched successfully",
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
    data: paymentHistories,
  });
});

// export const DeletePaymentHistoryController = catchAsyncError(async (req, res, next) => {
//   const userId = req.user?.userId;
//     const { historyId } = req.params;
//     if (!historyId) {
//         throw new AppError("Payment history ID is required", 400);
//     }
//     const paymentHistory = await PaymentHistory.findOne({ _id: historyId, user: userId });
//     if (!paymentHistory) {
//         throw new AppError("Payment history not found", 404);
//     }
//     paymentHistory.deleted = true;
//     await paymentHistory.save();
//     res.status(200).json({ message: "Payment history deleted successfully" });
// });