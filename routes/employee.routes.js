import express from "express";
import upload from "../middlewares/upload.js";
import {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getFulltimeEmployees,
  getParttimeEmployees,
  searchEmployees,
  getEmployeeCounts  // <- wajib ditambahkan biar router /count jalan
} from "../controllers/employee.controller.js";

const router = express.Router();

// ========================================
// PALING SPESIFIK DULU (GET routes)
// ========================================
router.get("/search", searchEmployees);                    // /api/employees/search
router.get("/type/fulltime", getFulltimeEmployees);       // /api/employees/type/fulltime
router.get("/type/parttime", getParttimeEmployees);       // /api/employees/type/parttime
router.get("/count", getEmployeeCounts);                  // /api/employees/count

// ========================================
// PALING UMUM PALING AKHIR
// ========================================
router.get("/", getAllEmployees);                         // /api/employees
router.get("/:nik", getEmployeeById);                     // /api/employees/:nik (PALING AKHIR!)

// ========================================
// POST, PUT, DELETE
// ========================================
router.post(
  "/",
  upload.fields([
    { name: "photo" },
    { name: "ktp" },
    { name: "npwpFile" },
    { name: "bpjsKesehatan" },
    { name: "bpjsKetenagakerjaan" },
    { name: "kartukeluarga" },
    { name: "sertifikattraining" },
    { name: "hasilmcu" },
    { name: "cvkaryawan" },
    { name: "degreeCertificate" }
  ]),
  createEmployee
);

router.put("/:nik", updateEmployee);
router.delete("/:nik", deleteEmployee);

export default router;
