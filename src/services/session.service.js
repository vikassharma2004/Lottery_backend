import { AppError } from "../middleware/ErrorHandler.js";
import { Session } from "../models/session.model.js"

export const AllSessionService=async({userId})=>{
const session=await Session.find({ userId})
const length=session.length;
return {session,length}

}
export const  AbortSesssionService=async({deviceinfo,sessionId})=>{
    const session=await Session.findById(sessionId)
if(!session){
    return AppError("session not found ",400)
}

await session.deleteOne(sessionId)

return {message:"session terminated"}


}