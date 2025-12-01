'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add index on createdAt for faster sorting (used in findAll with ORDER BY createdAt DESC)
    // This is CRITICAL for pagination performance with large datasets
    await queryInterface.addIndex('tickets', ['createdAt'], {
      name: 'tickets_created_at_idx',
    });

    // Add composite index on (deletedAt, createdAt) for the common query pattern
    // This optimizes: WHERE deletedAt IS NULL ORDER BY createdAt DESC
    // This is the most important index for the main query!
    await queryInterface.addIndex('tickets', ['deletedAt', 'createdAt'], {
      name: 'tickets_deleted_at_created_at_idx',
    });

    // Add composite index on (status, createdAt) for status filtering with sorting
    await queryInterface.addIndex('tickets', ['status', 'createdAt'], {
      name: 'tickets_status_created_at_idx',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('tickets', 'tickets_created_at_idx');
    await queryInterface.removeIndex('tickets', 'tickets_deleted_at_created_at_idx');
    await queryInterface.removeIndex('tickets', 'tickets_status_created_at_idx');
  },
};

