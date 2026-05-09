// services/expoPushNotification.service.ts
import { Expo, ExpoPushMessage, ExpoPushTicket, ExpoPushReceipt } from 'expo-server-sdk';
import pool from "../../StandardConfig/MySqlDbConfig";
import { RowDataPacket } from 'mysql2';

// Create a new Expo SDK client
const expo = new Expo();

interface PushTokenRow extends RowDataPacket {
  fcm_token: string;
  user_id: string;
  user_type: 'DRIVER' | 'VENDOR' | 'CUSTOMER';
  device_type: 'ANDROID' | 'IOS';
}

interface NotificationData {
  orderId: string;
  status?: string;
  action?: string;
  [key: string]: any;
}

/**
 * Send push notifications using Expo Push Notification service
 */
export const sendExpoPushNotification = async (
  tokens: string[],
  title: string,
  body: string,
  data?: NotificationData
): Promise<void> => {
  if (!tokens || tokens.length === 0) {
    console.log('No tokens to send notification to');
    return;
  }

  // Filter out invalid Expo push tokens
  const validTokens = tokens.filter(token => Expo.isExpoPushToken(token));

  if (validTokens.length === 0) {
    console.log('No valid Expo push tokens found');
    return;
  }

  // Create messages
  const messages: ExpoPushMessage[] = validTokens.map(token => ({
    to: token,
    sound: 'default',
    title: title,
    body: body,
    data: data || {},
    priority: 'high',
    channelId: 'default', // For Android
  }));

  // Chunk messages (Expo recommends max 100 per request)
  const chunks = expo.chunkPushNotifications(messages);
  const tickets: ExpoPushTicket[] = [];

  try {
    // Send all chunks
    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Error sending push notification chunk:', error);
      }
    }

    // Check for errors in tickets
    const invalidTokens: string[] = [];
    tickets.forEach((ticket, index) => {
      if (ticket.status === 'error') {
        console.error(`Error with token ${validTokens[index]}:`, ticket.message);
        
        // Handle specific errors
        if (
          ticket.details?.error === 'DeviceNotRegistered' ||
          ticket.message?.includes('not registered')
        ) {
          invalidTokens.push(validTokens[index]);
        }
      }
    });

    // Remove invalid tokens from database
    if (invalidTokens.length > 0) {
      await removeInvalidTokens(invalidTokens);
    }

    console.log(`Successfully queued ${tickets.length} notifications`);

    // Optional: Check receipts later (recommended for production)
    // await checkPushReceipts(tickets);

  } catch (error) {
    console.error('Error in sendExpoPushNotification:', error);
    throw error;
  }
};

/**
 * Get Expo push tokens for all active drivers
 */
export const getTokensForDrivers = async (): Promise<string[]> => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query<PushTokenRow[]>(
      `SELECT DISTINCT fcm_token 
       FROM push_tokens 
       WHERE user_type = 'DRIVER' 
         AND is_active = 1`
    );
    
    return rows.map(row => row.fcm_token);
  } finally {
    connection.release();
  }
};

/**
 * Get Expo push tokens for a specific customer
 */
export const getTokensForCustomer = async (customerId: string): Promise<string[]> => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query<PushTokenRow[]>(
      `SELECT DISTINCT fcm_token 
       FROM push_tokens 
       WHERE user_id = ? 
         AND user_type = 'CUSTOMER' 
         AND is_active = 1`,
      [customerId]
    );
    
    return rows.map(row => row.fcm_token);
  } finally {
    connection.release();
  }
};

/**
 * Get Expo push tokens for a specific driver
 */
export const getTokensForDriver = async (driverId: string): Promise<string[]> => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query<PushTokenRow[]>(
      `SELECT DISTINCT fcm_token 
       FROM push_tokens 
       WHERE user_id = ? 
         AND user_type = 'DRIVER' 
         AND is_active = 1`,
      [driverId]
    );
    
    return rows.map(row => row.fcm_token);
  } finally {
    connection.release();
  }
};

/**
 * Mark invalid tokens as inactive in the database
 */
const removeInvalidTokens = async (tokens: string[]): Promise<void> => {
  if (tokens.length === 0) return;
  
  const connection = await pool.getConnection();
  try {
    await connection.query(
      `UPDATE push_tokens 
       SET is_active = 0 
       WHERE fcm_token IN (?)`,
      [tokens]
    );
    console.log(`Marked ${tokens.length} tokens as inactive`);
  } finally {
    connection.release();
  }
};

/**
 * Optional: Check push notification receipts
 * Call this after some delay to verify delivery
 */
export const checkPushReceipts = async (tickets: ExpoPushTicket[]): Promise<void> => {
  const receiptIds = tickets
    .filter(ticket => ticket.status === 'ok')
    .map(ticket => ticket.id);

  if (receiptIds.length === 0) return;

  const receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);

  try {
    for (const chunk of receiptIdChunks) {
      const receipts = await expo.getPushNotificationReceiptsAsync(chunk);
      
      for (const receiptId in receipts) {
        const receipt = receipts[receiptId];
        
        if (receipt.status === 'error') {
          console.error(`Error in receipt ${receiptId}:`, receipt.message);
          
          if (receipt.details?.error === 'DeviceNotRegistered') {
            // Token is invalid, should be removed
            console.log('Device not registered, should remove token');
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking receipts:', error);
  }
};

/**
 * Save or update push token in database
 */
export const savePushToken = async (
  userId: string,
  userType: 'DRIVER' | 'VENDOR' | 'CUSTOMER',
  appType: 'DRIVER_VENDOR_APP' | 'CUSTOMER_APP',
  deviceType: 'ANDROID' | 'IOS',
  deviceId: string,
  fcmToken: string,
  phone?: string
): Promise<void> => {
  const connection = await pool.getConnection();
  try {
    // Check if token already exists
    const [existing] = await connection.query<PushTokenRow[]>(
      `SELECT id FROM push_tokens 
       WHERE device_id = ? AND app_type = ?`,
      [deviceId, appType]
    );

    if (existing.length > 0) {
      // Update existing token
      await connection.query(
        `UPDATE push_tokens 
         SET fcm_token = ?, 
             user_id = ?, 
             user_type = ?, 
             phone = ?,
             is_active = 1,
             updated_at = CURRENT_TIMESTAMP
         WHERE device_id = ? AND app_type = ?`,
        [fcmToken, userId, userType, phone, deviceId, appType]
      );
    } else {
      // Insert new token
      await connection.query(
        `INSERT INTO push_tokens 
         (user_id, user_type, app_type, device_type, device_id, fcm_token, phone, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        [userId, userType, appType, deviceType, deviceId, fcmToken, phone]
      );
    }
  } finally {
    connection.release();
  }
};