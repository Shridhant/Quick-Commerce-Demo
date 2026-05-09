import { DataTypes, Model } from 'sequelize';
import {sequelize} from '../StandardConfig/SequelizeConfig'; // import your sequelize instance

export class Warehouse extends Model {}

Warehouse.init({
  warehouse_id: {
    type: DataTypes.STRING(100),
    primaryKey: true,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  address_line1: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  address_line2: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  state: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  postal_code: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  latitude: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  longitude: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  modelName: 'warehouse',
  tableName: 'warehouse',
  timestamps: false, // because you manually defined `created_at` only
});
