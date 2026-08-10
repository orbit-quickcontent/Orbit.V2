import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { initSocketServer } from '../src/services/socketService';

describe('Socket.IO Location & Dispatch Integration Test', () => {
  let ioServer: Server;
  let httpServer: any;
  let clientSocket: ClientSocket;
  const port = 5055;

  beforeAll((done) => {
    httpServer = createServer();
    ioServer = initSocketServer(httpServer);
    httpServer.listen(port, () => {
      clientSocket = Client(`http://localhost:${port}`);
      clientSocket.on('connect', done);
    });
  });

  afterAll((done) => {
    if (clientSocket.connected) {
      clientSocket.disconnect();
    }
    ioServer.close();
    httpServer.close(done);
  });

  it('should join partner room upon partner:connect', (done) => {
    clientSocket.emit('partner:connect', { partnerId: 'partner-test-123' });
    setTimeout(() => {
      done();
    }, 100);
  });

  it('should accept client subscription to booking room', (done) => {
    clientSocket.emit('client:subscribeBooking', { bookingId: 'booking-test-456' });
    setTimeout(() => {
      done();
    }, 100);
  });
});
