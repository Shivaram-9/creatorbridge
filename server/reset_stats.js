import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './src/models/User.js';
import { Post } from './src/models/Post.js';

dotenv.config({ path: './.env' });

async function resetStats() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB...');

    const userResult = await User.updateMany({}, { $set: { profileViews: 0, postImpressions: 0 } });
    console.log(`Reset profileViews for ${userResult.modifiedCount} users.`);

    const postResult = await Post.updateMany({}, { $set: { views: 0 } });
    console.log(`Reset views for ${postResult.modifiedCount} posts.`);

    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

resetStats();
