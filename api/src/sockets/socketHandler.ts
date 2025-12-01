import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { logger } from '../utils/logger';
import redis from '../config/redis';

let io: SocketIOServer;

export function initializeSocket(server: HTTPServer) {
  const corsOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
  
  logger.info('Initializing Socket.IO', { 
    module: 'SocketModule', 
    corsOrigin,
    allowedOrigins: corsOrigin 
  });
  
  io = new SocketIOServer(server, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true,
  });

  io.on('connection', (socket) => {
    logger.debug('Client connected', { module: 'SocketModule', socketId: socket.id });

    socket.on('join:user', (userId: string) => {
      socket.join(`user:${userId}`);
      logger.debug('User joined room', { module: 'SocketModule', socketId: socket.id, userId });
    });

    socket.on('join:admin', () => {
      socket.join('admin');
      logger.debug('Admin joined room', { module: 'SocketModule', socketId: socket.id });
    });

    socket.on('disconnect', () => {
      logger.debug('Client disconnected', { module: 'SocketModule', socketId: socket.id });
    });
  });

  const subscriber = redis.duplicate();
  subscriber.subscribe('job:events');
  
  subscriber.on('subscribe', (channel) => {
    logger.debug('Redis pub/sub subscribed', { module: 'SocketModule', channel });
  });
  
  subscriber.on('message', (channel, message) => {
    try {
      const eventData = JSON.parse(message);
      const { event, userId, data } = eventData;
      
      io.to(`user:${userId}`).emit(event, data);
      io.to('admin').emit(event, data);
      
      logger.debug('Job event forwarded', { 
        module: 'SocketModule', 
        event, 
        userId, 
        jobId: data?.jobId
      });
    } catch (error) {
      logger.error('Error processing job event', error as Error, { 
        module: 'SocketModule' 
      });
    }
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}

export function emitJobEvent(userId: string, event: string, data: any) {
  const socketIO = getIO();
  socketIO.to(`user:${userId}`).emit(event, data);
  socketIO.to('admin').emit(event, data);
  logger.debug('Job event emitted', { event, userId, jobId: data.jobId });
}

