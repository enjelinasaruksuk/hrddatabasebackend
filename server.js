import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import employeeRoutes from "./routes/employee.routes.js";
import authRoutes from "./routes/auth.js";

// ESM fix untuk __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files untuk uploads (FOTO)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Register Routes
app.use("/api/employees", employeeRoutes);
app.use("/api/auth", authRoutes);

app.listen(5000, () => {
  console.log("🚀 Server running on port 5000");
});