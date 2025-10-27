import { AppError } from "../middleware/ErrorHandler.js";
import { Session } from "../models/session.model.js"
import mongoose from "mongoose";
export const AllSessionService = async ({ userId }) => {
    console.log(userId, "userId inside service");
    const session = await Session.find({
        userId,
    });

    const length = session.length;
    console.log("Sessions:", session);
    return { session, length };
};
export const AbortSesssionService = async ({ deviceinfo, sessionId }) => {
    const session = await Session.findById(sessionId)
    if (!session) {
        return AppError("session not found ", 400)
    }

    await session.deleteOne(sessionId)

    return { message: "session terminated" }
}