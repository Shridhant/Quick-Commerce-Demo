import { RowDataPacket } from "mysql2";
import path from "path";
import fs from "fs/promises";
import fsStream from "fs";
import puppeteer from "puppeteer";
import pool from "../Modules/StandardConfig/MySqlDbConfig";
import { AppError } from "./AppError";
import { CustomCode } from "./CustomCode";
import { HttpStatusCode } from "./HttpStatusCode";
import { createVendorTokenAndLogin, loginVendor } from "../Modules/Vendor/Service/VendorService";
import { ACCESS_TOKEN_SECRET } from "../Modules/StandardConfig/SettingsReader";
import jwt from "jsonwebtoken";
import { createDriverTokenAndLogin } from "../Modules/Driver/Service/DriverService";
import { generateOTP } from "./Helper";

export const sendOTP = async (phone: string) => {
    const otp = generateOTP();
    // Insert or update
    const query = `
    INSERT INTO otps (phone, otp, expires_at)
    VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))
    ON DUPLICATE KEY UPDATE
      otp = VALUES(otp),
      expires_at = VALUES(expires_at)
  `;
    await pool.query(query, [phone, otp]);
    return {
        success: true,
        otp: otp
    };
};

export const verifyAndLogin = async (otp: string, phone: string) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Validate OTP
        const [rows] = await connection.query<RowDataPacket[]>(
            `SELECT * FROM otps WHERE phone = ? AND otp = ? AND expires_at > NOW()`,
            [phone, otp]
        );

        if (rows.length === 0) {
            throw new AppError("Invalid or expired OTP", HttpStatusCode.UNAUTHORIZED, CustomCode.UnauthorizedCode);
        }

        // 2. Remove used OTP
        await connection.query(`DELETE FROM otps WHERE phone = ?`, [phone]);

        // 3. Check if user exists
        const [userRows] = await connection.query<RowDataPacket[]>(
            'SELECT * FROM user WHERE phone = ?', [phone]
        );

        // 4. If user doesn't exist, insert
        if (userRows.length === 0) {
            await connection.query(`INSERT INTO user(phone) VALUES (?)`, [phone]);
        }

        // 5. Check if vendor exists
        const [vendorRows] = await connection.query<RowDataPacket[]>(
            'SELECT * FROM vendors WHERE phone = ?', [phone]
        );
        // 6. Check if driver exists
        const [driverRows] = await connection.query<RowDataPacket[]>(
            'SELECT * FROM driver WHERE phone = ?', [phone]
        );

        const role = userRows[0]?.role ? userRows[0]?.role : 'USER';

        // 7. Create token based on role (vendor/driver/user)
        let response;
        if (vendorRows.length) {
            response = await createVendorTokenAndLogin(vendorRows[0].vendor_id, connection);
        } else if (driverRows.length) {
            response = await createDriverTokenAndLogin(driverRows[0].driver_id, connection);
        } else {
            response = await createUserToken(phone);
        }

        await connection.commit();
        return response;

    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};


const createUserToken = async (phone: string) => {
    try {
        const payload = {
            phone: phone,
            purpose: 'user'
        }
        const token = generateToken(payload);
        if (!token) {
            throw new AppError("Error generating Token", HttpStatusCode.INTERNAL_SERVER_ERROR, CustomCode.ServerErrorCode);
        }

        return {
            success: true,
            status: HttpStatusCode.OK,
            code: CustomCode.SuccessCode,
            message: 'Login Successful',
            token,
            role: 'USER'
        }
    } catch (err) {
        throw err;
    }
}

const generateToken = (payload: any): string => {
    const token = jwt.sign(payload, ACCESS_TOKEN_SECRET, {
        expiresIn: '1h' // token expiry
    });
    return token;
};

function generateRandomManifestReference(): string {
    const timestamp = new Date().toISOString().replace(/[-:.T]/g, "").slice(0, 10);
    const random = Math.floor(Math.random() * 1000); // 0–999
    const paddedRandom = String(random).padStart(3, "0");
    return `${timestamp}${paddedRandom}`;
}

// ✅ Generate random number for filename
function generateRandomNumber(): number {
    return Math.floor(Math.random() * 1000000);
}

// ✅ Format date (YYYY-MM-DD)
function formatDate(date: Date): string {
    return date.toISOString().split("T")[0];
}

export const generateManifest = async (
  orderIds: string[],
  vendorId: string
): Promise<{ filename: string; manifestRef: string }> => {
  const manifestRef = generateRandomManifestReference();
  const uniqueFilename = generateRandomNumber();
  const filename = `QCManifest${uniqueFilename}.pdf`;

  const rootDir = process.cwd();
  const manifestFolder = path.join(rootDir, "OrderManifest");
  const filePath = path.join(manifestFolder, filename);
  const logoPath = path.join(rootDir, "assets", "logo.jpeg");

  const imageBuffer = fsStream.readFileSync(logoPath);
  const base64Image = imageBuffer.toString("base64");
  const imageSrc = `data:image/jpeg;base64,${base64Image}`;

  const manifestDate = formatDate(new Date());
  let browser = null;

  try {
    // Ensure Manifest folder exists
    await fs.mkdir(manifestFolder, { recursive: true });

    // ✅ Fetch vendor details
    const [vendorRows] = await pool.query<RowDataPacket[]>(
      `SELECT vendor_id, name, email, phone 
       FROM vendors 
       WHERE vendor_id = ?`,
      [vendorId]
    );
    const vendor = vendorRows[0];

    // ✅ Fetch orders + warehouse
    const [orders] = await pool.query<RowDataPacket[]>(
      `SELECT od.*, 
              w.name AS warehouse_name,
              w.address_line1,
              w.address_line2,
              w.city,
              w.state
       FROM order_details od
       LEFT JOIN warehouse w ON od.warehouse_id = w.warehouse_id
       WHERE od.order_id IN (?)`,
      [orderIds]
    );

    // ✅ Attach products for each order
    const orderDetails: any[] = [];
    for (const order of orders) {
      const [products] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM order_product WHERE order_id = ?`,
        [order.order_id]
      );
      orderDetails.push({
        ...order,
        products,
      });
    }

    // ✅ Build HTML content
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <title>Manifest</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f9fafb; }
        .container { width: 95%; margin: auto; background: #fff; padding: 20px; }
        .header { display:flex; justify-content:space-between; align-items:center; border-bottom:3px solid #0D9488; padding:10px 0; }
        .header img { width:100px; }
        .header h1 { color:#0D9488; margin:0; font-size: 22px; }
        .info-block { margin-top:10px; }
        .info-block strong { color:#0D9488; }
        .info-table { width:100%; border-collapse:collapse; margin-top:15px; }
        .info-table th, .info-table td { border:1px solid #e5e7eb; padding:8px; font-size:12px; text-align:left; vertical-align: top; }
        .info-table th { background:#0D9488; color:white; font-size:13px; }
        .footer { text-align:center; font-size:12px; color:#6b7280; margin-top:20px; }

        .warehouse-name { font-weight: 600; color: #0D9488; font-size: 13px; }
        .warehouse-address { font-size: 12px; color: #374151; }
        .warehouse-location { font-size: 12px; color: #6B7280; }
        .product-item { margin-bottom: 4px; }
        .product-item strong { color: #111827; }
        .extra-products { color:#2563eb; font-weight:bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${imageSrc}" />
          <h1>MANIFEST</h1>
        </div>
        <div class="info-block">
          <div><strong>MANIFEST REF:</strong> ${manifestRef}</div>
          <div><strong>MANIFEST DATE:</strong> ${manifestDate}</div>
        </div>
        <div class="info-block">
          <div><strong>VENDOR:</strong> ${vendor?.name ?? ""}</div>
          <div><strong>Email:</strong> ${vendor?.email ?? ""}</div>
          <div><strong>Phone:</strong> ${vendor?.phone ?? ""}</div>
        </div>

        <table class="info-table">
          <thead>
            <tr>
              <th>ORDER ID</th>
              <th>WAREHOUSE DETAILS</th>
              <th>PRODUCTS</th>
            </tr>
          </thead>
          <tbody>
            ${orderDetails
              .map((order) => {
                const displayed = (order.products as any[]).slice(0, 5);
                const remaining = order.products.length - 5;
                const productHTML = displayed
                  .map(
                    (p: any) => `
                      <div class="product-item">
                        <span><strong>${p.product_name}</strong></span> - 
                        <span>Qty: ${p.requested_quantity}</span>, 
                        <span>Brand: ${p.product_brand}</span>, 
                        <span>Price: ₹${p.product_price}</span>
                      </div>`
                  )
                  .join("");
                const extra =
                  remaining > 0
                    ? `<div class="extra-products">+${remaining} more product(s)...</div>`
                    : "";

                return `
                  <tr>
                    <td>${order.order_id}</td>
                    <td>
                      <div class="warehouse-name">${order.warehouse_name ?? ""}</div>
                      <div class="warehouse-address">${order.address_line1 ?? ""} ${order.address_line2 ?? ""}</div>
                      <div class="warehouse-location">${order.city ?? ""}, ${order.state ?? ""}</div>
                    </td>
                    <td>${productHTML}${extra}</td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>

        <div class="footer">
          Generated by QuickCommerce - ${manifestDate}
        </div>
      </div>
    </body>
    </html>
    `;

    // ✅ Launch Puppeteer
    browser = await puppeteer.launch({
      headless: true,
      executablePath: '/usr/bin/chromium-browser',
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });
    await page.pdf({
      path: filePath,
      format: "A4",
      landscape: true,
      printBackground: true,
      margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
    });

    return { filename, manifestRef };
  } finally {
    if (browser) await browser.close();
  }
};

export const fetchAvailableProductsInventory = async (vendorId: string, warehouseId: string) => {

    try {

        console.log("inside")
        const query = `SELECT i.*,p.* FROM inventory i JOIN product p on p.product_id = i.product_id  WHERE i.vendor_id = ? AND i.warehouse_id = ?`;

        const [inventoryProducts] = await pool.query<RowDataPacket[]>(query, [vendorId, warehouseId]);

        console.log(inventoryProducts)

        return { success: true, message: "Inventory Products fetched successfully", code: CustomCode.SuccessCode, inventoryProducts };

    } catch (error) {

    }
}

export const savePushTokenService = async (
  fcmToken: string,
  userType: 'DRIVER' | 'VENDOR' | 'CUSTOMER',
  appType: 'DRIVER_VENDOR_APP' | 'CUSTOMER_APP',
  deviceType: 'ANDROID' | 'IOS',
  deviceId: string,
  phone: string | null,
  userId: string | null   // 🔑 may be null initially
) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    /**
     * Insert or update based on (device_id, app_type)
     */
    await connection.query(
      `
      INSERT INTO push_tokens (
        phone,
        user_id,
        user_type,
        app_type,
        device_type,
        device_id,
        fcm_token,
        is_active
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)
      ON DUPLICATE KEY UPDATE
        phone = VALUES(phone),

        -- ✅ user_id set ONLY if currently NULL
        user_id = IF(user_id IS NULL, VALUES(user_id), user_id),

        user_type = VALUES(user_type),
        device_type = VALUES(device_type),
        fcm_token = VALUES(fcm_token),
        is_active = TRUE,
        updated_at = CURRENT_TIMESTAMP
      `,
      [
        phone,
        userId,
        userType,
        appType,
        deviceType,
        deviceId,
        fcmToken
      ]
    );

    await connection.commit();

    return{success: true, message: "FCM Token saved successfully", code: CustomCode.SuccessCode };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
