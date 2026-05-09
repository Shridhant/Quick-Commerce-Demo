import express, { NextFunction, Request, Response } from "express";
import pool from "./src/Config/MySqlDbConfig";
import cors from 'cors'
import { DEVELOPMENT_IP, NODE_ENV } from "./src/Config/SettingReader";
import CustomerAuthRouter from "./src/Route/Auth";
import CustomerRouter from "./src/Route/Customer";
import PaymentRouter from "./src/Route/Payment";

import { errorHandler } from "./src/Middleware/ErrorHandler";
import { razorpayWebhookHandler } from "./src/Controller/PaymentController";

const app = express();
const PORT = 3000;

// const dir = "./Modules/Vendor/Uploads";

// if(!fs.existsSync(dir)){
//     fs.mkdirSync(dir);
// }

app.set("mysql", pool);

const origin =
  NODE_ENV === "development"
    ? DEVELOPMENT_IP || "http://localhost:5173"
    : "http://localhost:5173";

const corsOptions = {
  origin,
  credentials: true,
};

app.use(cors(corsOptions));

// ✅ Use same config for OPTIONS
//app.options("/*", cors(corsOptions));

app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.post(
  "/payment/v1/order/payments/webhook/capture",
  express.raw({ type: "application/json" }),
  razorpayWebhookHandler
);

app.use(express.json());

app.use("/customer/auth/v1", CustomerAuthRouter)
app.use("/customer/v1", CustomerRouter)
app.use("/payment/v1", PaymentRouter)

app.get("/", (req: Request, res: Response) => {
  res.send("Hello from TypeScript + Express in the root!");
});

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
  console.log(`Vendor uploads served at: http://localhost:${PORT}/uploads/vendor`);
  console.log(`Driver uploads served at: http://localhost:${PORT}/uploads/drivers`);
  console.log(`Product uploads served at: http://localhost:${PORT}/uploads/products`);
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  // Use your AppError shape if available
  const status = err.statusCode || 500;
  const code = err.code || "0000";

  res.status(status).json({
    status: status,
    code: code,
    message: err.message || "Something went wrong",
    errors: err.errors || null,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

