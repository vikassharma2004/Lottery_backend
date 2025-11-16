import { Notification } from "../models/Notification.js";
import { AppError } from "../middleware/ErrorHandler.js";
export const getNotifications = async (req, res) => {
  try {
    const { userId } = req.user;

    if (!userId) {
      throw AppError("User not found", 404);
    }

    const notifications = await Notification.find({ userId , read: false})
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
     notifications,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
export const markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.user;

   

    const result = await Notification.updateMany(
      { userId, read: false },
      { $set: { read: true } }
    );
    await result.save()


    return res.status(200).json({
      success: true,
      message: "Notifications marked as read",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
