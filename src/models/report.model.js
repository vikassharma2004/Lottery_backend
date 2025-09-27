import mongoose from "mongoose";

const reportIssueSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  issueType: {
    type: String,
    enum: ["refund", "technical", "other"],
    default: "other",
    index: true, 
  },

  description: { type: String, required: true },

  status: {
    type: String,
    enum: ["pending", "in_progress", "resolved", "rejected"],
    default: "pending",
  },

  resolvedAt: { type: Date },

}, { timestamps: true });

// Alternatively, you can create a compound index if needed:
reportIssueSchema.index({ status: 1, userId: 1 });

export const ReportIssue = mongoose.model("ReportIssue", reportIssueSchema);
