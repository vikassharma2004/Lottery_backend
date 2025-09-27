import {User} from "../models/User.model.js"
import {Payment} from "../models/payment.model.js"
export const getPaidUsersCountService = async () => {
  const count = await User.countDocuments({ hasPaid: true });
  return count;
};
export const getUsersByMonthService = async () => {
  // Aggregation to group by month
  const data = await User.aggregate([
    {
      $group: {
        _id: { $month: "$createdAt" }, // group by month number
        count: { $sum: 1 },
      },
    },
    {
      $sort: { "_id": 1 },
    },
  ]);

  // Optional: map month number to month name
  const monthNames = [
    "", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const formatted = data.map(item => ({
    month: monthNames[item._id],
    count: item.count,
  }));

  return formatted;
};
export const getPaymentsByMonthService = async () => {
  const data = await Payment.aggregate([
    {
      $match: { status: "success" } // only successful payments
    },
    {
      $group: {
        _id: { $month: "$createdAt" },
        totalAmount: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id": 1 } },
  ]);

  const monthNames = [
    "", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const formatted = data.map(item => ({
    month: monthNames[item._id],
    totalAmount: item.totalAmount,
    paymentCount: item.count,
  }));

  return formatted;
};