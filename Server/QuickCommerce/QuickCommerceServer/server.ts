import express, { NextFunction, Request, Response } from "express";
import pool from "./Modules/StandardConfig/MySqlDbConfig";
import cors from "cors";
import cookieParser from "cookie-parser";
import fs from "fs";
import path from "path";

// ============================================
// ROUTE IMPORTS
// ============================================
import vendorRouter from "./Modules/Vendor/Route/Vendor";
import adminRouter from "./Modules/Admin/Route/Index"; 
import commonRouter from "./Modules/Common/Route/CommonRoute";
import driverRouter from "./Modules/Driver/Route/Driver";
import categoryRouter from "./Modules/Admin/Route/CategoryRoutes";
import { analyticsRoutes } from "./Modules/Admin/Route/AnalyticsRoute";

// ============================================
// MIDDLEWARE IMPORTS
// ============================================
import { errorHandler } from "./StandardMiddleware/ErrorHandler";
import { DEVELOPMENT_IP, NODE_ENV } from "./Modules/StandardConfig/SettingsReader";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

// ============================================
// UPLOAD DIRECTORY SETUP
// ============================================
const uploadDirs = [
  "./Modules/Vendor/Uploads",
  "./Modules/Driver/Uploads",
  "./Uploads/product",
];

uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ============================================
// DATABASE CONNECTION
// ============================================
app.set("mysql", pool);

// ============================================
// CORS CONFIGURATION
// ============================================
const allowedOrigins: string[] = [];

if (NODE_ENV === "development") {
  // Development mode - allow localhost and development IP
  allowedOrigins.push(
    "http://localhost:5173",
    "http://localhost:3000",
    DEVELOPMENT_IP || "http://localhost:5173"
  );
} else {
  // Production mode - allow your deployed frontend
  allowedOrigins.push(
    "http://88.222.245.221",
    "http://88.222.245.221:5173",
    "http://88.222.245.221:3000",
    "https://88.222.245.221",
    "https://88.222.245.221:5173",
    "https://88.222.245.221:3000",
    "http://localhost:5173" // Keep for local testing
  );
}

// TEMPORARY - For testing only
const corsOptions = {
  origin: true, // Allow all origins temporarily
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
// ============================================
// BODY PARSER MIDDLEWARE
// ============================================
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(express.json());
app.use(cookieParser());


// ============================================
// STATIC FILE SERVING
// ============================================
app.use("/uploads/vendor", express.static(path.join(__dirname, "Modules/Vendor/Uploads")));
app.use("/uploads/drivers", express.static(path.join(__dirname, "Modules/Driver/Uploads")));
app.use("/uploads/products", express.static(path.join(__dirname, "Uploads/product")));
app.use("/Uploads", express.static(path.join(__dirname, "Uploads")));



// ============================================
// API ROUTES
// ============================================
app.use("/vendor/v1", vendorRouter);
app.use("/admin/v1/products/categories", categoryRouter);
app.use("/admin/v1", adminRouter);
app.use("/admin/v1/analytics", analyticsRoutes);
app.use("/common/v1", commonRouter);
app.use("/driver/v1", driverRouter);

// ============================================
// HEALTH CHECK
// ============================================
app.get("/", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    message: "API is running",
    version: "1.0.0",
    environment: NODE_ENV,
    allowedOrigins: allowedOrigins
  });
});

// ============================================
// ERROR HANDLER (Must be last)
// ============================================
app.use(errorHandler);

// ============================================
// START SERVER
// ============================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Server is running at http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  console.log(`\n🔒 CORS Enabled for:`);
  allowedOrigins.forEach(origin => console.log(`   • ${origin}`));
  console.log(`\n📁 Static Files:`);
  console.log(`   • Vendor uploads: http://localhost:${PORT}/uploads/vendor`);
  console.log(`   • Driver uploads: http://localhost:${PORT}/uploads/drivers`);
  console.log(`   • Product uploads: http://localhost:${PORT}/uploads/products`);
  console.log(`\n📡 API Endpoints:`);
  console.log(`   • Vendor API: http://localhost:${PORT}/vendor/v1`);
  console.log(`   • Admin API: http://localhost:${PORT}/admin/v1`);
  console.log(`   • Driver API: http://localhost:${PORT}/driver/v1`);
  console.log(`   • Common API: http://localhost:${PORT}/common/v1`);
  console.log(`\n✅ Ready to accept requests!\n`);
});