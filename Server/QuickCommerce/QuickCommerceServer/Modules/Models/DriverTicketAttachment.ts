import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../StandardConfig/SequelizeConfig';

export class DriverTicketAttachment extends Model {}

DriverTicketAttachment.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    ticket_number: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    filename: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    original_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'driver_ticket_attachment',
    tableName: 'driver_ticket_attachment',
    timestamps: false,
  }
);

/*
  SQL to create the table:

  CREATE TABLE driver_ticket_attachment (
    id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ticket_number VARCHAR(100) NOT NULL,
    filename      VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    created_at    DATETIME NOT NULL DEFAULT NOW()
  );
*/
