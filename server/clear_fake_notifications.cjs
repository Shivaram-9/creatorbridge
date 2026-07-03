require("dotenv/config");
const mongoose = require("mongoose");

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to live DB");
    
    const db = mongoose.connection.db;
    const notifications = db.collection("notifications");
    
    const result = await notifications.deleteMany({ type: "milestone" });
    console.log(`Deleted ${result.deletedCount} fake milestone notifications.`);
    
    // Also reset post views just in case
    const posts = db.collection("posts");
    const pResult = await posts.updateMany({}, { $set: { views: 0 } });
    console.log(`Reset views for ${pResult.modifiedCount} posts.`);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
