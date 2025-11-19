// controllers/announcementController.js
import Announcement from "../models/announcement.js";

export const createAnnouncement = async (req, res) => {
  try {
    const { title, message, type } = req.body;

    if (!title || !message)
      return res.status(400).json({ message: "Title and message required" });

    const announcement = await Announcement.create({
      title,
      message,
      type,
      createdBy: req.user.userId,
    });

    return res.status(201).json({
      message: "Announcement created",
      data: announcement,
    });
  } catch (err) {
    console.error("Error creating announcement", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getActiveAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find({ isActive: true })
      .sort({ createdAt: -1 });

    return res.json({ announcements });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const toggleAnnouncementStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const ann = await Announcement.findById(id);
    if (!ann) return res.status(404).json({ message: "Not found" });

    ann.isActive = !ann.isActive;
    await ann.save();

    return res.json({
      message: `Announcement ${ann.isActive ? "activated" : "deactivated"}`,
      data: ann,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};
