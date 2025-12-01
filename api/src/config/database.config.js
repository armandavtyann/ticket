/**
 * Database Configuration for Sequelize CLI (CommonJS)
 * Required for Sequelize CLI compatibility - keep in sync with database.config.ts
 */

require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'ticket_db',
  username: process.env.DB_USER || 'ticket_user',
  password: process.env.DB_PASSWORD || 'ticket_password',
  dialect: 'postgres',
};

// Export for Sequelize CLI - single environment
module.exports = dbConfig;

