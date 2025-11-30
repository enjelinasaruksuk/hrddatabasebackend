import Employee from "../models/employee.model.js";
import db from "../config/db.config.js";

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

// GET employee by NIK - DENGAN SEMUA FIELD (FIXED)
export const getEmployeeById = (req, res) => {
  const nik = req.params.nik || req.params.id || req.query.nik;
  
  console.log("\n=== getEmployeeById ===");
  console.log("NIK yang akan dipakai:", nik);

  if (!nik) {
    console.log("NIK kosong!");
    return res.status(400).json({ message: "NIK parameter required" });
  }

  // Query dengan JOIN ke semua tabel yang diperlukan
  const query = `
    SELECT 
      e.NIK,
      e.name,
      e.birth_place,
      e.birth_date,
      e.age,
      e.ktp_number,
      e.mother_name,
      e.religion,
      e.address,
      e.phone_number,
      e.marital_status,
      e.last_education,
      e.bank_account,
      e.tax_number,
      e.photo,
      e.department_id,
      e.position,
      e.employment_type,
      e.identity_number,
      e.file_ktp,
      e.file_npwp,
      e.file_bpjs_kesehatan,
      e.file_bpjs_ketenagakerjaan,
      e.file_kk,
      e.file_training,
      e.file_mcu,
      e.file_cv,
      e.file_ijazah,
      dp.department_name,
      d.division_name,
      c.date_join,
      c.date_end,
      c.contract_status,
      s.salary_all_in,
      s.salary_basic,
      s.fixed_allowance,
      s.non_fixed_allowance AS allowance_irregular,
      s.bpjs_employment,
      s.bpjs_health,
      GROUP_CONCAT(DISTINCT DATE_FORMAT(m.last_mcu_date, '%d/%m/%Y') ORDER BY m.last_mcu_date DESC SEPARATOR ', ') AS mcu_history,
      GROUP_CONCAT(DISTINCT CONCAT(t.detail, ' (', DATE_FORMAT(t.training_date, '%d/%m/%Y'), ')') ORDER BY t.training_date DESC SEPARATOR ', ') AS training_list
    FROM employees e
    LEFT JOIN departments dp ON e.department_id = dp.department_id
    LEFT JOIN divisions d ON dp.division_id = d.division_id
    LEFT JOIN contracts c ON e.NIK = c.NIK
    LEFT JOIN salary s ON e.NIK = s.NIK
    LEFT JOIN mcu m ON e.NIK = m.NIK
    LEFT JOIN training t ON e.NIK = t.NIK
    WHERE e.NIK = ?
    GROUP BY e.NIK
  `;

  db.query(query, [nik], (err, results) => {
    if (err) {
      console.error("DB Error:", err);
      return res.status(500).json({ error: err.message });
    }

    if (!results || results.length === 0) {
      console.log("Data not found for NIK:", nik);
      return res.status(404).json({ message: "Employee not found" });
    }

    console.log("Success! Returning data");
    res.json(results[0]);
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
    WHERE (e.NIK LIKE ? OR e.name LIKE ?)
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

// CREATE employee - INSERT KE MULTIPLE TABLES
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
      employment_type,
      // Data tambahan untuk tabel lain
      salary_all_in,
      salary_basic,
      fixed_allowance,
      non_fixed_allowance,
      bpjs_employment,
      bpjs_health,
      date_join,
      date_end,
      mcu_date,
      training_detail,
      training_date,
      expiry_date
    } = req.body;

    const fileData = {
      photo: req.files.photo?.[0]?.filename || null,
      file_ktp: req.files.ktp?.[0]?.filename || null,
      file_npwp: req.files.npwpFile?.[0]?.filename || null,
      file_bpjs_kesehatan: req.files.bpjsKesehatan?.[0]?.filename || null,
      file_bpjs_ketenagakerjaan: req.files.bpjsKetenagakerjaan?.[0]?.filename || null,
      file_kk: req.files.kartukeluarga?.[0]?.filename || null,
      file_training: req.files.sertifikattraining?.[0]?.filename || null,
      file_mcu: req.files.hasilmcu?.[0]?.filename || null,
      file_cv: req.files.cvkaryawan?.[0]?.filename || null,
      file_ijazah: req.files.degreeCertificate?.[0]?.filename || null
    };

    // 1. INSERT ke tabel EMPLOYEES
    const sqlEmployee = `
      INSERT INTO employees
      (NIK, name, birth_place, birth_date, age, mother_name, religion,
       address, phone_number, marital_status, last_education, bank_account,
       identity_number, tax_number, department_id, position, employment_type,
       photo, file_ktp, file_npwp, file_bpjs_kesehatan, file_bpjs_ketenagakerjaan,
       file_kk, file_training, file_mcu, file_cv, file_ijazah)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const valuesEmployee = [
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

    await db.promise().query(sqlEmployee, valuesEmployee);

    // 2. INSERT ke tabel SALARY (jika ada data salary)
    if (salary_all_in || salary_basic || fixed_allowance || non_fixed_allowance) {
      const sqlSalary = `
        INSERT INTO salary 
        (NIK, salary_all_in, salary_basic, fixed_allowance, non_fixed_allowance, bpjs_employment, bpjs_health)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      // Konversi format rupiah (hapus titik) ke angka
      const cleanNumber = (str) => str ? parseInt(str.replace(/\./g, '')) : null;

      const valuesSalary = [
        nik,
        cleanNumber(salary_all_in),
        cleanNumber(salary_basic),
        cleanNumber(fixed_allowance),
        cleanNumber(non_fixed_allowance),
        bpjs_employment || null,
        bpjs_health || null
      ];

      await db.promise().query(sqlSalary, valuesSalary);
    }

    // 3. INSERT ke tabel CONTRACTS (jika ada date_join atau date_end)
    if (date_join || date_end) {
      const sqlContract = `
        INSERT INTO contracts 
        (NIK, date_join, date_end, contract_status)
        VALUES (?, ?, ?, ?)
      `;

      const valuesContract = [
        nik,
        date_join || null,
        date_end || null,
        'Active'
      ];

      await db.promise().query(sqlContract, valuesContract);
    }

    // 4. INSERT ke tabel MCU (jika ada mcu_date)
    if (mcu_date) {
      const sqlMcu = `
        INSERT INTO mcu 
        (NIK, last_mcu_date, mcu_result)
        VALUES (?, ?, ?)
      `;

      const valuesMcu = [
        nik,
        mcu_date,
        'Medical Check Up Completed'
      ];

      await db.promise().query(sqlMcu, valuesMcu);
    }

    // 5. INSERT ke tabel TRAINING (jika ada training_detail)
    if (training_detail && training_date) {
      const sqlTraining = `
        INSERT INTO training 
        (NIK, detail, training_date, expiry_date, certificate_file)
        VALUES (?, ?, ?, ?, ?)
      `;

      const valuesTraining = [
        nik,
        training_detail,
        training_date,
        expiry_date || null,
        fileData.file_training
      ];

      await db.promise().query(sqlTraining, valuesTraining);
    }

    res.json({ 
      message: "Employee created successfully with all related data",
      nik: nik 
    });

  } catch (error) {
    console.error("Error creating employee:", error);
    res.status(500).json({ 
      message: "Failed to create employee",
      error: error.message 
    });
  }
};

export const updateEmployee = (req, res) => {
  const nik = req.params.nik;
  const dataToUpdate = {
    nik: req.body.nik,
    name: req.body.name,
    address: req.body.address,
    birth_place: req.body.birth_place,
    birth_date: req.body.birth_date,
    age: req.body.age,
    phone_number: req.body.phone_number,
    last_education: req.body.last_education,
    mother_name: req.body.mother_name,
    religion: req.body.religion,
    marital_status: req.body.marital_status,
    department_id: req.body.department_id,
    employment_type: req.body.employment_type,
    identity_number: req.body.identity_number,
    tax_number: req.body.tax_number,
    bank_account: req.body.bank_account,
    position: req.body.position
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