import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SessionsService } from '../sessions/sessions.service';
import { UsersService } from '../users/users.service';
import { Session } from '../core/entities';
import { UserStatus } from '../core/entities';
import * as cookie from 'cookie';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
  },
  cookie: true,
})
export class StatusGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly userService: UsersService,
    private readonly sessionService: SessionsService,
  ) {}

  // Called when a client connects to the server
  async handleConnection(client: Socket) {
    const session = await this.getSession(client);
    if (!session) return;

    const userId = session.user_id;
    this.sessionService.updateSession(session.id, { socketId: client.id });
    this.userService.updateUser(userId, { status: UserStatus.ONLINE });
    this.emitUserStatus(userId, UserStatus.ONLINE);
  }

  // Called when a client disconnects from the server
  async handleDisconnect(client: Socket) {
    const session = await this.sessionService.getSessionBySocketId(client.id);
    if (!session) return;

    const userId = session.user_id;
    this.sessionService.updateSession(session.id, { socketId: null });
    this.userService.updateUser(userId, { status: UserStatus.OFFLINE });
    this.emitUserStatus(userId, UserStatus.OFFLINE);
  }

  // Emit user status to all clients connected via websocket
  emitUserStatus(user_id: number, status: string) {
    this.server.emit('userStatus', { id: user_id, status });
  }

  async getSession(client: Socket): Promise<Session> {
    const sessionId = this.getSessionId(client);
    return await this.sessionService.getSessionById(sessionId);
  }

  getSessionId(client: Socket): string {
    const cookies = cookie.parse(client.handshake.headers.cookie || '');
    const sessionCookie = cookies['connect.sid'];
    return this.extractSessionId(sessionCookie);
  }

  extractSessionId(sessionId: string): string {
    if (!sessionId) return '';

    const prefixIndex = sessionId.indexOf(':');
    const dotIndex = sessionId.indexOf('.');
    return sessionId.substring(prefixIndex + 1, dotIndex);
  }
}
