import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from './src/models/User.js';

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    const result = await User.deleteOne({ email: 'bunny1127@gmail.com' });
    console.log('Deleted users:', result.deletedCount);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
