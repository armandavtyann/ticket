'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('job_items', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      jobId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'jobs',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      ticketId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'tickets',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      success: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      error: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    });

    // Add indexes for foreign keys and queries
    await queryInterface.addIndex('job_items', ['jobId']);
    await queryInterface.addIndex('job_items', ['ticketId']);
    await queryInterface.addIndex('job_items', ['success']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('job_items');
  },
};

