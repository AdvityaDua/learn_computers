const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/learn_computers').then(async () => {
  const users = await mongoose.connection.collection('users').find({}).toArray();
  console.log(JSON.stringify(users.map(u => ({ email: u.email, role: u.role, classIds: u.classIds })), null, 2));
  process.exit(0);
});
