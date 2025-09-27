import express from "express"
import { adminSessionMiddleware } from "../middleware/Authenticated.js"
import { getAllUsersController, getUserController, toggleSuspendUser } from "../controllers/Admin.controller.js"
import { AbortSessionController, GenerateSessionOtp, GetAllSession } from "../controllers/session.controller.js"
const AdminRouter=express.Router()


AdminRouter.route("/suspend-user").patch(adminSessionMiddleware,toggleSuspendUser)
AdminRouter.route("/users").get(adminSessionMiddleware,getAllUsersController)
AdminRouter.route("/user/:userId ").get(adminSessionMiddleware,getUserController)
AdminRouter.route("/session ").get(adminSessionMiddleware,GetAllSession)
AdminRouter.route("/session-otp").get(adminSessionMiddleware,GenerateSessionOtp)
AdminRouter.route("/session-abort ").get(adminSessionMiddleware,AbortSessionController)

export default AdminRouter