import { Request, Response } from "express";
import { HttpStatusCode } from "../../../StandardUtility/HttpStatusCode";
import { NODE_ENV } from "../../StandardConfig/SettingsReader";
import {
  adminListing,
  adminLogin,
  createAdmin,
  getAdminById,
  updateAdmin,
  deleteAdmin,
  updateAdminRole,
  refreshAccessToken,
  assignWarehouse,
} from "../Services/AdminService";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: "/",
};

export const loginAdmin = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const response = await adminLogin(email, password);

    // Set refresh token as HTTP-only cookie
    res.cookie("refreshToken", response.refreshToken, COOKIE_OPTIONS);

    // Return access token + user data in the JSON body (not the refresh token)
    res.status(HttpStatusCode.OK).json({
      adminId: response.adminId,
      name: response.name,
      email: response.email,
      role: response.role,
      assignedWarehouse: response.assignedWarehouse,
      token: response.accessToken,
    });
  } catch (err) {
    throw err;
  }
};

export const refreshTokenHandler = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      res
        .status(HttpStatusCode.UNAUTHORIZED)
        .json({ success: false, message: "No refresh token provided" });
      return;
    }

    const result = await refreshAccessToken(token);

    // Rotate the refresh token cookie
    res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS);

    res.status(HttpStatusCode.OK).json({
      success: true,
      token: result.accessToken,
      user: result.user,
    });
  } catch (err) {
    // Clear the invalid cookie
    res.clearCookie("refreshToken", { path: "/" });
    throw err;
  }
};

export const logoutAdmin = async (_req: Request, res: Response) => {
  res.clearCookie("refreshToken", { path: "/" });
  res.status(HttpStatusCode.OK).json({ success: true, message: "Logged out successfully" });
};

// export const addWarehouse = async (req: Request, res: Response) => {
//   const {
//     name,
//     address_line1,
//     address_line2,
//     city,
//     state,
//     postal_code,
//     country,
//     latitude,
//     longitude,
//   } = req.body;
//   try {
//     const response = await createWarehouse(
//       name,
//       address_line1,
//       address_line2,
//       city,
//       state,
//       postal_code,
//       country,
//       latitude,
//       longitude
//     );
//     res.status(HttpStatusCode.OK).json(response);
//   } catch (err) {
//     throw err;
//   }
// };

// export const fetchWarehouses = async (req: Request, res: Response) => {
//   const { status } = req.query;

//   if (!status)
//     throw new AppError(
//       `status query field is required`,
//       HttpStatusCode.BAD_REQUEST,
//       CustomCode.BadRequestCode
//     );

//   if (status !== StandardStatus.ACTIVE && status !== StandardStatus.INACTIVE)
//     throw new AppError(
//       `status must be ACTIVE/INACTIVE`,
//       HttpStatusCode.BAD_REQUEST,
//       CustomCode.BadRequestCode
//     );
//   try {
//     const response = await warehouseListing(status);
//     res.status(HttpStatusCode.OK).json(response);
//   } catch (err) {
//     throw err;
//   }
// };

/**
 * PATCH /admins/:adminId/warehouse
 * Assign or remove the warehouse for an admin.
 * Body: { warehouse_id: string | null }
 * Pass null (or omit) to remove the assignment.
 */
export const assignWarehouseHandler = async (req: Request, res: Response) => {
  try {
    const { adminId } = req.params;
    // warehouse_id can be a string to assign, or explicitly null to unassign
    const warehouseId: string | null =
      req.body.warehouse_id !== undefined ? req.body.warehouse_id : null;

    const response = await assignWarehouse(adminId, warehouseId);
    res.status(HttpStatusCode.OK).json(response);
  } catch (err) {
    throw err;
  }
};
export const addAdmin = async (req: Request, res: Response) => {
  const { name, email, assigned_warehouse, password } = req.body;
  try {
    const response = await createAdmin(
      name,
      email,
      assigned_warehouse,
      password
    );
    res.status(HttpStatusCode.OK).json(response);
  } catch (err) {
    throw err;
  }
};

export const fetchAdmin = async (req: Request, res: Response) => {
  try {
    const response = await adminListing();
    res.status(HttpStatusCode.OK).json(response);
  } catch (err) {
    throw err;
  }
};

// ============================================
// NEW HANDLERS — ADMIN MANAGEMENT
// ============================================

/**
 * GET /admins/:adminId
 * Get a single admin by ID
 */
export const getAdminByIdHandler = async (req: Request, res: Response) => {
  try {
    const { adminId } = req.params;
    const response = await getAdminById(adminId);
    res.status(HttpStatusCode.OK).json(response);
  } catch (err) {
    throw err;
  }
};

/**
 * PUT /admins/:adminId
 * Update admin name, email, or password
 * Body: { name?, email?, password? }
 */
export const updateAdminHandler = async (req: Request, res: Response) => {
  try {
    const { adminId } = req.params;
    const { name, email, password } = req.body;
    const response = await updateAdmin(adminId, name, email, password);
    res.status(HttpStatusCode.OK).json(response);
  } catch (err) {
    throw err;
  }
};

/**
 * DELETE /admins/:adminId
 * Delete an admin (only role = 'ADMIN', not SUPER_ADMIN)
 */
export const deleteAdminHandler = async (req: Request, res: Response) => {
  try {
    const { adminId } = req.params;
    const response = await deleteAdmin(adminId);
    res.status(HttpStatusCode.OK).json(response);
  } catch (err) {
    throw err;
  }
};

/**
 * PATCH /admins/:adminId/role
 * Change an admin's role
 * Body: { role: "ADMIN" | "SUPER_ADMIN" | "MANAGER" }
 */
export const updateAdminRoleHandler = async (req: Request, res: Response) => {
  try {
    const { adminId } = req.params;
    const { role } = req.body;

    if (!role) {
      res.status(400).json({ success: false, message: "role is required" });
      return;
    }

    const response = await updateAdminRole(adminId, role);
    res.status(HttpStatusCode.OK).json(response);
  } catch (err) {
    throw err;
  }
};

