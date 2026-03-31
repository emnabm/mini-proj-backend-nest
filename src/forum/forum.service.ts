import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Thread } from './entities/thread.entity';
import { Message } from './entities/message.entity';
import { Mention, MentionType } from './entities/mention.entity';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UserRole } from '../common/enums/role.enum';

@Injectable()
export class ForumService {
  constructor(
    @InjectRepository(Thread) private threadRepo: Repository<Thread>,
    @InjectRepository(Message) private messageRepo: Repository<Message>,
    @InjectRepository(Mention) private mentionRepo: Repository<Mention>,
    private usersService: UsersService,
    private notificationsService: NotificationsService,
  ) {}

  // ===== THREADS =====
  async createThread(title: string, creatorId: string): Promise<Thread> {
    const thread = this.threadRepo.create({
      title,
      creator: { id: creatorId } as any,
    });
    return this.threadRepo.save(thread);
  }

  async getThreads(): Promise<Thread[]> {
    return this.threadRepo.find({
      relations: ['creator'],
      order: { createdAt: 'DESC' },
    });
  }

  async getThreadById(id: string): Promise<Thread> {
    const thread = await this.threadRepo.findOne({
      where: { id },
      relations: ['creator', 'messages', 'messages.sender', 'messages.mentions'],
    });
    if (!thread) throw new NotFoundException('Thread non trouvé');
    return thread;
  }

  // ===== MESSAGES & MENTIONS =====
  async sendMessage(threadId: string, senderId: string, content: string,
                    attachmentUrl?: string, replyToId?: string): Promise<Message> {

    const message = this.messageRepo.create({
      content,
      attachmentUrl,
      sender: { id: senderId } as any,
      thread: { id: threadId } as any,
      replyTo: replyToId ? ({ id: replyToId } as any) : undefined,
    });
    const savedMsg = await this.messageRepo.save(message);

    // Parser et résoudre les @mentions
    await this.parseMentions(content, savedMsg, senderId);

    return this.messageRepo.findOne({
      where: { id: savedMsg.id },
      relations: ['sender', 'mentions', 'replyTo'],
    });
  }

  // ===== PARSER LES MENTIONS =====
  private async parseMentions(content: string, message: Message, senderId: string) {
    // Regex pour capturer toutes les @mentions
    const mentionRegex = /@(\S+)/g;
    const matches = [...content.matchAll(mentionRegex)];

    for (const match of matches) {
      const tag = match[1]; // ex: 'tous', 'technicien', 'ING_A1_G1', 'Ahmed_Ben'
      await this.processMention(tag, message, senderId);
    }
  }

  private async processMention(tag: string, message: Message, senderId: string) {
    let targetUsers = [];
    let mentionType: MentionType;
    let targetValue: string = tag;

    // === @tous : broadcast ===
    if (tag.toLowerCase() === 'tous' || tag.toLowerCase() === 'all') {
      mentionType = MentionType.ALL;
      targetUsers = await this.usersService.findAll();
    }
    // === @role (rôles principaux) : @etudiant, @enseignant, @admin ===
    else if (Object.values(UserRole).includes(tag.toLowerCase() as UserRole)) {
      mentionType = MentionType.ROLE;
      targetUsers = await this.usersService.findByRole(tag.toLowerCase() as UserRole);
    }
    // === @sous-role agent (technicien, responsable_labo, etc.) ===
    else if (['technicien','agent_administratif','responsable_labo',
              'bibliothecaire','securite'].includes(tag.toLowerCase())) {
      mentionType = MentionType.ROLE;
      targetUsers = await this.usersService.findByAgentType(tag.toLowerCase());
    }
    // === @groupe (format: LETTRES_CHIFFRES_Gchiffre) ex: ING_A1_G1 ===
    else if (/^[A-Z]+_[A-Z0-9]+_G\d+$/i.test(tag)) {
      mentionType = MentionType.GROUP;
      targetUsers = await this.usersService.findByGroup(tag.toUpperCase());
    }
    // === @username individuel ===
    else {
      mentionType = MentionType.USER;
      const user = await this.usersService.findByUsername(tag);
      if (user) targetUsers = [user];
    }

    // Enregistrer la mention en base
    const mention = this.mentionRepo.create({ type: mentionType, targetValue, message });
    await this.mentionRepo.save(mention);

    // Envoyer les notifications (exclure l'expéditeur)
    const sender = await this.usersService.findById(senderId);
    for (const user of targetUsers) {
      if (user.id === senderId) continue;
      await this.notificationsService.create({
        title: `Vous avez été mentionné par ${sender.firstName} ${sender.lastName}`,
        body: message.content.substring(0, 100),
        link: `/forum/threads/${message.thread}`,
        recipient: { id: user.id } as any,
      });
    }
  }

  async getMessages(threadId: string): Promise<Message[]> {
    return this.messageRepo.find({
      where: { thread: { id: threadId } },
      relations: ['sender', 'mentions', 'replyTo', 'replyTo.sender'],
      order: { createdAt: 'ASC' },
    });
  }
}
