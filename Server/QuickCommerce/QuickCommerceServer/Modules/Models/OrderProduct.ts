import { DataTypes, Model, Sequelize } from 'sequelize';

export class OrderProduct extends Model {
  public id!: number;
  public order_id!: string;
  public product_id?: string;
  public requested_quantity!: number;
  public product_name?: string;
  public product_brand?: string;
  public product_sku?: string;
  public product_unit?: string;
  public product_image_url?: string;
  public product_description?: string;
  public product_category?: string;
  public product_price?: number;
  public product_tags?: string;
  public readonly created_at!: Date;
  public expiry_date?: Date | null;
  public unit_size?: number | null;
}

export const initOrderProductModel = (sequelize: Sequelize) => {
  OrderProduct.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      order_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      product_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      requested_quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      unit_size: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      product_name: DataTypes.STRING,
      product_brand: DataTypes.STRING,
      product_sku: DataTypes.STRING,
      product_unit: DataTypes.STRING,
      product_image_url: DataTypes.TEXT,
      product_description: DataTypes.TEXT,
      product_category: DataTypes.STRING,
      product_price: DataTypes.DECIMAL(10, 2),
      product_tags: DataTypes.STRING,
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      expiry_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'order_product',
      sequelize,
      timestamps: false,
    }
  );
};
