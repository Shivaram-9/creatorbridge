import mongoose from 'mongoose';
import { Message } from './src/models/Message.js';
import { Application } from './src/models/Application.js';
import { Campaign } from './src/models/Campaign.js';
import { User } from './src/models/User.js';

await mongoose.connect('mongodb://127.0.0.1:27017/brandcreator');

try {
  const user = await User.findOne({ email: 'shivaram@auraon.com' });
  const uid = user._id;

  const conversations = await Message.aggregate([
    { $match: { $or: [{ sender: uid }, { receiver: uid }] } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: {
          partner: {
            $cond: [
              { $eq: ["$sender", uid] },
              "$receiver",
              "$sender"
            ]
          },
          application: { $ifNull: ["$application", null] }
        },
        lastMessage: { $first: "$$ROOT" }
      }
    },
    { $lookup: { from: 'applications', localField: '_id.application', foreignField: '_id', as: 'applicationData' } },
    { $unwind: { path: '$applicationData', preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'campaigns', localField: 'applicationData.campaign', foreignField: '_id', as: 'campaignData' } },
    { $unwind: { path: '$campaignData', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        application: {
          $cond: [
            { $eq: [{ $type: "$applicationData" }, "missing"] },
            null,
            {
              _id: "$applicationData._id",
              campaignId: "$campaignData._id",
              campaignTitle: "$campaignData.title",
              status: "$applicationData.status"
            }
          ]
        },
        lastMessage: 1
      }
    }
  ]);
  console.log(JSON.stringify(conversations, null, 2));
} catch (err) {
  console.error(err);
} finally {
  await mongoose.disconnect();
  process.exit(0);
}
