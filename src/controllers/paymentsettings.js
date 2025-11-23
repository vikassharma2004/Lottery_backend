import { catchAsyncError } from "../middleware/CatchAsyncError.js";
import { PaymentSettings } from "../models/paymentSettingsSchema.js";
import { deleteCloudinaryAsset, uploadImageToCloudinary } from "../utils/imageupload.js";

export const createPaymentSetting = catchAsyncError(async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admins only" });
  }

  const { upiId, isActive } = req.body;

  // Limit to 2 payment methods
  const totalPayments = await PaymentSettings.countDocuments();
  if (totalPayments >= 2) {
    return res.status(400).json({
      message: "Maximum 2 payment configurations allowed",
    });
  }

  let cloudinaryResponse = null;

  // Handle QR Image Upload (optional)
  if (req.files && req.files.image) {
    const { image } = req.files;

    cloudinaryResponse = await uploadImageToCloudinary({
      file: image,
      folder: "payment-settings",
    });
  }

  // If the new one is active, deactivate all others
  if (isActive) {
    await PaymentSettings.updateMany({}, { isActive: false });
  }

  // Create the payment entry
  const payment = await PaymentSettings.create({
    qrImage: cloudinaryResponse?.url || null,
    publicId: cloudinaryResponse?.public_id || null,
    upiId,
    isActive: Boolean(isActive),
  });

  return res.status(201).json({
    message: "Payment setting created",
    data: payment,
  });
});


export const updatePaymentSetting = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admins only" });
    }

    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({ message: "isActive must be boolean" });
    }

    const pay = await PaymentSettings.findById(id);
    if (!pay) {
      return res.status(404).json({ message: "Pay not found" });
    }

    // If activating -> deactivate all others
    if (isActive === true) {
      await PaymentSettings.updateMany({}, { isActive: false });
      pay.isActive = true;
    }

    // If deactivating -> prevent removing the last active one
    if (isActive === false) {
      const activeCount = await PaymentSettings.countDocuments({ isActive: true });

      if (activeCount === 1 && pay.isActive) {
        return res.status(400).json({ message: "At least one payment must remain active" });
      }

      pay.isActive = false;
    }

    await pay.save();

    return res.json({
      message: "Status updated",
      data: pay,
    });

  } catch (err) {
    console.error("Error updating status", err);
    res.status(500).json({ message: "Server error" });
  }
};


export const deletePaymentSetting = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admins only" });
    }

    const { id } = req.params;

    const pay = await PaymentSettings.findById(id);
    if (!pay) return res.status(404).json({ message: "Not found" });

    const totalPayments = await PaymentSettings.countDocuments();
    if (totalPayments <= 1) {
      return res.status(400).json({
        message: "At least one payment setting must exist"
      });
    }

    // If deleting active one → promote another one as active
    if (pay.isActive) {
      await PaymentSettings.updateOne(
        { _id: { $ne: id } },
        { isActive: true }
      );
    }

    if(pay.publicId){

      await deleteCloudinaryAsset(pay.publicId);
    }
    await pay.deleteOne();

    return res.json({ message: "Payment deleted successfully" });

  } catch (err) {
    console.error("Error deleting payment", err);
    res.status(500).json({ message: "Server error" });
  }
};



export const getAllPayments = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admins only" });
    }

    const payments = await PaymentSettings.find().select("qrImage  upiId isActive createdAt").sort({ createdAt: -1 });

    return res.json({ payments });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
export const getActivePayment = async (req, res) => {
  try {
    const activePayment = await PaymentSettings.findOne({ isActive: true }).select("qrImage upiId");

    return res.json({
      activePayment,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
