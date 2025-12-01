'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add composite index on (userId, createdAt) for user-specific job queries with sorting
    // This optimizes: WHERE userId = ? ORDER BY createdAt DESC
    await queryInterface.addIndex('jobs', ['userId', 'createdAt'], {
      name: 'jobs_user_id_created_at_idx',
    });

    // Add composite index on (type, status, createdAt) for filtered job queries
    // This optimizes: WHERE type = ? AND status = ? ORDER BY createdAt DESC
    await queryInterface.addIndex('jobs', ['type', 'status', 'createdAt'], {
      name: 'jobs_type_status_created_at_idx',
    });

    // Add composite index on (jobId, success) for summary queries
    // This optimizes: WHERE jobId = ? AND success = ? (for counting succeeded/failed)
    await queryInterface.addIndex('job_items', ['jobId', 'success'], {
      name: 'job_items_job_id_success_idx',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('jobs', 'jobs_user_id_created_at_idx');
    await queryInterface.removeIndex('jobs', 'jobs_type_status_created_at_idx');
    await queryInterface.removeIndex('job_items', 'job_items_job_id_success_idx');
  },
};

