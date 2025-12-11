import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import employeeRoutes from "./routes/employee.routes.js";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js"; 
import reminderRoutes from "./routes/reminder.routes.js";
import contractRoutes from "./routes/contract.routes.js";
import db from "./config/db.config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// ===== CORS =====
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// ===== Static Files =====
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// ===== Routes =====
app.use("/api/employees", employeeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);  
app.use("/api/reminder", reminderRoutes);
app.use("/api/contracts", contractRoutes);

// ===== Start Server =====
app.listen(5000, () => {
  console.log("🚀 Server running on port 5000");
});