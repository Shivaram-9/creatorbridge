import mongoose from 'mongoose';
import UserModule from './src/models/User.js';

const User = UserModule.default || UserModule.User || Object.values(UserModule)[0];

mongoose.connect('mongodb://127.0.0.1:27017/creatorbridge').then(async () => {
  const users = await User.find({ username: { $in: ['shivaram', 'chsaibalajisingh', 'CH.SAIBALAJISINGH RAJPUT'] } });
  console.log(users.map(u => ({ username: u.username, name: u.name, role: u.role, isVerified: u.isVerified, category: u.category, premiumTier: u.premiumTier })));
  
  // Actually, just find the ones from the screenshots
  const allUsers = await User.find({ name: /SAIBALAJI|shivaram/i });
  console.log("Found matches:", allUsers.map(u => ({ username: u.username, name: u.name, role: u.role, isVerified: u.isVerified, category: u.category, premiumTier: u.premiumTier })));

  process.exit(0);
});
