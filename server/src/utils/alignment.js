import { User } from "../models/User.js";
import { AlignRequest } from "../models/AlignRequest.js";

/**
 * Helper to attach alignment status (isFollowing, isRequested, hasIncomingRequest)
 * to a user object or an array of user objects.
 */
export async function attachAlignmentStatus(req, users) {
  if (!req || !req.userId || !users) return users;
  
  const isArray = Array.isArray(users);
  const userList = isArray ? users : [users];
  if (userList.length === 0) return users;

  try {
    const me = await User.findById(req.userId).select("following");
    const followingIds = new Set(me?.following?.map(id => id.toString()) || []);

    const pendingRequests = await AlignRequest.find({
      sender: req.userId,
      status: "pending"
    }).select("receiver");
    const requestedIds = new Set(pendingRequests.map(r => r.receiver.toString()));

    const incomingRequests = await AlignRequest.find({
      receiver: req.userId,
      status: "pending"
    }).select("sender");
    const incomingIds = new Map(incomingRequests.map(r => [r.sender.toString(), r._id]));

    const result = userList.map(u => {
      const uObj = u.toObject ? u.toObject() : u;
      const uid = uObj._id.toString();
      
      const isFollowing = followingIds.has(uid);
      const isRequested = requestedIds.has(uid);
      
      return {
        ...uObj,
        // A user is ONLY 'following' if they are in the following list 
        // AND we don't have a pending request (to avoid weird overlap states)
        isFollowing: isFollowing && !isRequested,
        isRequested: isRequested,
        hasIncomingRequest: incomingIds.has(uid),
        incomingRequestId: incomingIds.get(uid)
      };
    });

    return isArray ? result : result[0];
  } catch (err) {
    console.error("Error attaching alignment status:", err);
    return users;
  }
}
