import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ChatsService } from './chats.service';
import { AuthenticatedGuard } from '../auth/guards';
import { User } from '../core/decorators';
import { ChatEntity, ChatMemberEntity, UserEntity } from '../core/entities';
import { CreateChatDto, ChatWithName } from './dto';

@UseGuards(AuthenticatedGuard)
@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Get()
  async findAll(@User() user: UserEntity): Promise<ChatWithName[]> {
    const chats = await this.chatsService.findAll(user);
    return this.chatsService.mapChatsToChatsWithName(chats, user);
  }
  @Get('all')
  async findAllChats(): Promise<ChatEntity[]> {
    return await this.chatsService.listAllChats();
  }

  @Get('with/:userId')
  async findWith(
    @Param('userId', ParseIntPipe) userId: number,
    @User() user: UserEntity,
  ): Promise<ChatEntity> {
    return await this.chatsService.findDirectChat(user, userId);
  }

  @Post()
  async create(
    @Body() dto: CreateChatDto,
    @User() user: UserEntity,
  ): Promise<ChatEntity> {
    return await this.chatsService.create(dto, user);
  }

  @Get(':id')
  async show(@Param('id', ParseIntPipe) id: number) {
    return await this.chatsService.findOne(id);
  }

  @Post(':id/join')
  async joinChat(
    @Param('id', ParseIntPipe) chatId: number,
    @User() user: UserEntity,
  ): Promise<ChatMemberEntity> {
    console.log(chatId);
    console.log(user);
    return await this.chatsService.joinChat(chatId, user);
  }
}
