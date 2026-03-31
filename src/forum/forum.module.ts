import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ForumController } from './forum.controller';
import { ForumService } from './forum.service';
import { ForumGateway } from './forum.gateway';
import { Thread } from './entities/thread.entity';
import { Message } from './entities/message.entity';
import { Mention } from './entities/mention.entity';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Thread, Message, Mention]),
    UsersModule,
    NotificationsModule,
    AuthModule,
  ],
  controllers: [ForumController],
  providers: [ForumService, ForumGateway],
})
export class ForumModule {}
