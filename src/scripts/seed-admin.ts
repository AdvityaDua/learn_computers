import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { UserRole } from '../common/constants/roles.enum';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  const email = 'karman@gmail.com';
  const existing = await usersService.findByEmail(email);

  if (existing) {
    console.log(`Admin user already exists: ${email}`);
    await app.close();
    return;
  }

  await usersService.create({
    email,
    password: '123456',
    fullName: 'Karman Singh',
    role: UserRole.Admin,
  });

  console.log(`✅ Admin user created: ${email} / 123456`);
  await app.close();
}

bootstrap().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
