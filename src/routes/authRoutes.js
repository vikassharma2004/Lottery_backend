import express from "express";
import { GetProfile, Login, Logout, Register, ResetPassword, ResetToken } from "../controllers/authController.js";
import { isAuthenticated } from "../middleware/Authenticated.js";
const AuthRouter = express.Router();

AuthRouter.route("/register").post(Register);
AuthRouter.route("/login").post(Login);
AuthRouter.route("/Profile").get(isAuthenticated,GetProfile);
AuthRouter.route("/logout").post(isAuthenticated,Logout);
// Step 1: Send reset token via email
AuthRouter.route("/send-reset-token").post(ResetToken);

// Step 2: Reset password using token
AuthRouter.route("/reset-password/:token").post(ResetPassword);



export default AuthRouter;
