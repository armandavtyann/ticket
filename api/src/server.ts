import dotenv from 'dotenv';
import { createServer } from 'http';
import app from './app';
import { initializeSocket } from './sockets/socketHandler';
import { logger } from './utils/logger';

dotenv.config();

const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV;

logger.info('Starting Support Ticket Manager API', {
  module: 'Bootstrap',
  port: PORT,
  env: NODE_ENV,
  nodeVersion: process.version,
});

const server = createServer(app);

initializeSocket(server);
logger.info('Socket.IO initialized', { module: 'SocketModule' });

const onError = (error: NodeJS.ErrnoException) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

  switch (error.code) {
    case 'EACCES':
      logger.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
};

const onListening = () => {
  const addr = server.address();
  const port = addr && typeof addr === 'object' ? addr.port : PORT;
  const url = `http://localhost:${port}`;
  
  logger.info(`🚀 Server is running on ${url}`, { module: 'Bootstrap' });
};

server.listen(PORT);
server.on('error', onError);
server.on('listening', onListening);
