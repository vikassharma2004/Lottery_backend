import express from "express";
import { ChangePassword, GetProfile, Login, Logout, Register, ResetPassword, ResetToken, verifytoken } from "../controllers/authController.js";
import { isAuthenticated } from "../middleware/Authenticated.js";
const AuthRouter = express.Router();

AuthRouter.route("/register").post(Register);
AuthRouter.route("/login").post(Login);
AuthRouter.route("/Profile").get(isAuthenticated,GetProfile);
AuthRouter.route("/logout").post(Logout);
// Step 1: Send reset token via email
AuthRouter.route("/send-reset-token").post(ResetToken);
AuthRouter.route("/change-password").post(isAuthenticated,ChangePassword);
// Step 2: Reset password using token
AuthRouter.route("/reset-password/:token").post(ResetPassword);
AuthRouter.route("/verify-token").post(isAuthenticated,verifytoken);



export default AuthRouter;
