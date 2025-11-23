import express from "express";
import { 
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncements,
  updateAnnouncement
} from "../controllers/announcementController.js";
import { isAuthenticated } from "../middleware/Authenticated.js";

const announcementRouter = express.Router();
announcementRouter.route("/").post(isAuthenticated,createAnnouncement)
announcementRouter.route("/").get(isAuthenticated,getAnnouncements);
announcementRouter.route("/:id").patch(isAuthenticated,updateAnnouncement);
announcementRouter.route("/:id").delete(isAuthenticated,deleteAnnouncement);








export default announcementRouter