import { DataTypes, Model } from 'sequelize';
import {sequelize} from '../StandardConfig/SequelizeConfig'; // your sequelize instance

export class Vendor extends Model {}

Vendor.init({
  vendor_id: {
    type: DataTypes.STRING(100),
    primaryKey: true,
    allowNull: false,
  },
  name: DataTypes.STRING(255),
  business_owner_name: DataTypes.STRING(255),
  password: DataTypes.STRING(255),
  email: DataTypes.STRING(255),
  phone: DataTypes.STRING(20),
  address_line1: DataTypes.STRING(255),
  address_line2: DataTypes.STRING(255),
  city: DataTypes.STRING(100),
  state: DataTypes.STRING(100),
  postal_code: DataTypes.STRING(20),
  latitude: DataTypes.FLOAT,
  longitude: DataTypes.FLOAT,
  status: DataTypes.STRING(50),
  country: DataTypes.STRING(100),
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isDocumentUploaded: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isDocumentVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  gstId: DataTypes.STRING(50),
  gstFile: DataTypes.STRING(255),
  tradeLicenseFile: DataTypes.STRING(255),
  store_image: DataTypes.STRING(255),
  remarks: DataTypes.TEXT,
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}, {
  sequelize,
  modelName: 'vendor',
  tableName: 'vendors',
  timestamps: false,
});
