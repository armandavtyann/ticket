import sequelize from '../config/database';
import Ticket from '../models/Ticket';
import { logger } from '../utils/logger';

const TICKET_STATUSES = ['open', 'in-progress', 'resolved', 'closed'];
const SAMPLE_TITLES = [
  'Login issue',
  'Payment processing error',
  'Feature request: Dark mode',
  'Account verification problem',
  'Password reset not working',
  'API rate limit exceeded',
  'Dashboard loading slowly',
  'Email notifications not received',
  'Profile picture upload failed',
  'Subscription renewal issue',
  'Two-factor authentication setup',
  'Data export functionality',
  'Search results inaccurate',
  'Mobile app crash on iOS',
  'Integration with third-party service',
];

const SAMPLE_DESCRIPTIONS = [
  'User unable to log in with correct credentials',
  'Payment gateway returning error 500',
  'Request for dark mode theme option',
  'Email verification link expired',
  'Password reset email not arriving',
  'API calls being throttled unexpectedly',
  'Dashboard takes 30+ seconds to load',
  'Email notifications missing from inbox',
  'Profile picture upload fails with error',
  'Subscription not renewing automatically',
  'Need help setting up 2FA',
  'Export feature not generating correct format',
  'Search returning irrelevant results',
  'App crashes when opening settings',
  'Third-party API integration failing',
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateRandomTicket() {
  return {
    title: getRandomElement(SAMPLE_TITLES),
    description: getRandomElement(SAMPLE_DESCRIPTIONS),
    status: getRandomElement(TICKET_STATUSES),
  };
}

async function seed() {
  try {
    logger.info('Starting seed process...');

    // Note: Run migrations first with: npm run db:migrate
    // This script assumes tables already exist

    const TARGET_COUNT = 5000;
    const BATCH_SIZE = 100;

    // Check current count
    const currentCount = await Ticket.count({
      where: { deletedAt: null },
    });

    if (currentCount >= TARGET_COUNT) {
      logger.info(`Already have ${currentCount} tickets. Skipping seed.`);
      return;
    }

    const ticketsToCreate = TARGET_COUNT - currentCount;
    logger.info(`Creating ${ticketsToCreate} tickets...`);

    // Create tickets in batches
    for (let i = 0; i < ticketsToCreate; i += BATCH_SIZE) {
      const batch = Array.from({ length: Math.min(BATCH_SIZE, ticketsToCreate - i) }, () =>
        generateRandomTicket()
      );

      await Ticket.bulkCreate(batch);

      logger.info(`Created batch ${Math.floor(i / BATCH_SIZE) + 1} (${i + batch.length}/${ticketsToCreate})`);
    }

    const finalCount = await Ticket.count({
      where: { deletedAt: null },
    });

    logger.info(`Seed completed! Total tickets: ${finalCount}`);
  } catch (error) {
    logger.error('Seed failed', error as Error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

seed();

