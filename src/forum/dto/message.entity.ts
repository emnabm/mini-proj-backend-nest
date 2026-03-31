import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Thread } from './thread.entity';
import { Mention } from './mention.entity';

@Entity('forum_messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  content: string;

  @Column({ nullable: true })
  attachmentUrl: string;

  @ManyToOne(() => User)
  sender: User;

  @ManyToOne(() => Thread, (thread) => thread.messages, { onDelete: 'CASCADE' })
  thread: Thread;

  @OneToMany(() => Mention, (mention) => mention.message, { cascade: true })
  mentions: Mention[];

  @ManyToOne(() => Message, { nullable: true })
  replyTo: Message; // Pour répondre à un message

  @CreateDateColumn()
  createdAt: Date;
}
