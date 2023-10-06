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
import { CreateChatDto } from './dto/CreateChatDto.dto';
import { AuthenticatedGuard } from '../auth/guards';
import { GetUser } from '../core/decorators';
import { UserEntity } from '../core/entities';
import { ChatWithName } from './dto/ChatWithName.dto';

@UseGuards(AuthenticatedGuard)
@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Get()
  async findAll(@GetUser() user: UserEntity): Promise<ChatWithName[]> {
    const chats = await this.chatsService.findAll(user);
    return this.chatsService.mapChatsToChatsWithName(chats, user);
  }

  @Post()
  create(@Body() createchatsDto: CreateChatDto, @GetUser() user: UserEntity) {
    createchatsDto.userIds.push(user.id);
    return this.chatsService.create(createchatsDto);
  }

  @Get(':id')
  async show(@Param('id', ParseIntPipe) id: number) {
    return this.chatsService.findOne(id);
  }
}