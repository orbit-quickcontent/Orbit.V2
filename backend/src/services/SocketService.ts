import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

export class SocketService {
  private static io: SocketIOServer | null = null;

  public static initialize(server: HttpServer): SocketIOServer {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    this.io.on('connection', (socket: Socket) => {
      console.log(`[SocketService] Client connected: ${socket.id}`);

      socket.on('joinRoom', (room: string) => {
        socket.join(room);
        console.log(`[SocketService] Socket ${socket.id} joined room ${room}`);
      });

      socket.on('leaveRoom', (room: string) => {
        socket.leave(room);
        console.log(`[SocketService] Socket ${socket.id} left room ${room}`);
      });

      socket.on('disconnect', () => {
        console.log(`[SocketService] Client disconnected: ${socket.id}`);
      });
    });

    return this.io;
  }

  public static emitToRoom(room: string, event: string, data: any): void {
    if (this.io) {
      this.io.to(room).emit(event, data);
    } else {
      console.warn('[SocketService] Socket.IO instance not initialized yet.');
    }
  }

  public static broadcast(event: string, data: any): void {
    if (this.io) {
      this.io.emit(event, data);
    }
  }
}
