import User from "../models/User.js";
import Notification from "../models/Notification.js";

/**
 * Sends the same message to multiple users, optionally tagged by role.
 * @param {Array} userIds - Array of user IDs
 * @param {String} message - Notification message
 * @param {Array} roles - Optional roles to tag the notification for
 */
export async function sendToMultipleUsers (userId, message,roles=[] ) {
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

/**
 * Sends notification to a single user, respecting their preferences.
 * @param {String} userId - ID of the user
 * @param {String} message - Message to send
 * @param {String} type - Type of notification (for mute filtering)
 */
export async function sendNotification(userId, message, type = 'generic') {
    const user = await User.findById(userId);
    if (!user || user.notificationPreferences?.mutedTypes?.includes(type)) return;

    if (user.notificationPreferences?.inApp !== false) {
        await Notification.create({
            user: userId,
            message
        });
    }

    
    if (user.notificationPreferences?.email) {
        console.log(`[EMAIL] Notification to ${user.username}: ${message}`);
    }
}