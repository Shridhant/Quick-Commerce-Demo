import { sequelize } from '../StandardConfig/SequelizeConfig';
import { Inventory } from './Inventory';
import { initOrderDetailsModel, OrderDetails } from './OrderDetails';
import { initOrderProductModel, OrderProduct } from './OrderProduct';
import { initProductModel, Product } from './Product';
import { VendorServiceRecord } from './ServiceRecord';
import { VendorSRAttachment } from './SrAttachment';
import { Vendor } from './Vendor';
import { Warehouse } from './Warehouse';

// Initialize models
initOrderDetailsModel(sequelize);
initOrderProductModel(sequelize);
initProductModel(sequelize);

// Set up associations
OrderDetails.hasMany(OrderProduct, {
  foreignKey: 'order_id',
  as: 'order_product',
});

OrderDetails.belongsTo(Warehouse, {
  foreignKey: 'warehouse_id',
  as: 'warehouse',
});

OrderProduct.belongsTo(OrderDetails, {
  foreignKey: 'order_id',
  as : 'order'
});

// OrderDetails belongs to Vendor
Vendor.hasMany(OrderDetails, { foreignKey: 'vendor_id' });
OrderDetails.belongsTo(Vendor, { foreignKey: 'vendor_id', as : 'vendor' });

Vendor.hasMany(Inventory, { foreignKey: 'vendor_id', as:'vendor' });
Inventory.belongsTo(Vendor, { foreignKey: 'vendor_id' });

// Warehouse has many inventories
Warehouse.hasMany(Inventory, { foreignKey: 'warehouse_id' });
Inventory.belongsTo(Warehouse, { foreignKey: 'warehouse_id', as : 'warehouse'});

// Optional: If vendors are assigned to a warehouse
Warehouse.hasMany(Vendor, { foreignKey: 'warehouse_id' });
Vendor.belongsTo(Warehouse, { foreignKey: 'warehouse_id' });

OrderProduct.belongsTo(Product, {
  foreignKey: 'product_id',
  targetKey: 'product_id',
  as: 'product',
});


Product.hasMany(OrderProduct, {
  foreignKey: 'product_id',
  sourceKey: 'product_id',
  as : 'order_product'
});

VendorServiceRecord.hasMany(VendorSRAttachment, {
  foreignKey: 'ticket_number',
  sourceKey: 'ticket_number',
  as: 'vendor_srattachment',
});

VendorSRAttachment.belongsTo(VendorServiceRecord, {
  foreignKey: 'ticket_number',
  targetKey: 'ticket_number',
  as: 'vendor_service_record',
});

export {
  sequelize,
  OrderDetails,
  OrderProduct,
  Product,
  Vendor,
  Inventory,
  Warehouse,
  VendorServiceRecord,
  VendorSRAttachment
};
