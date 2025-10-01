import { WithdrawRequest } from "../models/withdraw.model.js";

// 1. User creates a withdraw request
export const createWithdrawRequest = async (req, res, next) => {
  try {
    const { amount, currency } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid withdraw amount" });
    }

    const request = await WithdrawRequest.create({
      requestedBy: req.user.userId,
      amount,
      currency
    });

    res.status(201).json({ success: true, data: request });
  } catch (err) {
    next(err);
  }
};

// 2. Admin fetches all withdraw requests
export const getAllWithdrawRequests = async (req, res, next) => {
  try {
    const requests = await WithdrawRequest.find()
      .populate("requestedBy", "name email")
      .populate("processedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: requests });
  } catch (err) {
    next(err);
  }
};

// 3. Admin approves/rejects a request
export const processWithdrawRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body; // status = "approved" | "rejected"

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const request = await WithdrawRequest.findById(id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    if (request.status !== "pending") {
      return res.status(400).json({ message: "Request already processed" });
    }

    request.status = status;
    request.note = note || "";
    request.processedBy = req.user._id;
    request.processedAt = new Date();

    await request.save();

    res.status(200).json({ success: true, data: request });
  } catch (err) {
    next(err);
  }
};