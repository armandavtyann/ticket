import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import JobItem from './JobItem';

interface JobAttributes {
  id: string;
  type: string;
  status: string;
  progress: number;
  payload: any;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface JobCreationAttributes extends Optional<JobAttributes, 'id' | 'createdAt' | 'updatedAt' | 'progress'> {}

class Job extends Model<JobAttributes, JobCreationAttributes> implements JobAttributes {
  public id!: string;
  public type!: string;
  public status!: string;
  public progress!: number;
  public payload!: any;
  public userId!: string;
  public createdAt!: Date;
  public updatedAt!: Date;

  // Association properties
  public items?: JobItem[];
}

Job.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'queued',
    },
    progress: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    payload: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'jobs',
    timestamps: true,
  }
);

export default Job;

