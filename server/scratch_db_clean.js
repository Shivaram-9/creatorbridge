const mongoose = require('mongoose');

async function cleanDB() {
  await mongoose.connect('mongodb+srv://mernstackdevelopershiva_db_user:1LgOgcAY8bl12zAp@cluster0.zbxofgo.mongodb.net/creatorbridge?retryWrites=true&w=majority&appName=Cluster0');
  
  // We cannot use dynamic import easily in simple CommonJS, so let's just query the raw collection or load the User model.
  // Actually, since this is a module project, let's use the native driver or make it an ES module.
}

cleanDB().catch(console.error).finally(() => process.exit(0));
