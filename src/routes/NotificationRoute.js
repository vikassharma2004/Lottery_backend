import express from "express";
import { getNotifications, markAllAsRead } from "../controllers/Notification.controller.js";
import { isAuthenticated } from "../middleware/Authenticated.js";
const NotificationRouter = express.Router();

NotificationRouter.route("/all").get(isAuthenticated,getNotifications);
NotificationRouter.route("/mark-read").post(isAuthenticated,markAllAsRead);

export default NotificationRouter;