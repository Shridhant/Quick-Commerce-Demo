interface PickupDetails {
    driverName: string;
    driverPhone: string;
    vehicleNumber?: string;
    pickupDate: string; // YYYY-MM-DD
    pickupTimeStart: string; // HH:MM format
    pickupTimeEnd: string; // HH:MM format
    pickupNotes?: string;
  }