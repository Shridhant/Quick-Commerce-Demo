import mysql, { Connection, RowDataPacket } from 'mysql2/promise'
import { MYSQL_DATABASE, MYSQL_HOST, MYSQL_PASSWORD, MYSQL_USER, NODE_ENV } from '../Config/SettingReader';
import { create } from 'domain';

export async function setUpCustomerDatabase(): Promise<void> {
  let connection: Connection | undefined;
  try {
    connection = await mysql.createConnection({
      host: MYSQL_HOST,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD
    })
    const [dbResult]: any = await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${MYSQL_DATABASE}\`;`
    );
    if (dbResult.warningStatus === 0) {
      console.log(`Database '${MYSQL_DATABASE}' created.`);
    } else {
      console.log(`Using existing database '${MYSQL_DATABASE}'.`);
    }

    // Switch to the database
    await connection.query(`USE \`${MYSQL_DATABASE}\`;`);

    if (NODE_ENV === 'development') {
      await createCustomerTable(connection);
      await createCustomerAddressTable(connection);
      await createCustomerCartTable(connection);
      await createCustomerOrderTable(connection);
      await createCustomerOrderItems(connection);
      await createCustomerPayment(connection);
      await createCustomerPaymentOrder(connection);
      await createProductReviewTable(connection);
      await createErrorLogs(connection);
      await createLogs(connection);
      await createCustomerPushTokenTable(connection);
      await createCustomerExchangeOrders(connection);
      await createExchangeOrderItems(connection);
      await createExchangeOrderFiles(connection);
      await createCustomerOrderDeliveries(connection);
    }

  } catch (err) {
    throw err;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function createCustomerTable(connection: Connection) {
  const [tableResult] = await connection.query(`
    CREATE TABLE IF NOT EXISTS customer (
        customer_id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255),
        password VARCHAR(255),
        email VARCHAR(30),
        phone VARCHAR(20),
        status VARCHAR(20),
        isActive BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  const [rows] = await connection.query<RowDataPacket[]>(`
       SELECT 1 FROM customer LIMIT 1;
      `);
  if (rows.length >= 0) {
    console.log("customer table created");
  }
}

async function createCustomerCartTable(connection: Connection) {
  const [tableResult] = await connection.query(`
    CREATE TABLE IF NOT EXISTS cart_items (
    cart_item_id VARCHAR(100) PRIMARY KEY,
    customer_id VARCHAR(100) NOT NULL,
    product_id VARCHAR(100) NOT NULL,
    vendor_id VARCHAR(100) NOT NULL,
    inventory_id VARCHAR(100) NOT NULL,
    quantity INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uk_customer_product (customer_id, product_id),

    FOREIGN KEY (customer_id) REFERENCES customer(customer_id),
    FOREIGN KEY (product_id) REFERENCES product(product_id)
    );
  `);
  const [rows] = await connection.query<RowDataPacket[]>(`
       SELECT 1 FROM cart_items LIMIT 1;
      `);
  if (rows.length >= 0) {
    console.log("cart_items table created");
  }
}

async function createCustomerAddressTable(connection: Connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS customer_addresses (
      address_id INT AUTO_INCREMENT PRIMARY KEY,
      customer_id VARCHAR(100) NOT NULL,
      address_line1 VARCHAR(255) NOT NULL,
      address_line2 VARCHAR(255),
      city VARCHAR(100),
      state VARCHAR(100),
      postal_code VARCHAR(20),
      country VARCHAR(100),
      latitude DECIMAL(9,6),
      longitude DECIMAL(9,6),
      landmark VARCHAR(500),
      phone_number VARCHAR(20),
      is_default BOOLEAN DEFAULT FALSE,
      FOREIGN KEY (customer_id) REFERENCES customer(customer_id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_customer (customer_id),
      INDEX idx_default (customer_id, is_default)
    ) AUTO_INCREMENT=10000;
  `);

  const [rows] = await connection.query<RowDataPacket[]>(`
    SELECT 1 FROM customer_addresses LIMIT 1;
  `);

  if (rows.length >= 0) {
    console.log("customer_addresses table created");
  }
}

async function createCustomerOrderDeliveries(connection: Connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS customer_order_deliveries (
      delivery_id VARCHAR(100) NOT NULL,
      order_id VARCHAR(100) NOT NULL,
      driver_id VARCHAR(100) NOT NULL,
      assigned_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      picked_up_at TIMESTAMP NULL DEFAULT NULL,
      delivered_at TIMESTAMP NULL DEFAULT NULL,
      delivery_status ENUM('ASSIGNED','PICKED_UP','DELIVERED','CANCELLED') 
        NOT NULL DEFAULT 'ASSIGNED',
      delivery_notes TEXT,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (delivery_id),
      KEY order_id (order_id),
      KEY driver_id (driver_id),
      CONSTRAINT fk_delivery_order 
        FOREIGN KEY (order_id) REFERENCES customer_orders(order_id),
      CONSTRAINT fk_delivery_driver 
        FOREIGN KEY (driver_id) REFERENCES driver(driver_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  const [rows] = await connection.query<RowDataPacket[]>(`
    SELECT 1 FROM customer_order_deliveries LIMIT 1;
  `);

  if (rows.length >= 0) {
    console.log("customer_order_deliveries table created");
  }
}

async function createCustomerOrderTable(connection: Connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS customer_orders (
    order_id VARCHAR(100) PRIMARY KEY,
    customer_id VARCHAR(100) NOT NULL,
    total_amount DECIMAL(10,2),
    order_status VARCHAR(50) DEFAULT 'CREATED',
    payment_status VARCHAR(50) DEFAULT 'UNPAID',
    payment_method VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    shipping_address_id INT NOT NULL,
    remarks TEXT,
    FOREIGN KEY (customer_id) REFERENCES customer(customer_id)
    );
  `);

  const [rows] = await connection.query<RowDataPacket[]>(`
    SELECT 1 FROM customer_orders LIMIT 1;
  `);

  if (rows.length >= 0) {
    console.log("customer_orders table created");
  }
}

async function createCustomerOrderItems(connection: Connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS customer_order_items (
    item_id VARCHAR(100) PRIMARY KEY,
    order_id VARCHAR(100) NOT NULL,
    cart_id VARCHAR(100),
    vendor_id VARCHAR(100) NOT NULL,
    product_id VARCHAR(100) NOT NULL,
    inventory_id VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    price_at_purchase DECIMAL(10,2) NOT NULL,

    FOREIGN KEY (order_id) REFERENCES customer_orders(order_id),
    FOREIGN KEY (product_id) REFERENCES product(product_id)
    );
  `);

  const [rows] = await connection.query<RowDataPacket[]>(`
    SELECT 1 FROM customer_order_items LIMIT 1;
  `);

  if (rows.length >= 0) {
    console.log("customer_order_items table created");
  }
}

async function createCustomerPayment(connection: Connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id VARCHAR(100) NOT NULL,
    order_id VARCHAR(100) NOT NULL,
    razorpay_order_id VARCHAR(255) UNIQUE,
    razorpay_payment_id VARCHAR(255),
    razorpay_signature VARCHAR(255),
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    status VARCHAR(50),
    method VARCHAR(50),
    error_code VARCHAR(100),
    error_description TEXT,
    description TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  );
  `);

  const [rows] = await connection.query<RowDataPacket[]>(`
    SELECT 1 FROM payments LIMIT 1;
  `);

  if (rows.length >= 0) {
    console.log("payments table created");
  }
}

async function createCustomerPaymentOrder(connection: Connection) {
  await connection.query(`
      CREATE TABLE IF NOT EXISTS payment_orders (
     id INT AUTO_INCREMENT PRIMARY KEY,
     customer_id VARCHAR(100) NOT NULL,
     order_id VARCHAR(100) NOT NULL,
     razorpay_order_id VARCHAR(128) UNIQUE,
     total_amount DECIMAL(10,2) NOT NULL,
     currency VARCHAR(10) DEFAULT 'INR',
     payment_status VARCHAR(50),
     remarks TEXT,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (customer_id) REFERENCES customer (customer_id)
   );
  `);

  const [rows] = await connection.query<RowDataPacket[]>(`
    SELECT 1 FROM payment_orders LIMIT 1;
  `);

  if (rows.length >= 0) {
    console.log("papayment_orders table created");
  }
}

async function createProductReviewTable(connection: Connection) {
  const [tableResult] = await connection.query(`
    CREATE TABLE IF NOT EXISTS recently_viewed_product (
     id INT AUTO_INCREMENT PRIMARY KEY,
     customer_id VARCHAR(100) NOT NULL,
     product_id VARCHAR(100) NOT NULL,
     viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     UNIQUE KEY unique_customer_product (customer_id, product_id)
    );
  `);
  const [rows] = await connection.query<RowDataPacket[]>(`
       SELECT 1 FROM recently_viewed_product LIMIT 1;
      `);
  if (rows.length >= 0) {
    console.log("recently_viewed_product table created");
  }
}

async function createErrorLogs(connection: Connection) {
  const [tableResult] = await connection.query(`
    CREATE TABLE IF NOT EXISTS error_logs (
     id INT AUTO_INCREMENT PRIMARY KEY,
     title VARCHAR(255) NOT NULL,
     description TEXT,
     stack_trace TEXT,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  const [rows] = await connection.query<RowDataPacket[]>(`
       SELECT 1 FROM error_logs LIMIT 1;
      `);
  if (rows.length >= 0) {
    console.log("error_logs table created");
  }
}

async function createLogs(connection: Connection) {
  const [tableResult] = await connection.query(`
    CREATE TABLE IF NOT EXISTS app_logs (
     id INT AUTO_INCREMENT PRIMARY KEY,
     title VARCHAR(255) NOT NULL,
     description TEXT,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  const [rows] = await connection.query<RowDataPacket[]>(`
       SELECT 1 FROM app_logs LIMIT 1;
      `);
  if (rows.length >= 0) {
    console.log("app_logs table created");
  }
}

async function createCustomerPushTokenTable(connection: Connection) {
  const [tableResult] = await connection.query(`
  CREATE TABLE IF NOT EXISTS customer_push_tokens (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  customer_id VARCHAR(100) NOT NULL,
  push_token VARCHAR(512) NOT NULL,
  platform ENUM('ANDROID', 'IOS', 'WEB') NOT NULL,
  device_id VARCHAR(255) DEFAULT NULL,
  device_model VARCHAR(255) DEFAULT NULL,
  app_version VARCHAR(50) DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uniq_token (push_token),
  UNIQUE KEY uniq_customer_platform (customer_id, platform),
  INDEX idx_customer (customer_id),
  INDEX idx_active (is_active)
  );

  `);
  const [rows] = await connection.query<RowDataPacket[]>(`
       SELECT 1 FROM customer_push_tokens LIMIT 1;
      `);
  if (rows.length >= 0) {
    console.log("customer_push_tokens table created");
  }
}

async function createCustomerExchangeOrders(connection: Connection) {
  const [tableResult] = await connection.query(`
  CREATE TABLE IF NOT EXISTS order_exchanges (
  exchange_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_id VARCHAR(100) NOT NULL,
  customer_id VARCHAR(100) NOT NULL,
  reason VARCHAR(255),
  notes  TEXT,
  status VARCHAR(20),
  replacement_order_id VARCHAR(100),
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


  `);
  const [rows] = await connection.query<RowDataPacket[]>(`
       SELECT 1 FROM customer_push_tokens LIMIT 1;
      `);
  if (rows.length >= 0) {
    console.log("customer_push_tokens table created");
  }
}

async function createExchangeOrderItems(connection: Connection) {
  const [tableResult] = await connection.query(`
  CREATE TABLE IF NOT EXISTS order_exchange_items (
  exchange_item_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  exchange_id BIGINT NOT NULL,
  customer_id VARCHAR(100),
  vendor_id VARCHAR(100),
  product_id VARCHAR(100) NOT NULL,
  inventory_id VARCHAR(100) NOT NULL,
  quantity INT NOT NULL,
  condition_status VARCHAR(20),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (exchange_id) REFERENCES order_exchanges(exchange_id)
);  `);
  const [rows] = await connection.query<RowDataPacket[]>(`
       SELECT 1 FROM order_exchange_items LIMIT 1;
      `);
  if (rows.length >= 0) {
    console.log("order_exchange_items table created");
  }
}

async function createExchangeOrderFiles(connection: Connection) {
  const [tableResult] = await connection.query(`
  CREATE TABLE IF NOT EXISTS order_exchange_file (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  exchange_id BIGINT NOT NULL,
  filename VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);  `);
  const [rows] = await connection.query<RowDataPacket[]>(`
       SELECT 1 FROM order_exchange_file LIMIT 1;
      `);
  if (rows.length >= 0) {
    console.log("order_exchange_file table created");
  }
}



