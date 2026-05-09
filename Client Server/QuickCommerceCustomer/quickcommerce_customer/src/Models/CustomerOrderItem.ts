// models/CustomerOrderItem.ts
import { DataTypes, Sequelize } from "sequelize";

export const initCustomerOrderItemModel = (sequelize: Sequelize) => {
  return sequelize.define(
    "customer_order_items",
    {
      item_id: { type: DataTypes.STRING(100), primaryKey: true },
      order_id: { type: DataTypes.STRING(100), allowNull: false },
      vendor_id: { type: DataTypes.STRING(100), allowNull: false },
      product_id: { type: DataTypes.STRING(100), allowNull: false },
      inventory_id: { type: DataTypes.STRING(100), allowNull: false },
      quantity: DataTypes.INTEGER,
      price_at_purchase: DataTypes.DECIMAL(10, 2)
    },
    {
      tableName: "customer_order_items",
      timestamps: false
    }
  );
};


