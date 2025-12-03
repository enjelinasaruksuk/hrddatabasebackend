import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import employeeRoutes from "./routes/employee.routes.js";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js"; 

// ESM fix untuk __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// ===== CORS Configuration - CRITICAL FOR PDF EXPORT =====
app.use(cors({
  origin: '*', // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// ===== CRITICAL: Static files dengan CORS headers =====
// Ini yang paling penting untuk export PDF dengan foto!
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Register Routes
app.use("/api/employees", employeeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);  

app.listen(5000, () => {
  console.log("🚀 Server running on port 5000");
  console.log("📁 Static files served from:", path.join(__dirname, 'uploads'));
  console.log("✅ CORS enabled for all origins");
});