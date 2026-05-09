import pool from "../Config/MySqlDbConfig";


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

export function generateOTP(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

export const insertErrorLog = async (errorMessage?: string, stackTrace?: string, title?: string) => {

    try {
        await pool.query(
            `INSERT INTO error_logs (title, description, stack_trace) VALUES (?, ?, ?)`,
            [title || "Error Log", errorMessage || "No description provided", stackTrace || "No stack trace available"]
        );
    } catch (error) {
        console.error("Failed to insert error log:", error);
    }


}
export const insertLogs = async (description?: string, title?: string) => {

    try {
        await pool.query(
            `INSERT INTO app_logs (title, description) VALUES (?, ?)`,
            [title || "Error Log", description || "No description provided"]
        );
    } catch (error) {
        console.error("Failed to insert log:", error);
    }

}