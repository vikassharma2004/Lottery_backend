// controllers/announcementController.js
import { AppError } from "../middleware/ErrorHandler.js";
import Announcement from "../models/announcement.js";

export const createAnnouncement = async (req, res) => {
  try {
    const { role } = req.user;
    if (role !== "admin") {
      return next(new AppError("Access denied. Admins only.", 403));
    }
    const { title, message, type } = req.body;


    if (!title || !message)
      return res.status(400).json({ message: "Title and message required" });

    const bannerCount = await Announcement.countDocuments({ type: "banner", isActive: true });
    if (type === "banner" && bannerCount >= 1) {
      throw new AppError("Only one active banner announcement allowed", 400);
    }

    const announcement = await Announcement.create({
      title,
      message,
      type,
      createdBy: req.user.userId,
    });

    return res.status(201).json({
      message: "Announcement created"
    });
  } catch (err) {
    console.error("Error creating announcement", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getAnnouncements = async (req, res) => {
  try {
    let { status } = req.query;
    const { role } = req.user;

    // Default filter = active
    if (!status) status = "active";

    let filter = {};

    // Apply status filter
    if (status === "active") filter.isActive = true;
    else if (status === "inactive") filter.isActive = false;
    else if (status === "all") {
      if (role !== "admin") {
        return res.status(403).json({ message: "Admins only can view all announcements" });
      }
      // no filter applied
    } else {
      return res.status(400).json({ message: "Invalid status filter" });
    }

    const announcements = await Announcement.find(filter)
      .sort({ createdAt: -1 });

    return res.json({ announcements });

  } catch (err) {
    console.error("Error fetching announcements", err);
    return res.status(500).json({ message: "Server error" });
  }
};


export const updateAnnouncement = async (req, res) => {
  try {
    const { role } = req.user;
    if (role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    const { id } = req.params;
    const { title, message, type, isActive } = req.body;

    const ann = await Announcement.findById(id);
    if (!ann) return res.status(404).json({ message: "Announcement not found" });

    // Update fields
    if (title) ann.title = title;
    if (message) ann.message = message;
    if (type) ann.type = type;

    // For now: allow admin to update active status also
    if (typeof isActive === "boolean") {
      ann.isActive = isActive;
    }

    await ann.save();

    return res.json({
      message: "Announcement updated successfully",
      data: ann,
    });

  } catch (err) {
    console.error("Error updating announcement", err);
    return res.status(500).json({ message: "Server error" });
  }
};


export const deleteAnnouncement = async (req, res) => {
  try {
    const { role } = req.user;
    if (role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    const { id } = req.params;

    const ann = await Announcement.findById(id);
    if (!ann) return res.status(404).json({ message: "Announcement not found" });

    // ❌ Prevent deletion of banner type
    if (ann.type === "banner") {
      return res.status(400).json({
        message: "Banner announcements cannot be deleted",
      });
    }

    await ann.deleteOne();

    return res.json({
      message: "Announcement deleted successfully",
    });

  } catch (err) {
    console.error("Error deleting announcement", err);
    return res.status(500).json({ message: "Server error" });
  }
};

