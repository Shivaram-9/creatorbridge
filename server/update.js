import mongoose from 'mongoose';

mongoose.connect('mongodb+srv://shivaram:Shiva%40123@cluster0.wvw9n.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0').then(async () => {
  const { User } = await import('./src/models/User.js');
  const result1 = await User.updateMany(
    { name: /SAIBALAJI/i }, 
    { $set: { role: 'brand', premiumTier: 'gold', category: 'Creative Studio' } }
  );
  console.log('Brand updated:', result1);

  const result2 = await User.updateMany(
    { username: 'shivaram' }, 
    { $set: { role: 'influencer', category: 'Software Engineer' } }
  );
  console.log('Creator updated:', result2);
  
  process.exit(0);
});
