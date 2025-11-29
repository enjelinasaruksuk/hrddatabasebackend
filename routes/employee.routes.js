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
  searchEmployees 
} from "../controllers/employee.controller.js";

const router = express.Router();

router.get("/search", searchEmployees);
router.get("/type/fulltime", getFulltimeEmployees);
router.get("/type/parttime", getParttimeEmployees);

// CRUD ROUTES
router.get("/", getAllEmployees);
router.get("/:nik", getEmployeeById);
router.post("/", upload.fields([
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
