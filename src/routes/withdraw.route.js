import express from "express";
const WithdrawRouter=express.Router()
import { isAuthenticated } from "../middleware/Authenticated.js";
import { createWithdrawRequest, getAllWithdrawRequests, processWithdrawRequest } from "../controllers/withdraw.controller.js";


WithdrawRouter.route("/create-withdraw-request").post(isAuthenticated,createWithdrawRequest)
WithdrawRouter.route("/withdraw-request-All").get(isAuthenticated,getAllWithdrawRequests)
WithdrawRouter.route("/update-withdraw-request").patch(isAuthenticated,processWithdrawRequest)


export default WithdrawRouter