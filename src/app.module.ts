import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { ActivitiesModule } from './activities/activities.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { LessonsModule } from './lessons/lessons.module';
import { MaterialsModule } from './materials/materials.module';
import { ProgressModule } from './progress/progress.module';

import { ConfigModule, ConfigService } from '@nestjs/config';

import { SchoolsModule } from './schools/schools.module';
import { ClassesModule } from './classes/classes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
    }),
    UsersModule,
    AuthModule,
    QuizzesModule,
    ActivitiesModule,
    AssignmentsModule,
    LessonsModule,
    MaterialsModule,
    ProgressModule,
    SchoolsModule,
    ClassesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
