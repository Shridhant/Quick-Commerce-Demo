import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../StandardConfig/SequelizeConfig';

export class VendorServiceRecord extends Model {}

VendorServiceRecord.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    ticket_number: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    vendor_id: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    agent_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    subject: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'OPEN',
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    closed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'vendor_service_record',
    tableName: 'vendor_service_record',
    timestamps: false,
  }
);
