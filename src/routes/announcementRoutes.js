import express from "express";
import { 
  createAnnouncement,
  getActiveAnnouncements,
  toggleAnnouncementStatus
} from "../controllers/announcementController.js";
import { isAuthenticated } from "../middleware/Authenticated.js";

const announcementRouter = express.Router();




announcementRouter.route("/").post(isAuthenticated,createAnnouncement)
announcementRouter.route("/").get(getActiveAnnouncements);
announcementRouter.route("/:id/toggle").post(isAuthenticated,toggleAnnouncementStatus)







export default announcementRouter