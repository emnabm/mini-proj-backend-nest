import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ForumService } from './forum.service';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/forum',
})
export class ForumGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Map userId -> socketId pour cibler les notifications
  private connectedUsers = new Map<string, string>();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private forumService: ForumService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });
      client.data.userId = payload.sub;
      client.data.role = payload.role;
      this.connectedUsers.set(payload.sub, client.id);
      console.log(`User ${payload.sub} connecté via WebSocket`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data.userId) {
      this.connectedUsers.delete(client.data.userId);
    }
  }

  // Rejoindre un thread (room Socket.IO)
  @SubscribeMessage('joinThread')
  handleJoinThread(
    @ConnectedSocket() client: Socket,
    @MessageBody() threadId: string,
  ) {
    client.join(`thread:${threadId}`);
    client.emit('joinedThread', { threadId });
  }

  // Quitter un thread
  @SubscribeMessage('leaveThread')
  handleLeaveThread(
    @ConnectedSocket() client: Socket,
    @MessageBody() threadId: string,
  ) {
    client.leave(`thread:${threadId}`);
  }

  // Envoyer un message via WebSocket
  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      threadId: string;
      content: string;
      replyToId?: string;
    },
  ) {
    const message = await this.forumService.sendMessage(
      data.threadId,
      client.data.userId,
      data.content,
      undefined,
      data.replyToId,
    );
    // Broadcast le message à tous dans le thread
    this.server.to(`thread:${data.threadId}`).emit('newMessage', message);
    return message;
  }

  // Méthode publique pour envoyer une notification ciblée
  sendNotificationToUser(userId: string, notification: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.server.to(socketId).emit('notification', notification);
    }
  }
}
