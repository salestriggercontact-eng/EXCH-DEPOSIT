// One-time fix script.
// Drops the stale "name_1" unique index left over from an old CustomField
// schema (which no longer has a `name` field). That leftover index causes
// "E11000 duplicate key error ... dup key: { name: null }" whenever a
// second custom field is created.
//
// Run this ONCE with:  node fixCustomFieldsIndex.js
// (make sure your .env / MONGO_URI is set, same as when running the server)

require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const collection = mongoose.connection.collection('customfields');
  const indexes = await collection.indexes();
  console.log('Current indexes:', indexes.map((i) => i.name));

  const stale = indexes.find((i) => i.name === 'name_1');
  if (stale) {
    await collection.dropIndex('name_1');
    console.log('✅ Dropped stale index "name_1"');
  } else {
    console.log('No "name_1" index found — nothing to do.');
  }

  // Optional: clean up any existing docs that ended up with name: null
  // (harmless leftovers from the earlier failed inserts). Uncomment if needed:
  // await collection.updateMany({}, { $unset: { name: '' } });

  await mongoose.disconnect();
  console.log('Done.');
}

run().catch((err) => {
  console.error('Fix script failed:', err);
  process.exit(1);
});
