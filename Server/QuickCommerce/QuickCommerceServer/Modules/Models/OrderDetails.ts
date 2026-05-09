import { DataTypes, Model,Sequelize } from 'sequelize';

export class OrderDetails extends Model {
  public order_id!: string;
  public vendor_id!: string;
  public warehouse_id?: string;
  public type!: string;
  public order_status!: string;
  public product_status!: string;
  public remarks?: string;
  public readonly created_at!: Date;
}

export const initOrderDetailsModel = (sequelize: Sequelize) => {
  OrderDetails.init(
    {
      order_id: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      vendor_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      warehouse_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      order_status: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      product_status: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'order_details',
      sequelize,
      timestamps: false,
    }
  );
};
