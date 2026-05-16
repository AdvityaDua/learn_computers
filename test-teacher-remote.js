require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const users = await mongoose.connection.collection('users').find({ role: 'instructor' }).toArray();
  console.log(JSON.stringify(users.map(u => ({ email: u.email, classIds: u.classIds })), null, 2));
  process.exit(0);
}).catch(console.error);
