import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;

    const shivaram = await db.collection("users").findOne({ username: "shivaram" });
    if (!shivaram) { console.log("User shivaram not found"); process.exit(0); }
    const uid = shivaram._id;

    const pipeline = [
      {
        $match: {
          $or: [{ sender: uid }, { receiver: uid }],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            partner: {
              $cond: [
                { $eq: ["$sender", uid] },
                "$receiver",
                "$sender",
              ]
            }
          },
          lastMessage: { $first: "$$ROOT" }
        },
      }
    ];

    const grouped = await db.collection("messages").aggregate(pipeline).toArray();
    
    const partners = await Promise.all(grouped.map(async g => {
      const u = await db.collection("users").findOne({ _id: g._id.partner });
      return { partnerId: g._id.partner, partnerName: u ? u.name : "Unknown", content: g.lastMessage.content };
    }));

    console.log("Grouped counts:");
    partners.forEach(p => console.log(`${p.partnerName} (${p.partnerId}) -> ${p.content}`));
    
    // Also let's see if there are 2 users with name SAIBALAJI
    const saibalaji = await db.collection("users").find({ name: /SAIBALAJ/i }).toArray();
    console.log("\nUsers named SAIBALAJI:", saibalaji.map(u => ({ id: u._id, name: u.name, username: u.username })));

  } catch(e) { console.error(e); } finally { process.exit(0); }
}
run();
