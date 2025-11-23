import express from "express";
const WithdrawRouter=express.Router()
import { isAuthenticated  } from "../middleware/Authenticated.js";
import { createWithdrawRequest, getAllWithdrawRequests, getWithdrawById, processWithdrawRequest } from "../controllers/withdraw.controller.js";


WithdrawRouter.route("/create-withdraw-request").post(isAuthenticated,createWithdrawRequest)
WithdrawRouter.route("/all").get(isAuthenticated,getAllWithdrawRequests)
WithdrawRouter.route("/:id/update").patch(isAuthenticated,processWithdrawRequest)
WithdrawRouter.route("/:id").get(isAuthenticated,getWithdrawById)


export default WithdrawRouter