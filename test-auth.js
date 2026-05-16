require('dotenv').config();
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');
const { JwtService } = require('@nestjs/jwt');
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await mongoose.connection.collection('users').findOne({ email: 'karman2@gmail.com' });
  const app = await NestFactory.createApplicationContext(AppModule);
  const jwtService = app.get(JwtService);
  
  const payload = { email: user.email, sub: user._id.toString(), role: user.role };
  const token = jwtService.sign(payload);
  console.log("Token:", token);
  process.exit(0);
}
run();
