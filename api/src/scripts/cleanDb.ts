import dotenv from 'dotenv';
import sequelize from '../config/database';
import { logger } from '../utils/logger';

dotenv.config();

async function cleanDatabase() {
  try {
    logger.info('Starting database cleanup...', { module: 'CleanDB' });

    // Get all table names
    const [results] = await sequelize.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      AND tablename NOT LIKE 'SequelizeMeta'
    `);

    const tableNames = (results as any[]).map((row: any) => row.tablename);

    if (tableNames.length === 0) {
      logger.info('No tables to drop', { module: 'CleanDB' });
      return;
    }

    logger.info(`Found ${tableNames.length} tables to drop`, { 
      module: 'CleanDB',
      tables: tableNames 
    });

    // Drop all tables
    for (const tableName of tableNames) {
      await sequelize.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
      logger.info(`Dropped table: ${tableName}`, { module: 'CleanDB' });
    }

    // Clear SequelizeMeta table to allow migrations to be re-run from scratch
    const [sequelizeMetaExists] = await sequelize.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      AND tablename = 'SequelizeMeta'
    `);

    if ((sequelizeMetaExists as any[]).length > 0) {
      logger.info('Clearing SequelizeMeta table', { module: 'CleanDB' });
      await sequelize.query('TRUNCATE TABLE "SequelizeMeta"');
      logger.info('SequelizeMeta table cleared', { module: 'CleanDB' });
    }

    logger.info('Database cleanup completed successfully. All tables dropped and SequelizeMeta cleared.', { module: 'CleanDB' });
  } catch (error) {
    logger.error('Database cleanup failed', error as Error, { module: 'CleanDB' });
    throw error;
  } finally {
    await sequelize.close();
  }
}

cleanDatabase();

