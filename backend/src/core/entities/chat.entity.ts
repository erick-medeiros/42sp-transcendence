import { Entity, PrimaryGeneratedColumn, OneToMany, ManyToMany } from 'typeorm';
import { UserEntity, MessageEntity } from '.';

@Entity()
export class ChatEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToMany(() => UserEntity, (user) => user.chats)
  users: UserEntity[];

  @OneToMany(() => Message, (message) => message.chat, { cascade: true })
  messages: MessageEntity[];

  constructor(chat?: ChatEntity) {
    this.id = chat?.id;
    this.users = chat?.users;
    this.messages = chat?.messages;
  }
}
