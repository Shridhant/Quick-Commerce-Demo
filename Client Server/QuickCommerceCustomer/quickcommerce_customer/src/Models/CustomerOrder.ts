// models/CustomerOrder.ts
import { DataTypes, Sequelize } from "sequelize";

export const initCustomerOrderModel = (sequelize: Sequelize) => {
  return sequelize.define(
    "CustomerOrder",
    {
      order_id: { type: DataTypes.STRING(100), primaryKey: true },
      customer_id: { type: DataTypes.STRING(100), allowNull: false },
      total_amount: DataTypes.DECIMAL(10, 2),
      order_status: { type: DataTypes.STRING(50), defaultValue: "CREATED" },
      payment_status: { type: DataTypes.STRING(50), defaultValue: "UNPAID" },
      payment_method: DataTypes.STRING(100),
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      shipping_address_id: DataTypes.INTEGER,
      remarks: DataTypes.TEXT
    },
    {
      tableName: "customer_orders",
      timestamps: false
    }
  );
};
