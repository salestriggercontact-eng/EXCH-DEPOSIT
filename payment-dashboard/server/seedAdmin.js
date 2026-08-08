// Run once: node seedAdmin.js
// Creates the first admin login. Change email/password before running in production.
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  const email = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';

  const existing = await Admin.findOne({ email });
  if (existing) {
    console.log('Admin already exists:', email);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await Admin.create({ name: 'Super Admin', email, passwordHash, role: 'superadmin' });

  console.log('Admin created:');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('IMPORTANT: change this password after first login.');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
