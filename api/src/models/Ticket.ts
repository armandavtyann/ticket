import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface TicketAttributes {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

interface TicketCreationAttributes extends Optional<TicketAttributes, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'description'> {}

class Ticket extends Model<TicketAttributes, TicketCreationAttributes> implements TicketAttributes {
  public id!: string;
  public title!: string;
  public description?: string | null;
  public status!: string;
  public createdAt!: Date;
  public updatedAt!: Date;
  public deletedAt?: Date | null;
}

Ticket.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'open',
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
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'tickets',
    timestamps: true,
    paranoid: false, // We handle soft delete manually with deletedAt
  }
);

export default Ticket;

