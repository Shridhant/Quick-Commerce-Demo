import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../StandardConfig/SequelizeConfig';

export class Inventory extends Model { }

Inventory.init({
  inventory_id: {
    type: DataTypes.STRING(100),
    primaryKey: true
  },
  warehouse_id: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  product_id: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  vendor_id: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  price: DataTypes.DECIMAL(10, 2),

  offer_price: DataTypes.DECIMAL(10, 2),
  
  expiry_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  last_updated: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  modelName: 'inventory',
  tableName: 'inventory',
  timestamps: false,
});
