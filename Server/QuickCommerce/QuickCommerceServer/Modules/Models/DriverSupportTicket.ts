import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../StandardConfig/SequelizeConfig';

export class DriverSupportTicket extends Model {}

DriverSupportTicket.init(
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
    driver_id: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
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
  },
  {
    sequelize,
    modelName: 'driver_support_ticket',
    tableName: 'driver_support_ticket',
    timestamps: false,
  }
);

/*
  SQL to create the table:

  CREATE TABLE driver_support_ticket (
    id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ticket_number VARCHAR(100) NOT NULL UNIQUE,
    driver_id  VARCHAR(100) NOT NULL,
    category   VARCHAR(100) NOT NULL,
    message    TEXT         NOT NULL,
    status     VARCHAR(50)  NOT NULL DEFAULT 'OPEN',
    created_at DATETIME     NOT NULL DEFAULT NOW(),
    updated_at DATETIME     NOT NULL DEFAULT NOW()
  );
*/
