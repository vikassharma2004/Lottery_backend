import dotenv from "dotenv";
import app from "./src/app.js";
import { connectDB } from "./src/config/db.js";
import "./src/automation/automation.js"
import logger from "./src/config/logger.js";
// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;
  await connectDB();
// Start server
const server = app.listen(PORT, async() => {
  logger.info(`Server running on http://localhost:${PORT}`);
});


// Handle crashes gracefully
process.on("uncaughtException", (err) => {
  logger.error(" Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  logger.error(" Unhandled Rejection:", err);
  server.close(() => process.exit(1));
});
