import express from "express"
import { AbortSessionController, GenerateSessionOtp, GetAllSession } from "../controllers/session.controller.js";
import { isAuthenticated } from "../middleware/Authenticated.js";
const SessionRouter=express.Router()

SessionRouter.route("/all").get(isAuthenticated,GetAllSession)
SessionRouter.route("/generate-session-otp").post(isAuthenticated,GenerateSessionOtp)
SessionRouter.route("/:SessionId/abort").delete(isAuthenticated,AbortSessionController)








export default SessionRouter;