import mysql, { Connection, RowDataPacket } from "mysql2/promise";
import {
  MYSQL_DATABASE,
  MYSQL_HOST,
  MYSQL_PASSWORD,
  MYSQL_USER,
} from "../../StandardConfig/SettingsReader";

export async function setUpRequiredSchema(): Promise<void> {
  let connection: Connection | undefined;
  try {
    connection = await mysql.createConnection({
      host: MYSQL_HOST,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
    });
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

    await createUserTable(connection);
    await createDriverTable(connection);
    await createAdminTable(connection);
    await createWarehouseTable(connection);
    await createProductTable(connection);
    await createVendorsTable(connection);
    await createInventoryTable(connection);
    await createPreRegisteredProductTable(connection);
    await createOrderTable(connection);
    await createOrderProductTable(connection);
    await createProductCategory(connection);
    await createCustomerOrderDeliveries(connection);
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
    await createProductGroupTable(connection);

  } catch (err) {
    throw err;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function createAdminTable(connection: Connection) {
  const [tableResult] = await connection.query(`
CREATE TABLE IF NOT EXISTS system_user (
    admin_id INT AUTO_INCREMENT UNIQUE,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'ADMIN',
    email VARCHAR(255) PRIMARY KEY,
    assigned_warehouse VARCHAR(100),
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
  `);
  const [rows] = await connection.query<RowDataPacket[]>(`
       SELECT 1 FROM system_user LIMIT 1;
      `);
  if (rows.length >= 0) {
    console.log("system_user table created");
  }
}

async function createOrderTable(connection: Connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS order_details (
      order_id VARCHAR(50) NOT NULL,
      vendor_id VARCHAR(100) NOT NULL,
      warehouse_id VARCHAR(100) DEFAULT NULL,
      driver_name VARCHAR(255) DEFAULT NULL,
      driver_phone VARCHAR(20) DEFAULT NULL,
      vehicle_number VARCHAR(50) DEFAULT NULL,
      pickup_date DATE DEFAULT NULL,
      pickup_time_start TIME DEFAULT NULL,
      pickup_time_end TIME DEFAULT NULL,
      pickup_notes TEXT,
      type VARCHAR(50) NOT NULL,
      order_status VARCHAR(50) NOT NULL,
      product_status VARCHAR(50) NOT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      remarks TEXT,
      PRIMARY KEY (order_id),
      KEY vendor_id (vendor_id),
      CONSTRAINT order_details_ibfk_1 FOREIGN KEY (vendor_id) REFERENCES vendors (vendor_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  `);


  const [rows] = await connection.query<RowDataPacket[]>(`
    SELECT 1 FROM order_details LIMIT 1;
  `);

  if (rows.length >= 0) {
    console.log("✅ order_details table created or already exists.");
  }
}

async function createVendorsTable(connection: Connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS vendors (
      vendor_id VARCHAR(100) NOT NULL,
      vendor_type ENUM('SELF_REGISTERED','ADMIN_CREATED') DEFAULT 'SELF_REGISTERED',
      created_by VARCHAR(100) DEFAULT NULL,
      is_company_vendor TINYINT(1) DEFAULT '0',
      business_owner_name VARCHAR(255) DEFAULT NULL,
      name VARCHAR(255) DEFAULT NULL,
      password VARCHAR(255) DEFAULT NULL,
      email VARCHAR(255) DEFAULT NULL,
      phone VARCHAR(20) DEFAULT NULL,
      address_line1 VARCHAR(255) DEFAULT NULL,
      address_line2 VARCHAR(255) DEFAULT NULL,
      city VARCHAR(100) DEFAULT NULL,
      state VARCHAR(100) DEFAULT NULL,
      postal_code VARCHAR(20) DEFAULT NULL,
      latitude FLOAT DEFAULT NULL,
      longitude FLOAT DEFAULT NULL,
      status VARCHAR(50) DEFAULT NULL,
      country VARCHAR(100) DEFAULT NULL,
      isActive TINYINT(1) DEFAULT '0',
      isDocumentUploaded TINYINT(1) DEFAULT '0',
      isDocumentVerified TINYINT(1) DEFAULT '0',
      gstId VARCHAR(50) DEFAULT NULL,
      gstFile VARCHAR(255) DEFAULT NULL,
      tradeLicenseFile VARCHAR(255) DEFAULT NULL,
      store_image VARCHAR(255) DEFAULT NULL,
      remarks TEXT,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (vendor_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  `);
  console.log("✅ vendors table created or already exists.");
}

async function createOrderProductTable(connection: Connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS order_product (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id VARCHAR(50),
      requested_quantity INT,
      product_name VARCHAR(255),
      product_brand VARCHAR(100),
      product_sku VARCHAR(100),
      product_unit VARCHAR(50),
      product_image_url TEXT,
      product_description TEXT,
      product_category VARCHAR(255),
      product_price DECIMAL(10, 2),
      product_tags VARCHAR(500),
      product_id VARCHAR(100),
      offer_price DECIMAL(10, 2),
      expiry_date DATETIME,
      unit_size INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const [rows] = await connection.query<RowDataPacket[]>(`
    SELECT 1 FROM order_product LIMIT 1;
  `);

  if (rows.length >= 0) {
    console.log("✅ order_product table created or already exists.");
  }
}

async function createProductTable(connection: Connection) {
  const [tableResult] = await connection.query(`
    CREATE TABLE IF NOT EXISTS product (
    product_id VARCHAR(100) PRIMARY KEY,
    group_id VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    unit VARCHAR(50),
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sku VARCHAR(100),
    brand VARCHAR(100),
    tags VARCHAR(500),
    unit_size INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    KEY idx_product_name (name),
    KEY idx_product_category (category),
    KEY idx_product_brand (brand),
    KEY idx_product_sku (sku)
    );
  `);
  const [rows] = await connection.query<RowDataPacket[]>(`
       SELECT 1 FROM product LIMIT 1;
      `);
  if (rows.length >= 0) {
    console.log("product table created");
  }
}

async function createProductGroupTable(connection: Connection) {
  const [tableResult] = await connection.query(`
CREATE TABLE IF NOT EXISTS product_group (
  group_id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(255),
  category VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
  `);
  const [rows] = await connection.query<RowDataPacket[]>(`
       SELECT 1 FROM product_group LIMIT 1;
      `);
  if (rows.length >= 0) {
    console.log("product_group table created");
  }
}

async function createPreRegisteredProductTable(connection: Connection) {
  const [tableResult] = await connection.query(`
    CREATE TABLE IF NOT EXISTS pre_registered_product (
    pre_product_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE
    );
  `);
  const [rows] = await connection.query<RowDataPacket[]>(`
       SELECT 1 FROM pre_registered_product LIMIT 1;
      `);
  if (rows.length >= 0) {
    console.log("pre_registered_product table created");
  }
}

async function createInventoryTable(connection: Connection) {
  const [tableResult] = await connection.query(`
    CREATE TABLE IF NOT EXISTS inventory (
    inventory_id VARCHAR(100) PRIMARY KEY, -- UUID format
    warehouse_id VARCHAR(100) NOT NULL,
    product_id VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2),
    offer_price DECIMAL(10, 2),
    expiry_date DATETIME,
    vendor_id VARCHAR(100) NOT NULL,
    quantity INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (warehouse_id) REFERENCES warehouse(warehouse_id),
    FOREIGN KEY (product_id) REFERENCES product(product_id),
    FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id),
    KEY idx_inventory_vendor_product (vendor_id, product_id)
   );

  `);
  const [rows] = await connection.query<RowDataPacket[]>(`
       SELECT 1 FROM inventory LIMIT 1;
      `);
  if (rows.length >= 0) {
    console.log("inventory table created");
  }
}

async function createProductCategory(connection: Connection) {
  const [tableResult] = await connection.query(`
    CREATE TABLE IF NOT EXISTS product_category (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  const [rows] = await connection.query<RowDataPacket[]>(`
       SELECT 1 FROM product_category LIMIT 1;
      `);
  if (rows.length >= 0) {
    console.log("product_category table created");
  }
}

async function createWarehouseTable(connection: Connection) {
  const [tableResult] = await connection.query(`
    CREATE TABLE IF NOT EXISTS warehouse (
    warehouse_id VARCHAR(100) PRIMARY KEY NOT NULL,
    name VARCHAR(255) NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_lat_lng (latitude, longitude)
    );
  `);
  const [rows] = await connection.query<RowDataPacket[]>(`
       SELECT 1 FROM warehouse LIMIT 1;
      `);
  if (rows.length >= 0) {
    console.log("warehouse table created");
  }
}

async function createUserTable(connection: Connection) {
  const [tableResult] = await connection.query(`
    CREATE TABLE IF NOT EXISTS user (
      id SERIAL PRIMARY KEY NOT NULL,
      name VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(20),
      role VARCHAR(100),
      isActive BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  const [rows] = await connection.query<RowDataPacket[]>(`
       SELECT 1 FROM user LIMIT 1;
      `);
  if (rows.length >= 0) {
    console.log("user table created");
  }
}

async function createDriverTable(connection: Connection) {
  const [tableResult] = await connection.query(`
    CREATE TABLE IF NOT EXISTS driver (
      driver_id VARCHAR(100) NOT NULL,
      name VARCHAR(255) DEFAULT NULL,
      password VARCHAR(255) DEFAULT NULL,
      email VARCHAR(255) DEFAULT NULL,
      phone VARCHAR(20) DEFAULT NULL,
      address_line1 VARCHAR(255) DEFAULT NULL,
      address_line2 VARCHAR(255) DEFAULT NULL,
      city VARCHAR(100) DEFAULT NULL,
      state VARCHAR(100) DEFAULT NULL,
      postal_code VARCHAR(20) DEFAULT NULL,
      status VARCHAR(50) DEFAULT NULL,
      country VARCHAR(100) DEFAULT NULL,
      isActive TINYINT(1) DEFAULT 0,
      isDocumentVerified TINYINT(1) DEFAULT 0,
      isDocumentUploaded TINYINT(1) DEFAULT 0,
      isAvailable TINYINT(1) DEFAULT 0,
      vehicle_number VARCHAR(50) DEFAULT NULL,
      vehicle_type VARCHAR(50) DEFAULT NULL,
      vehicle_image VARCHAR(255) DEFAULT NULL,
      remarks TEXT,
      driving_license_file VARCHAR(255) DEFAULT NULL,
      current_latitude DECIMAL(10, 8) DEFAULT NULL,
      current_longitude DECIMAL(11, 8) DEFAULT NULL,
      location_updated_at DATETIME DEFAULT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (driver_id)
    );
  `);


  const [rows] = await connection.query<RowDataPacket[]>(`
       SELECT 1 FROM driver LIMIT 1;
      `);
  if (rows.length >= 0) {
    console.log("driver table created");
  }
}
async function createVendorOrderPickupStatusTable(connection: Connection) {
  const [tableResult] = await connection.query(`
 CREATE TABLE IF NOT EXISTS pickup_requests (
  pickup_request_id VARCHAR(100) PRIMARY KEY NOT NULL,
  order_id VARCHAR(50) NOT NULL,
  vendor_id VARCHAR(100) NOT NULL,
  driver_id VARCHAR(100),
  warehouse_id VARCHAR(100),
  pickup_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  pickup_address_line1 VARCHAR(255),
  pickup_address_line2 VARCHAR(255),
  pickup_city VARCHAR(100),
  pickup_state VARCHAR(100),
  pickup_postal_code VARCHAR(20),
  pickup_latitude FLOAT,
  pickup_longitude FLOAT,
  requested_pickup_time TIMESTAMP,
  assigned_at TIMESTAMP,
  picked_up_at TIMESTAMP,
  delivered_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  cancellation_reason TEXT,
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES order_details(order_id),
  FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id),
  FOREIGN KEY (driver_id) REFERENCES driver(driver_id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouse(warehouse_id)
);
  `);
  const [rows] = await connection.query<RowDataPacket[]>(`
       SELECT 1 FROM pickup_requests LIMIT 1;
      `);
  if (rows.length >= 0) {
    console.log("pickup_requests table created");
  }
}

async function createCustomerOrderDeliveries(connection: Connection) {
  const [tableResult] = await connection.query(`
    CREATE TABLE IF NOT EXISTS customer_order_deliveries (
      delivery_id VARCHAR(100) NOT NULL,
      order_id VARCHAR(100) NOT NULL,
      driver_id VARCHAR(100) NOT NULL,
      assigned_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      picked_up_at TIMESTAMP NULL DEFAULT NULL,
      delivered_at TIMESTAMP NULL DEFAULT NULL,
      delivery_status ENUM('ASSIGNED','PICKED_UP','DELIVERED','CANCELLED') NOT NULL DEFAULT 'ASSIGNED',
      delivery_notes TEXT,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (delivery_id),
      KEY order_id (order_id),
      KEY driver_id (driver_id),
      CONSTRAINT order_deliveries_ibfk_1 FOREIGN KEY (order_id) REFERENCES customer_orders (order_id),
      CONSTRAINT order_deliveries_ibfk_2 FOREIGN KEY (driver_id) REFERENCES driver (driver_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  `);

  const [rows] = await connection.query<RowDataPacket[]>(`
    SELECT 1 FROM customer_order_deliveries LIMIT 1;
  `);

  if (rows.length >= 0) {
    console.log("customer_order_deliveries table created");
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
      latitude FLOAT,
      longitude FLOAT,
      landmark VARCHAR(500),
      phone_number VARCHAR(20),
      is_default BOOLEAN DEFAULT FALSE,
      FOREIGN KEY (customer_id) REFERENCES customer(customer_id)
    ) AUTO_INCREMENT=10000;
  `);

  const [rows] = await connection.query<RowDataPacket[]>(`
    SELECT 1 FROM customer_addresses LIMIT 1;
  `);

  if (rows.length >= 0) {
    console.log("customer_addresses table created");
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




