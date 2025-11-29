import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import employeeRoutes from "./routes/employee.routes.js";
import authRoutes from "./routes/auth.js"; // Import route auth

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Register Routes
app.use("/api/employees", employeeRoutes); // route untuk employee
app.use("/api/auth", authRoutes);          // route untuk authentication

app.listen(5000, () => {
  console.log("🚀 Server running on port 5000");
});