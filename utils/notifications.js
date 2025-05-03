import User from "../models/User";
import Notification from "../models/Notification";

export default async function sendNotification(userId, message) {
    const ids = Array.isArray(userId)? userId :[userId];

    for(let userId of ids){
        const user = await User.findById(userId);
        if(!user) continue;
        console.log(`🔔 Notification to ${user.username}: ${message}`);
         
        await Notification.create({
            user: user._id,
            message,
            forRoles: roles.length > 0 ? roles : [user.role]
        });
    }
    
}