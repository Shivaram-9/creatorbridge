const mongoose = require('mongoose');
const Schema = mongoose.Schema;

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/test_strict');
  
  const TestSchema = new Schema({ name: String }, { strict: true });
  const TestModel = mongoose.model('Test', TestSchema);
  
  await TestModel.deleteMany({});
  
  let doc = await TestModel.create({ name: 'Alice' });
  console.log('Created doc:', doc);
  
  // Update with strict: false
  doc = await TestModel.findByIdAndUpdate(doc._id, { $set: { gender: 'Female' } }, { new: true, strict: false }).lean();
  console.log('Updated with strict:false:', doc);
  
  // Query with lean
  doc = await TestModel.findById(doc._id).lean();
  console.log('Queried with lean:', doc);
  
  process.exit(0);
}
run().catch(console.error);
