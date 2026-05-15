import { Notification } from "../models/Notification.js";
import { User } from "../models/User.js";

/**
 * Creates a notification in the database and emits a socket event to the recipient.
 * @param {Object} io - Socket.io server instance
 * @param {Object} data - Notification data
 * @param {String} data.user - ID of the recipient
 * @param {String} data.sender - ID of the sender
 * @param {String} data.type - Type of notification
 * @param {String} data.message - Notification message
 * @param {String} [data.post] - Optional post ID
 */
export async function createRealTimeNotification(io, data) {
  try {
    const { user, sender, type, message, post } = data;

    // 1. Create in Database
    const notif = await Notification.create({
      user,
      sender,
      type,
      message,
      post
    });

    // 2. Populate for Socket
    await notif.populate("sender", "name username avatar");
    if (post) await notif.populate("post", "media");

    // 3. Emit via Socket
    if (io) {
      io.to(`user:${user}`).emit("notification", notif);
      
      // Also emit specific events for high-priority types if needed
      // (The frontend Layout.jsx already listens to "notification" and calls fetchNotifications)
    }

    return notif;
  } catch (err) {
    console.error("Real-time notification error:", err);
    return null;
  }
}
