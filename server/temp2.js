import mongoose from 'mongoose';

mongoose.connect('mongodb+srv://shivaram:Shiva%40123@cluster0.wvw9n.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0').then(async () => {
  const { User } = await import('./src/models/User.js');
  try {
    const user = await User.findOne({ username: 'shivaram' }).populate('collections.posts');
    console.log("Success", user.collections);
  } catch (err) {
    console.error("Error populating collections:", err);
  }
  process.exit(0);
});
