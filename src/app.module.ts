import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { MulterModule } from '@nestjs/platform-express';
import { multerConfig } from 'src/config/multer.config';
import { UploadModule } from 'src/upload/upload.module';

@Module({
  imports: [ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    UploadModule,
    MulterModule.register(multerConfig),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
