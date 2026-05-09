import { DataTypes, Model, Sequelize } from 'sequelize';

export class Product extends Model {
  public product_id!: string;
  public name!: string;
  public description?: string;
  public category?: string;
  public unit?: string;
  public image_url?: string;
  public price!: number;
  public is_active!: boolean;
  public sku?: string;
  public brand?: string;
  public tags?: string;
  public readonly created_at!: Date;
  public expiry_date?: Date | null;
  public unit_size?: number | null;
}

export const initProductModel = (sequelize: Sequelize) => {
  Product.init(
    {
      product_id: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      unit_size: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      description: DataTypes.TEXT,
      category: DataTypes.STRING,
      unit: DataTypes.STRING,
      image_url: DataTypes.TEXT,
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      sku: DataTypes.STRING,
      brand: DataTypes.STRING,
      tags: DataTypes.STRING,
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'product',
      sequelize,
      timestamps: false,
    }
  );
};
