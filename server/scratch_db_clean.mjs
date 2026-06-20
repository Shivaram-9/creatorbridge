import mongoose from 'mongoose';

async function cleanDB() {
  await mongoose.connect('mongodb+srv://mernstackdevelopershiva_db_user:1LgOgcAY8bl12zAp@cluster0.zbxofgo.mongodb.net/creatorbridge?retryWrites=true&w=majority&appName=Cluster0');
  console.log('Connected to DB');

  const users = await mongoose.connection.db.collection('users').find({}).toArray();
  
  console.log(`Total users: ${users.length}`);
  
  const testUsers = users.filter(u => {
    const email = u.email ? u.email.toLowerCase() : '';
    const name = u.name ? u.name.toLowerCase() : '';
    return email.includes('test') || name.includes('test') || email.includes('fake') || name.includes('fake') || email === 'a@a.com' || name === 'a';
  });

  console.log('Found test users:');
  testUsers.forEach(u => console.log(`- ${u.name} (${u.email})`));

  if (testUsers.length > 0) {
    const idsToDelete = testUsers.map(u => u._id);
    const result = await mongoose.connection.db.collection('users').deleteMany({ _id: { $in: idsToDelete } });
    console.log(`Deleted ${result.deletedCount} test users.`);
  } else {
    console.log('No test users found based on simple heuristics.');
  }

}

cleanDB().catch(console.error).finally(() => process.exit(0));
