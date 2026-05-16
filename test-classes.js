require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const classes = await mongoose.connection.collection('classes').find({ name: { $in: ["Class 3", "Class 4"] } }).toArray();
  console.log(JSON.stringify(classes.map(c => c.name), null, 2));
  process.exit(0);
}).catch(console.error);
