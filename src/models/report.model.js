import mongoose from "mongoose";

const reportIssueSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // ✅ allows anonymous reports
      index: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null, // ✅ optional
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // simple validation
    },

    issueType: {
      type: String,
      enum: [
        "refund",
        "technical",
        "bug",
        "payment",
        "account",
        "content",
        "other",
      ],
      default: "other",
      index: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000, // avoid spammy payloads
    },


    status: {
      type: String,
      enum: ["pending", "in_progress", "resolved", "rejected"],
      default: "pending",
      index: true,
    },

    handledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// 🔍 Compound indexes for performance tuning
reportIssueSchema.index({ status: 1, issueType: 1 });
reportIssueSchema.index({ createdAt: -1 });

// 🧠 Middleware to set anonymous flag automatically
reportIssueSchema.pre("save", function (next) {
  if (!this.userId) this.anonymous = true;
  next();
});

export const ReportIssue = mongoose.model("ReportIssue", reportIssueSchema);
