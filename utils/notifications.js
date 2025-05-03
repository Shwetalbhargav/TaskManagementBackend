import User from "../models/User";
import Notification from "../models/Notification";

export default async function sendNotification(userId, message) {
    const user = await User.findById(userId);

    if(user){
        console.log(`🔔 Notification to ${user.username}: ${message}`);
        const notification = new Notification({
            user: userId,
            message
        });
        await notification.save();
    }

    
}