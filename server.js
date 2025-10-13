import dotenv from "dotenv";
import app from "./src/app.js";
import { connectDB } from "./src/config/db.js";
import "./src/automation/automation.js"

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;
  await connectDB();
// Start server
const server = app.listen(PORT, async() => {
    await connectDB();
  console.log(`✅ Server running on http://localhost:${PORT}`);
});


// Handle crashes gracefully
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err);
  server.close(() => process.exit(1));
});
