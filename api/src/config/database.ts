import { Sequelize } from 'sequelize';
import { logger } from '../utils/logger';
import dbConfig from './database.config';

const sequelizeConfig = {
  ...dbConfig,
  logging: process.env.NODE_ENV === 'development' 
    ? (msg: string) => logger.debug(msg, { module: 'DatabaseModule' })
    : false,
  pool: {
    max: parseInt(process.env.DB_POOL_MAX || '5', 10),
    min: parseInt(process.env.DB_POOL_MIN || '0', 10),
    acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000', 10),
    idle: parseInt(process.env.DB_POOL_IDLE || '10000', 10),
  },
  dialectOptions: {},
};

const sequelize = new Sequelize(sequelizeConfig);

sequelize.authenticate()
  .then(() => {
    logger.info('Database connected', { 
      module: 'DatabaseModule',
      provider: 'postgresql',
      host: dbConfig.host,
      database: dbConfig.database,
    });
  })
  .catch((err: Error) => {
    logger.error('Database connection failed', err, { module: 'DatabaseModule' });
  });

export default sequelize;
