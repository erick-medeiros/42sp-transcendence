import * as argon2 from 'argon2';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  UserEntity,
  ChatEntity,
  MessageEntity,
  ChatMemberEntity,
  ChatMemberRole,
  ChatType,
  ChatAccess,
} from '../core/entities';
import { CreateChatDto, ChatWithName, CreateMessageDto } from './dto';

@Injectable()
export class ChatsService {
  constructor(
    @InjectRepository(UserEntity)
    readonly userRepository: Repository<UserEntity>,

    @InjectRepository(ChatEntity)
    private readonly chatRepository: Repository<ChatEntity>,

    @InjectRepository(MessageEntity)
    private readonly messageRepository: Repository<MessageEntity>,

    @InjectRepository(ChatMemberEntity)
    private chatMemberRepository: Repository<ChatMemberEntity>,
  ) {}

  async create(dto: CreateChatDto, creator: UserEntity): Promise<ChatEntity> {
    // Add creator user to the userIds
    const userIds = [...new Set([...dto.userIds, creator.id])];

    // Check if all users in userIds exist
    const users = await this.userRepository.findBy({ id: In(userIds) });
    if (users.length !== userIds.length) {
      throw new NotFoundException('One or more users not found');
    }

    switch (dto.type) {
      case ChatType.DIRECT:
        return await this.createDirectChat(dto, users, creator);

      case ChatType.CHANNEL:
        return await this.createChannelChat(dto, users, creator);

      default:
        throw new BadRequestException('Invalid chat type');
    }
  }

  private async createDirectChat(
    { message }: CreateChatDto,
    users: UserEntity[],
    creator: UserEntity,
  ): Promise<ChatEntity> {
    if (users.length > 2) {
      throw new BadRequestException('Direct chats can have at most 2 users');
    }

    const chat = await this.chatRepository.save({
      type: ChatType.DIRECT,
      access: ChatAccess.PRIVATE,
      messages: message ? [{ sender: creator, content: message }] : undefined,
    });

    users.map(async (user) => {
      await this.chatMemberRepository.save({ user, chat });
    });

    return chat;
  }

  private async createChannelChat(
    { password }: CreateChatDto,
    users: UserEntity[],
    creator: UserEntity,
  ): Promise<ChatEntity> {
    const chat = await this.chatRepository.save({
      type: ChatType.CHANNEL,
      access: password ? ChatAccess.PROTECTED : ChatAccess.PUBLIC,
      password: password ? await argon2.hash(password) : undefined,
    });

    users.map(async (user) => {
      if (user.id !== creator.id) {
        return;
      }
      await this.chatMemberRepository.save({ user, chat });
    });

    await this.chatMemberRepository.save({
      chat,
      user: creator,
      role: ChatMemberRole.OWNER,
    });

    return chat;
  }

  async findAll(user: UserEntity): Promise<ChatEntity[]> {
    const chatsWithoutUsersRelation = await this.chatRepository.find({
      where: { users: { userId: user.id } },
    });

    const chatIds = chatsWithoutUsersRelation.map((chat) => chat.id);

    return await this.chatRepository.find({
      relations: { users: { user: true } },
      where: { id: In(chatIds) },
    });
  }

  mapChatsToChatsWithName(
    chats: ChatEntity[],
    currentUser: UserEntity,
  ): ChatWithName[] {
    return chats.map((chat) => {
      const members = chat.users.map((member) => member.user);
      const name = this.generateChatName(members, currentUser);

      return { ...chat, name };
    });
  }

  private generateChatName(
    users: UserEntity[],
    currentUser: UserEntity,
  ): string {
    const otherUsers = users.filter((user) => user.id !== currentUser.id);
    // When a user creates a chat with himself
    if (otherUsers.length === 0) {
      return `${currentUser.nickname} (You)`;
    }
    const names = otherUsers.map((user) => user.nickname);
    return names.join(', ');
  }

  async findOne(id: number): Promise<ChatEntity> {
    // TODO: filter all data user from only userid

    const chat = await this.chatRepository.findOne({
      relations: { users: true, messages: { sender: true } },
      where: { id },
      order: { messages: { createdAt: 'ASC' } },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    return chat;
  }

  async addMessage(dto: CreateMessageDto): Promise<MessageEntity> {
    const findUserPromise = this.userRepository.findOneBy({ id: dto.senderId });
    const findChatPromise = this.chatRepository.findOneBy({ id: dto.chatId });

    const [chat, user] = await Promise.all([findChatPromise, findUserPromise]);

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!dto.content) {
      throw new BadRequestException('Message cannot be empty');
    }

    return this.messageRepository.save({
      chat,
      sender: user,
      content: dto.content,
    });
  }
}
