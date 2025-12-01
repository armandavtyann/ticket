import dotenv from 'dotenv';
import { DatabaseConfig } from '../types/database.types';

dotenv.config();

const dbConfig: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'ticket_db',
  username: process.env.DB_USER || 'ticket_user',
  password: process.env.DB_PASSWORD || 'ticket_password',
  dialect: 'postgres',
};

export default dbConfig;

