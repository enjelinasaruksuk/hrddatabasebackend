import fs from "fs";
import path from "path";
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

// GET employee by NIK - SIMPLE VERSION tanpa complex JOIN
export const getEmployeeById = async (req, res) => {
  const nik = req.params.nik || req.params.id || req.query.nik;
  
  console.log("\n=== getEmployeeById START ===");
  console.log("NIK yang akan dipakai:", nik);

  if (!nik) {
    console.log("NIK kosong!");
    return res.status(400).json({ message: "NIK parameter required" });
  }

  try {
    // Query 1: Data employee dengan department & division
    const employeeQuery = `
      SELECT 
        e.*,
        dp.department_name,
        d.division_name
      FROM employees e
      LEFT JOIN departments dp ON e.department_id = dp.department_id
      LEFT JOIN divisions d ON dp.division_id = d.division_id
      WHERE e.NIK = ?
    `;

    const [employeeResults] = await db.promise().query(employeeQuery, [nik]);
    
    if (!employeeResults || employeeResults.length === 0) {
      console.log("Data not found for NIK:", nik);
      return res.status(404).json({ message: "Employee not found" });
    }

    const employee = employeeResults[0];

    // Query 2: Data salary
    const salaryQuery = `SELECT * FROM salary WHERE NIK = ?`;
    const [salaryResults] = await db.promise().query(salaryQuery, [nik]);
    const salary = salaryResults && salaryResults.length > 0 ? salaryResults[0] : {};

    // Query 3: Data contract
    const contractQuery = `SELECT * FROM contracts WHERE NIK = ?`;
    const [contractResults] = await db.promise().query(contractQuery, [nik]);
    const contract = contractResults && contractResults.length > 0 ? contractResults[0] : {};

    // Query 4: Data MCU (ambil yang terbaru)
    const mcuQuery = `
      SELECT 
        GROUP_CONCAT(DATE_FORMAT(last_mcu_date, '%d/%m/%Y') ORDER BY last_mcu_date DESC SEPARATOR ', ') AS mcu_history
      FROM mcu 
      WHERE NIK = ?
    `;
    const [mcuResults] = await db.promise().query(mcuQuery, [nik]);
    const mcuHistory = mcuResults && mcuResults.length > 0 ? mcuResults[0].mcu_history : null;

    // Query 5: Data training
    const trainingQuery = `
      SELECT 
        GROUP_CONCAT(CONCAT(detail, ' (', DATE_FORMAT(training_date, '%d/%m/%Y'), ')') ORDER BY training_date DESC SEPARATOR ', ') AS training_list
      FROM training 
      WHERE NIK = ?
    `;
    const [trainingResults] = await db.promise().query(trainingQuery, [nik]);
    const trainingList = trainingResults && trainingResults.length > 0 ? trainingResults[0].training_list : null;

    // Gabungkan semua data
    const result = {
      ...employee,
      salary_all_in: salary.salary_all_in || null,
      salary_basic: salary.salary_basic || null,
      fixed_allowance: salary.fixed_allowance || null,
      allowance_irregular: salary.non_fixed_allowance || null,
      bpjs_employment: salary.bpjs_employment || null,
      bpjs_health: salary.bpjs_health || null,
      date_join: contract.date_join || null,
      date_end: contract.date_end || null,
      contract_status: contract.contract_status || null,
      mcu_history: mcuHistory,
      training_list: trainingList
    };

    console.log("✅ Success! Returning data");
    console.log("BPJS Employment:", result.bpjs_employment);
    console.log("BPJS Health:", result.bpjs_health);
    console.log("=== getEmployeeById END ===\n");
    
    res.json(result);

  } catch (error) {
    console.error("❌ Error:", error);
    return res.status(500).json({ 
      error: error.message,
      details: error.sqlMessage || error.toString()
    });
  }
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

export const updateEmployee = async (req, res) => {
  const nik = req.params.nik;
  if (!nik) return res.status(400).json({ message: "NIK required" });

  try {
    // 1. Update EMPLOYEES
    const {
      name, mother_name, address, religion, birth_place, birth_date, age,
      marital_status, phone_number, identity_number, last_education,
      tax_number, bank_account, department_id, position
    } = req.body;

    const sqlEmployee = `
      UPDATE employees SET
        name=?, mother_name=?, address=?, religion=?, birth_place=?, birth_date=?,
        age=?, marital_status=?, phone_number=?, identity_number=?, last_education=?,
        tax_number=?, bank_account=?, department_id=?, position=?
      WHERE NIK=?
    `;
    const valuesEmployee = [
      name, mother_name, address, religion, birth_place, birth_date,
      age, marital_status, phone_number, identity_number, last_education,
      tax_number, bank_account, department_id, position, nik
    ];
    await db.promise().query(sqlEmployee, valuesEmployee);

    // 2. Update SALARY 
    const {
      salary_all_in, salary_basic, fixed_allowance, allowance_irregular,
      bpjs_employment, bpjs_health
    } = req.body;

    if (salary_all_in || salary_basic || fixed_allowance || allowance_irregular) {
      const clean = str => str ? parseInt(str.replace(/\./g,'')) : null;
      const sqlSalary = `
        UPDATE salary SET
          salary_all_in=?, salary_basic=?, fixed_allowance=?, non_fixed_allowance=?,
          bpjs_employment=?, bpjs_health=?
        WHERE NIK=?
      `;
      const valuesSalary = [
        clean(salary_all_in),
        clean(salary_basic),
        clean(fixed_allowance),
        clean(allowance_irregular),
        bpjs_employment || null,
        bpjs_health || null,
        nik
      ];
      await db.promise().query(sqlSalary, valuesSalary);
    }

    // 3. Update CONTRACT
    const { date_join, date_end } = req.body;
    if (date_join || date_end) {
      const sqlContract = `
        UPDATE contracts SET date_join=?, date_end=? WHERE NIK=?
      `;
      await db.promise().query(sqlContract, [date_join || null, date_end || null, nik]);
    }

    // 4. Update FILES
    const fileMap = {
  photo: "photo",
  ktp: "file_ktp",
  npwpFile: "file_npwp",
  bpjsKesehatan: "file_bpjs_kesehatan",
  bpjsKetenagakerjaan: "file_bpjs_ketenagakerjaan",
  kartukeluarga: "file_kk",
  sertifikattraining: "file_training",
  hasilmcu: "file_mcu",
  cvkaryawan: "file_cv",
  degreeCertificate: "file_ijazah"
};

for (const field in fileMap) {
  if (req.files?.[field]) {
    const file = req.files[field][0];
    const columnName = fileMap[field];

    const [oldFileRows] = await db.promise().query(
      `SELECT ${columnName} FROM employees WHERE NIK=?`,
      [nik]
    );
    const oldFile = oldFileRows[0]?.[columnName];

    if (oldFile) {
      const filePath = path.join("uploads", oldFile);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await db.promise().query(
      `UPDATE employees SET ${columnName}=? WHERE NIK=?`,
      [file.filename, nik]
    );
  }
}

    res.json({ message: "Employee updated successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
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