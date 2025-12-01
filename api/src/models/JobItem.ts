import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Job from './Job';
import Ticket from './Ticket';

interface JobItemAttributes {
  id: string;
  jobId: string;
  ticketId: string;
  success: boolean;
  error?: string | null;
}

interface JobItemCreationAttributes extends Optional<JobItemAttributes, 'id' | 'error'> {}

class JobItem extends Model<JobItemAttributes, JobItemCreationAttributes> implements JobItemAttributes {
  public id!: string;
  public jobId!: string;
  public ticketId!: string;
  public success!: boolean;
  public error?: string | null;
}

JobItem.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    jobId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'jobs',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    ticketId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'tickets',
        key: 'id',
      },
    },
    success: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    error: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'job_items',
    timestamps: false,
  }
);

// Define associations
JobItem.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });
JobItem.belongsTo(Ticket, { foreignKey: 'ticketId', as: 'ticket' });
Job.hasMany(JobItem, { foreignKey: 'jobId', as: 'items' });
Ticket.hasMany(JobItem, { foreignKey: 'ticketId', as: 'jobItems' });

export default JobItem;

