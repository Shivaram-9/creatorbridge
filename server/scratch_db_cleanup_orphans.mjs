import mongoose from 'mongoose';

async function cleanOrphans() {
  await mongoose.connect('mongodb+srv://mernstackdevelopershiva_db_user:1LgOgcAY8bl12zAp@cluster0.zbxofgo.mongodb.net/creatorbridge?retryWrites=true&w=majority&appName=Cluster0');
  console.log('Connected to DB');

  const db = mongoose.connection.db;

  // 1. Get all valid user IDs
  const users = await db.collection('users').find({}).project({ _id: 1 }).toArray();
  const validUserIds = users.map(u => u._id.toString());
  console.log(`Found ${validUserIds.length} valid users`);

  // 2. Fetch all users again to check their followers/following arrays
  const allUsers = await db.collection('users').find({}).toArray();

  let totalRemoved = 0;

  for (const user of allUsers) {
    let changed = false;

    // Clean followers
    const newFollowers = (user.followers || []).filter(id => {
      const idStr = id.toString();
      if (!validUserIds.includes(idStr)) {
        changed = true;
        totalRemoved++;
        return false;
      }
      return true;
    });

    // Clean following
    const newFollowing = (user.following || []).filter(id => {
      const idStr = id.toString();
      if (!validUserIds.includes(idStr)) {
        changed = true;
        totalRemoved++;
        return false;
      }
      return true;
    });

    if (changed) {
      await db.collection('users').updateOne(
        { _id: user._id },
        { $set: { followers: newFollowers, following: newFollowing } }
      );
      console.log(`Cleaned orphaned connections for user: ${user.name}`);
    }
  }

  console.log(`Cleanup complete. Removed ${totalRemoved} orphaned connection IDs.`);
}

cleanOrphans().catch(console.error).finally(() => process.exit(0));
