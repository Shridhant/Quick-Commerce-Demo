// AdminVendorController.ts
import { Request, Response } from "express";
import { HttpStatusCode } from "../../../StandardUtility/HttpStatusCode";
import {
  fetchVendorListing,
  verifyVendor,
  getVendorById,
  createVendor,
  updateVendor,
  toggleVendorStatus,
  deleteVendor,
} from "../Services/AdminVendorService";

export const vendorVerification = async (
    req: Request,
    res: Response
  ) => {
    const { vendorId, remarks } = req.body; 
  
    try {
      const response = await verifyVendor(vendorId, remarks);
  
      res.status(HttpStatusCode.OK).json(response);
    } catch (err) {
      throw err;
    }
  };

  export const vendorListing = async (req: Request, res: Response) => {
    const { status, documentVerified, page = '1', limit = '15' } = req.query;
  
    console.log("Query params:", req.query);
    
    const parsedPage = Math.max(1, parseInt(page as string) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit as string) || 15));
    
    // Make filters optional
    const parsedStatus = status as string | undefined;
    const parsedDocumentVerified = documentVerified 
      ? (documentVerified === '1' || documentVerified === 'true' ? 1 : 0)
      : undefined;
  
    try {
      const response = await fetchVendorListing(
        parsedStatus,
        parsedDocumentVerified,
        parsedPage,
        parsedLimit
      );
      res.status(HttpStatusCode.OK).json(response);
    } catch (err) {
      throw err;
    }
  };


// ─────────────────────────────────────────────────────────────
// GET SINGLE VENDOR
// GET /admin/v1/vendors/:vendorId
// ─────────────────────────────────────────────────────────────
export const fetchVendorById = async (req: Request, res: Response) => {
  try {
    const { vendorId } = req.params;
    const response = await getVendorById(vendorId);
    const statusCode = response.success ? HttpStatusCode.OK : HttpStatusCode.NOT_FOUND;
    res.status(statusCode).json(response);
  } catch (err) {
    throw err;
  }
};

// ─────────────────────────────────────────────────────────────
// CREATE VENDOR
// POST /admin/v1/vendors
// ─────────────────────────────────────────────────────────────
export const addVendor = async (req: Request, res: Response) => {
  try {
    const {
      name, business_owner_name, email, phone, password,
      address_line1, address_line2, city, state, postal_code, country,
      latitude, longitude, gstId, is_company_vendor, remarks,
    } = req.body;

    // Get admin ID from the authenticated token
    const createdBy = (req as any).admin?.admin_id || "unknown";

    const response = await createVendor(
      {
        name, business_owner_name, email, phone, password,
        address_line1, address_line2, city, state, postal_code, country,
        latitude, longitude, gstId, is_company_vendor, remarks,
      },
      createdBy
    );
    res.status(HttpStatusCode.CREATED).json(response);
  } catch (err) {
    throw err;
  }
};

// ─────────────────────────────────────────────────────────────
// UPDATE VENDOR
// PUT /admin/v1/vendors/:vendorId
// ─────────────────────────────────────────────────────────────
export const editVendor = async (req: Request, res: Response) => {
  try {
    const { vendorId } = req.params;
    const {
      name, business_owner_name, email, phone,
      address_line1, address_line2, city, state, postal_code, country,
      latitude, longitude, gstId, is_company_vendor, remarks,
    } = req.body;

    const response = await updateVendor(vendorId, {
      name, business_owner_name, email, phone,
      address_line1, address_line2, city, state, postal_code, country,
      latitude, longitude, gstId, is_company_vendor, remarks,
    });
    const statusCode = response.success ? HttpStatusCode.OK : HttpStatusCode.NOT_FOUND;
    res.status(statusCode).json(response);
  } catch (err) {
    throw err;
  }
};

// ─────────────────────────────────────────────────────────────
// TOGGLE VENDOR STATUS (activate / deactivate)
// PATCH /admin/v1/vendors/:vendorId/status
// Body: { isActive: true | false }
// ─────────────────────────────────────────────────────────────
export const updateVendorStatus = async (req: Request, res: Response) => {
  try {
    const { vendorId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      res.status(400).json({ success: false, message: "isActive must be a boolean" });
      return;
    }

    const response = await toggleVendorStatus(vendorId, isActive);
    const statusCode = response.success ? HttpStatusCode.OK : HttpStatusCode.NOT_FOUND;
    res.status(statusCode).json(response);
  } catch (err) {
    throw err;
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE VENDOR
// DELETE /admin/v1/vendors/:vendorId
// ─────────────────────────────────────────────────────────────
export const removeVendor = async (req: Request, res: Response) => {
  try {
    const { vendorId } = req.params;
    const response = await deleteVendor(vendorId);
    const statusCode = response.success ? HttpStatusCode.OK : HttpStatusCode.NOT_FOUND;
    res.status(statusCode).json(response);
  } catch (err) {
    throw err;
  }
};