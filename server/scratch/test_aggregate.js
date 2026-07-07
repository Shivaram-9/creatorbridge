import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import { Message } from '../src/models/Message.js';
import { User } from '../src/models/User.js'; // Ensure User is loaded

async function testAggregate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    // Find a user ID that has messages
    const msg = await Message.findOne();
    if (!msg) return console.log("No messages");
    const uid = msg.sender;

    const conversations = await Message.aggregate([
      { $match: { $or: [{ sender: uid }, { receiver: uid }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: { $cond: [{ $eq: ["$sender", uid] }, "$receiver", "$sender"] },
          lastMessage: { $first: "$$ROOT" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "partner",
        },
      },
      { $unwind: "$partner" },
      {
        $project: {
          _id: 1,
          partner: {
            _id: 1,
            name: 1,
            username: 1,
            avatar: 1,
            role: 1,
            isVerified: 1,
            isPremium: 1,
          },
        },
      }
    ]);
    console.log(JSON.stringify(conversations, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

testAggregate();
