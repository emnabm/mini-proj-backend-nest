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
import { ForumService } from './forum.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/forum' })
export class ForumGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    private readonly forumService: ForumService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // Authentification à la connexion
  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });
      client.data.userId = payload.sub;
      console.log(`[WS] Connecte: userId=${payload.sub}`);
    } catch {
      client.disconnect(); // Déconnecter si token invalide
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`[WS] Deconnecte: ${client.id}`);
  }

  // CLIENT -> SERVEUR : rejoindre un sujet (room)
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() sujetId: number,
    @ConnectedSocket() client: Socket,
  ) {
    await client.join(`sujet_${sujetId}`);
    // Envoyer l'historique au nouveau membre
    const messages = await this.forumService.getMessages(sujetId);
    client.emit('messageHistory', messages);
  }

  // CLIENT -> SERVEUR : quitter un sujet
  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @MessageBody() sujetId: number,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`sujet_${sujetId}`);
  }

  // CLIENT -> SERVEUR : envoyer un message
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() payload: { sujetId: number; contenu: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId;
    if (!userId) {
      client.emit('error', { message: 'Non authentifie' });
      return;
    }

    const message = await this.forumService.createMessage(
      payload.sujetId,
      { contenu: payload.contenu },
      userId,
    );

    // SERVEUR -> tous les membres de la room
    this.server.to(`sujet_${payload.sujetId}`).emit('newMessage', message);
  }

  // CLIENT -> SERVEUR : supprimer un message
  @SubscribeMessage('deleteMessage')
  async handleDeleteMessage(@MessageBody() messageId: number) {
    await this.forumService.removeMessage(messageId);
    this.server.emit('messageDeleted', { messageId });
  }
}
