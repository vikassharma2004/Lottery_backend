import express from "express"
import { isAuthenticated } from "../middleware/Authenticated.js"
import { getAllUsers, getUserController, toggleSuspendUser } from "../controllers/Admin.controller.js"
const AdminRouter=express.Router()


AdminRouter.route("/suspend-user").patch(isAuthenticated,toggleSuspendUser)
AdminRouter.route("/users/all").get(isAuthenticated,getAllUsers)
AdminRouter.route("/user/:userId ").get(isAuthenticated,getUserController)

export default AdminRouter