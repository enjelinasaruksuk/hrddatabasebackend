import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

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

// ===== NEW: Individual file serving endpoint untuk documents page =====
app.get('/api/files/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(__dirname, 'uploads', filename);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ 
        success: false,
        message: 'File not found' 
      });
    }
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    
    res.sendFile(filepath);
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error serving file',
      error: error.message 
    });
  }
});

// ===== NEW: Endpoint untuk get file info/metadata =====
app.get('/api/files/info/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(__dirname, 'uploads', filename);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ 
        success: false,
        message: 'File not found' 
      });
    }
    
    const stats = fs.statSync(filepath);
    const ext = path.extname(filename).toLowerCase();
    
    res.json({
      success: true,
      data: {
        filename: filename,
        size: stats.size,
        sizeReadable: formatBytes(stats.size),
        extension: ext,
        isImage: ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext),
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime
      }
    });
  } catch (error) {
    console.error('Error getting file info:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error getting file info',
      error: error.message 
    });
  }
});

// Helper function to format bytes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// ===== Routes =====
app.use("/api/employees", employeeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);  
app.use("/api/reminder", reminderRoutes);
app.use("/api/contracts", contractRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    uploadsDir: path.join(__dirname, 'uploads')
  });
});

// ===== Start Server =====
app.listen(5000, () => {
  console.log("🚀 Server running on port 5000");
  console.log("📁 Static files served from:", path.join(__dirname, 'uploads'));
  console.log("✅ CORS enabled for all origins");
  console.log("📄 File endpoints available:");
  console.log("   - GET /api/files/:filename");
  console.log("   - GET /api/files/info/:filename");
});
