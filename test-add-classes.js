require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const collection = mongoose.connection.collection('classes');
  
  const class3 = await collection.findOne({ name: "Class 3" });
  if (!class3) {
    await collection.insertOne({
      name: "Class 3",
      grade: 3,
      description: "Third Grade Class",
      schoolIds: [],
      teacherIds: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  const class4 = await collection.findOne({ name: "Class 4" });
  if (!class4) {
    await collection.insertOne({
      name: "Class 4",
      grade: 4,
      description: "Fourth Grade Class",
      schoolIds: [],
      teacherIds: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
  
  console.log("Classes ensured.");
  process.exit(0);
}).catch(console.error);
