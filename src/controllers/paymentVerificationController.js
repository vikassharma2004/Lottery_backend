// controllers/paymentVerificationController.js
import PaymentVerification from "../models/paymentVerificationSchema.js";

export const submitPaymentProof = async (req, res) => {
  try {
    const { email, utrId, proofImageUrl } = req.body;

    if (!email || !utrId || !proofImageUrl)
      return res.status(400).json({ message: "All fields required" });

    const record = await PaymentVerification.create({
      user: req.user?.userId,
      email,
      utrId,
      proofImageUrl,
    });

    return res.status(201).json({
      message: "Payment verification submitted",
      data: record,
    });
  } catch (err) {
    console.error("Error submitting payment proof", err);
    return res.status(500).json({ message: "Server error" });
  }
};


export const getPendingPayments = async (req, res) => {
    const { role } = req.user;
            if (role !== "admin") {
                return next(new AppError("Access denied. Admins only.", 403));
            }
  try {
    const list = await PaymentVerification.find({ status: "pending" })
      .populate("user", "fullName email")
      .sort({ createdAt: -1 });

    return res.json({ list });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    if (!["approved", "rejected"].includes(status))
      return res.status(400).json({ message: "Invalid status" });

    const record = await PaymentVerification.findById(id);
    if (!record) return res.status(404).json({ message: "Record not found" });

    record.status = status;
    record.adminNote = adminNote || "";
    await record.save();

    return res.json({ message: "Payment updated", record });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};
