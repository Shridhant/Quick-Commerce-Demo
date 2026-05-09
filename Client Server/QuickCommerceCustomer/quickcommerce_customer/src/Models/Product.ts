// models/Product.ts
import { DataTypes, Sequelize } from "sequelize";

export const initProductModel = (sequelize: Sequelize) => {
  return sequelize.define(
    "Product",
    {
      product_id: { type: DataTypes.STRING(100), primaryKey: true },
      name: DataTypes.STRING,
      description: DataTypes.TEXT,
      category: DataTypes.STRING(100),
      unit: DataTypes.STRING(50),
      image_url: DataTypes.TEXT,
      price: DataTypes.DECIMAL(10, 2),
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
      sku: DataTypes.STRING(100),
      brand: DataTypes.STRING(100),
      tags: DataTypes.STRING(500),
      offer_price: DataTypes.DECIMAL(10, 2),
      expiry_date: DataTypes.DATE,
      unit_size: DataTypes.INTEGER,
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    },
    {
      tableName: "product",
      timestamps: false
    }
  );
};
