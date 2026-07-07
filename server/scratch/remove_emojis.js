import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { Message } from '../src/models/Message.js';

async function removeEmojis() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const msgs = await Message.find({ content: { $regex: '❌|✅' } });
    console.log(`Found ${msgs.length} messages with emojis.`);
    
    for (const m of msgs) {
      console.log("Before:", m.content);
      let newContent = m.content.replace(/❌/g, '').replace(/✅/g, '').trim();
      // Also fix system spacing if needed
      newContent = newContent.replace(/^\[System\]\s*/, '[System] ');
      console.log("After:", newContent);
      m.content = newContent;
      await m.save();
    }
    
    console.log('Done');
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

removeEmojis();
