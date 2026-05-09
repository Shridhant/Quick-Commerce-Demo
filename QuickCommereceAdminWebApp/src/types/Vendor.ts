export interface Vendor {
    vendor_id: string;
    name: string; 
    email: string;
    phone: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    status: string;
    isDocumentVerified: boolean;
    created_at: string;
    updated_at?: string;
  }
  