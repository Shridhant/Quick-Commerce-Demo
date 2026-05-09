import { sequelize } from "../Config/SequelizeConfig";
import { initProductModel } from "./Product";
import { initCustomerOrderModel } from "./CustomerOrder";
import { initCustomerOrderItemModel } from "./CustomerOrderItem";

// Init models
export const Product = initProductModel(sequelize);
export const CustomerOrder = initCustomerOrderModel(sequelize);
export const CustomerOrderItem = initCustomerOrderItemModel(sequelize);

/* -------------------- Associations -------------------- */

// Order → OrderItems (1:M)
CustomerOrder.hasMany(CustomerOrderItem, {
  foreignKey: "order_id",
  as: "customer_order_items"
});

CustomerOrderItem.belongsTo(CustomerOrder, {
  foreignKey: "order_id",
  as: "order"
});

// OrderItem → Product (M:1)
CustomerOrderItem.belongsTo(Product, {
  foreignKey: "product_id",
  targetKey: "product_id",
  as: "product"
});

Product.hasMany(CustomerOrderItem, {
  foreignKey: "product_id",
  sourceKey: "product_id",
  as: "order_items"
});
