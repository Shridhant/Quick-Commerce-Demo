import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../StandardConfig/SequelizeConfig';

export class VendorSRAttachment extends Model {}

VendorSRAttachment.init(
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
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'vendor_srattachment',
    tableName: 'vendor_srattachment',
    timestamps: false,
  }
);
