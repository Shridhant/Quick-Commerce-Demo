// import * as admin from "firebase-admin";
// import { RowDataPacket } from "mysql2/promise";
//     import pool from "../../../StandardConfig/MySqlDbConfig"; // adjust path to your pool
// import { PushTokenUserType, PushTokenRow } from "../Types/OrderflowTypes";

// // ─── Fetch active FCM tokens for a specific user ──────────────────────────
// // Used when you need to notify a single customer or driver by their user_id.
// export const getTokensForUser = async (
//   userId: string,
//   userType: PushTokenUserType
// ): Promise<string[]> => {
//   const connection = await pool.getConnection();
//   try {
//     const [rows] = await connection.query<PushTokenRow[] & RowDataPacket[]>(
//       `SELECT fcm_token
//        FROM push_tokens
//        WHERE user_id = ?
//          AND user_type = ?
//          AND is_active = 1`,
//       [userId, userType]
//     );
//     return rows.map((r) => r.fcm_token);
//   } finally {
//     connection.release();
//   }
// };

// // ─── Fetch active FCM tokens for ALL users of a given type ────────────────
// // Used when broadcasting to every available driver.
// export const getTokensForUserType = async (
//   userType: PushTokenUserType
// ): Promise<string[]> => {
//   const connection = await pool.getConnection();
//   try {
//     const [rows] = await connection.query<PushTokenRow[] & RowDataPacket[]>(
//       `SELECT fcm_token
//        FROM push_tokens
//        WHERE user_type = ?
//          AND is_active = 1`,
//       [userType]
//     );
//     return rows.map((r) => r.fcm_token);
//   } finally {
//     connection.release();
//   }
// };

// // ─── Core send function ────────────────────────────────────────────────────
// // Fire-and-forget: logs failures but never throws — order status updates
// // must not depend on notification delivery.
// export const sendPushNotification = async (
//   fcmTokens: string[],
//   title: string,
//   body: string,
//   data?: Record<string, string>  // optional extra key/value payload
// ): Promise<void> => {
//   if (fcmTokens.length === 0) return;

//   // FCM accepts at most 500 tokens per sendEachForMulticast call.
//   // Chunk if you ever expect more, but for this app 500 is safe.
//   const message: admin.messaging.MulticastMessage = {
//     tokens: fcmTokens,
//     notification: { title, body },
//     ...(data && { data }),
//   };

//   try {
//     const response = await admin.messaging().sendEachForMulticast(message);

//     // Optional: log any individual failures for debugging
//     response.responses.forEach((res, idx) => {
//       if (!res.success) {
//         console.error(
//           `[Push] Failed for token index ${idx}:`,
//           res.error?.message
//         );
//       }
//     });
//   } catch (err) {
//     // Log but do NOT re-throw — notifications are best-effort.
//     console.error("[Push] sendEachForMulticast error:", err);
//   }
// };