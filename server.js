import express from "express";
import cors from "cors";

import employeeRoutes from "./routes/employee.routes.js"; // untuk employee

const app = express();
app.use(cors());
app.use(express.json());

// Register Routes
app.use("/api/employees", employeeRoutes); // route untuk employee

app.listen(5000, () => console.log("Server running on port 5000"));
