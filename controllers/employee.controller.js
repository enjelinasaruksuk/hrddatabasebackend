import Employee from "../models/employee.model.js";
import db from "../config/db.config.js";  // <= WAJIB ADA

// GET all employees
export const getAllEmployees = (req, res) => {
  Employee.getAll((err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
};

// GET fulltime employees + FILTER
export const getFulltimeEmployees = (req, res) => {
  const { keyword, division, department } = req.query;

  Employee.getByEmploymentType(
    "fulltime",
    keyword || null,
    division || null,
    department || null,
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    }
  );
};

// GET parttime employees
export const getParttimeEmployees = (req, res) => {
  const { keyword, division, department } = req.query;

  Employee.getByEmploymentType(
    "parttime",
    keyword || null,
    division || null,
    department || null,
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    }
  );
};


export const getEmployeeById = (req, res) => {
  const nik = req.params.id; // ambil dari URL
  Employee.getById(nik, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (!result) return res.status(404).json({ message: "Employee not found" });
    res.json(result);
  });
};

export const searchEmployees = (req, res) => {
  const { keyword, type } = req.query;
  if (!keyword) return res.status(400).json({ message: "Keyword harus diisi" });

  let sql = `
    SELECT e.*, dp.department_name, d.division_name
    FROM employees e
    LEFT JOIN departments dp ON e.department_id = dp.department_id
    LEFT JOIN divisions d ON dp.division_id = d.division_id
    WHERE (e.nik LIKE ? OR e.name LIKE ?)
  `;

  const params = [`%${keyword}%`, `%${keyword}%`];

  if (type) {
    sql += " AND e.employment_type = ?";
    params.push(type);
  }

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ message: "Data tidak ditemukan" });
    res.json(results);
  });
};

export const createEmployee = async (req, res) => {
  try {
    const {
      nik,
      name,
      birth_place,
      birth_date,
      age,
      mother_name,
      religion,
      address,
      phone_number,
      marital_status,
      last_education,
      bank_account,
      identity_number,
      tax_number,
      department_id,
      position,
      employment_type
    } = req.body;

    // File upload
    const fileData = {
      photo: req.files.photo?.[0]?.savedName || null, // nama asli untuk DB
      file_ktp: req.files.ktp?.[0]?.savedName || null,
      file_npwp: req.files.npwpFile?.[0]?.savedName || null,
      file_bpjs_kesehatan: req.files.bpjsKesehatan?.[0]?.savedName || null,
      file_bpjs_ketenagakerjaan: req.files.bpjsKetenagakerjaan?.[0]?.savedName || null,
      file_kk: req.files.kartukeluarga?.[0]?.savedName || null,
      file_training: req.files.sertifikattraining?.[0]?.savedName || null,
      file_mcu: req.files.hasilmcu?.[0]?.savedName || null,
      file_cv: req.files.cvkaryawan?.[0]?.savedName || null,
      file_ijazah: req.files.degreeCertificate?.[0]?.savedName || null
    };


    const sql = `
      INSERT INTO employees
      (nik, name, birth_place, birth_date, age, mother_name, religion,
       address, phone_number, marital_status, last_education, bank_account,
       identity_number, tax_number, department_id, position, employment_type,
       photo, file_ktp, file_npwp, file_bpjs_kesehatan, file_bpjs_ketenagakerjaan,
       file_kk, file_training, file_mcu, file_cv, file_ijazah)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      nik,
      name,
      birth_place,
      birth_date,
      age,
      mother_name,
      religion,
      address,
      phone_number,
      marital_status,
      last_education,
      bank_account,
      identity_number,
      tax_number,
      department_id,
      position,
      employment_type,
      fileData.photo,
      fileData.file_ktp,
      fileData.file_npwp,
      fileData.file_bpjs_kesehatan,
      fileData.file_bpjs_ketenagakerjaan,
      fileData.file_kk,
      fileData.file_training,
      fileData.file_mcu,
      fileData.file_cv,
      fileData.file_ijazah
    ];

    db.query(sql, values, (err, result) => {
      if (err) return res.status(500).json({ message: err });
      res.json({ message: "Employee created", id: result.insertId });
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateEmployee = (req, res) => {
  const nik = req.params.nik; // nik lama
  const dataToUpdate = {
    nik: req.body.nik,
    name: req.body.name,
    address: req.body.address,
    place_of_birth: req.body.birth_place,
    date_of_birth: req.body.birth_date,
    age: req.body.age,
    phone_number: req.body.phone_number,
    last_education: req.body.last_education,
    mother_name: req.body.mother_name,
    religion: req.body.religion,
    marital_status: req.body.marital_status,
    department_id: req.body.department_id,
    employment_type: req.body.employment_type
  };

  Employee.update(nik, dataToUpdate, (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: "Employee updated" });
  });
};



// DELETE employee
export const deleteEmployee = async (req, res) => {
  const nik = req.params.nik;
  try {
    const [result] = await db.promise().query(
      "DELETE FROM employees WHERE NIK = ?",
      [nik]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Employee not found" });
    res.json({ message: "Employee deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


