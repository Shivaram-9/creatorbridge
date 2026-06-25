import mongoose from 'mongoose';

async function makeAdmin() {
  await mongoose.connect('mongodb+srv://mernstackdevelopershiva_db_user:1LgOgcAY8bl12zAp@cluster0.zbxofgo.mongodb.net/creatorbridge?retryWrites=true&w=majority&appName=Cluster0');
  
  const emails = [
    'ymvshiva1784@gmail.com',
    'shiva1784@gmail.com',
    'yshivaram1784@gmail.com',
    '7shivaram1784@gmail.com',
    'shivaram1784@gmail.com',
    'mernstackdevelopershiva@gmail.com'
  ];

  const result = await mongoose.connection.db.collection('users').updateMany(
    { email: { $in: emails } },
    { $set: { role: 'admin' } }
  );
  console.log('Updated: ' + result.modifiedCount);
}

makeAdmin().catch(console.error).finally(() => process.exit(0));
