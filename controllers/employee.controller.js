import fs from "fs";
import path from "path";
import Employee from "../models/employee.model.js";
import db from "../config/db.config.js";

export const getAllEmployees = (req, res) => {
  Employee.getAll((err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
};

export const getFulltimeEmployees = (req, res) => {
  const { keyword, division, department } = req.query;
  Employee.getByEmploymentType("fulltime", keyword || null, division || null, department || null, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
};

export const getParttimeEmployees = (req, res) => {
  const { keyword, division, department } = req.query;
  Employee.getByEmploymentType("parttime", keyword || null, division || null, department || null, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
};

export const getEmployeeById = async (req, res) => {
  const nik = req.params.nik || req.params.id || req.query.nik;
  if (!nik) return res.status(400).json({ message: "NIK parameter required" });

  try {
    const query = `
      SELECT 
        e.*,
        dp.department_name,
        d.division_name,
        
        (SELECT date_join FROM contracts WHERE NIK = e.NIK ORDER BY contract_id DESC LIMIT 1) AS date_join,
        (SELECT date_end FROM contracts WHERE NIK = e.NIK ORDER BY contract_id DESC LIMIT 1) AS date_end,
        (SELECT contract_status FROM contracts WHERE NIK = e.NIK ORDER BY contract_id DESC LIMIT 1) AS contract_status,
        
        (SELECT salary_all_in FROM salary WHERE NIK = e.NIK LIMIT 1) AS salary_all_in,
        (SELECT salary_basic FROM salary WHERE NIK = e.NIK LIMIT 1) AS salary_basic,
        (SELECT fixed_allowance FROM salary WHERE NIK = e.NIK LIMIT 1) AS fixed_allowance,
        (SELECT non_fixed_allowance FROM salary WHERE NIK = e.NIK LIMIT 1) AS allowance_irregular,
        (SELECT bpjs_employment FROM salary WHERE NIK = e.NIK LIMIT 1) AS bpjs_employment,
        (SELECT bpjs_health FROM salary WHERE NIK = e.NIK LIMIT 1) AS bpjs_health,
        
        (SELECT GROUP_CONCAT(DISTINCT DATE_FORMAT(last_mcu_date, '%d/%m/%Y') ORDER BY last_mcu_date DESC SEPARATOR ', ') 
         FROM mcu WHERE NIK = e.NIK) AS mcu_history,
        
        (SELECT GROUP_CONCAT(DISTINCT CONCAT(detail, ' (', DATE_FORMAT(training_date, '%d/%m/%Y'), ')') ORDER BY training_date DESC SEPARATOR ', ') 
         FROM training WHERE NIK = e.NIK) AS training_list,
         
        (SELECT detail FROM training WHERE NIK = e.NIK ORDER BY training_id DESC LIMIT 1) AS training_detail,
        (SELECT training_date FROM training WHERE NIK = e.NIK ORDER BY training_id DESC LIMIT 1) AS training_date,
        (SELECT expiry_date FROM training WHERE NIK = e.NIK ORDER BY training_id DESC LIMIT 1) AS expiry_date
         
      FROM employees e
      LEFT JOIN departments dp ON e.department_id = dp.department_id
      LEFT JOIN divisions d ON dp.division_id = d.division_id
      WHERE e.NIK = ?
    `;
    
    const [results] = await db.promise().query(query, [nik]);
    
    if (!results || results.length === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }
    
    res.json(results[0]);
  } catch (error) {
    console.error("Error in getEmployeeById:", error);
    res.status(500).json({ error: error.message });
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
  // ❌ SALAH - GANTI INI
  // const params = [%${keyword}%, %${keyword}%];
  // ✅ BENAR - PAKAI INI
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
      nik, name, birth_place, birth_date, age, mother_name, religion,
      address, phone_number, marital_status, last_education, bank_account,
      identity_number, tax_number, department_id, position, employment_type,
      salary_all_in, salary_basic, fixed_allowance, non_fixed_allowance,
      bpjs_employment, bpjs_health, date_join, date_end,
      mcu_date, training_detail, training_date, expiry_date
    } = req.body;

    const fileData = {
      photo: req.files?.photo?.[0]?.filename || null,
      file_ktp: req.files?.ktp?.[0]?.filename || null,
      file_npwp: req.files?.npwpFile?.[0]?.filename || null,
      file_bpjs_kesehatan: req.files?.bpjsKesehatan?.[0]?.filename || null,
      file_bpjs_ketenagakerjaan: req.files?.bpjsKetenagakerjaan?.[0]?.filename || null,
      file_kk: req.files?.kartukeluarga?.[0]?.filename || null,
      file_training: req.files?.sertifikattraining?.[0]?.filename || null,
      file_mcu: req.files?.hasilmcu?.[0]?.filename || null,
      file_cv: req.files?.cvkaryawan?.[0]?.filename || null,
      file_ijazah: req.files?.degreeCertificate?.[0]?.filename || null
    };

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
      nik, name, birth_place, birth_date, age, mother_name, religion,
      address, phone_number, marital_status, last_education, bank_account,
      identity_number, tax_number, department_id, position, employment_type,
      fileData.photo, fileData.file_ktp, fileData.file_npwp, fileData.file_bpjs_kesehatan,
      fileData.file_bpjs_ketenagakerjaan, fileData.file_kk, fileData.file_training,
      fileData.file_mcu, fileData.file_cv, fileData.file_ijazah
    ];
    await db.promise().query(sqlEmployee, valuesEmployee);

    if (salary_all_in || salary_basic || fixed_allowance || non_fixed_allowance) {
      const sqlSalary = `
        INSERT INTO salary 
        (NIK, salary_all_in, salary_basic, fixed_allowance, non_fixed_allowance, bpjs_employment, bpjs_health)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      const cleanNumber = (str) => str ? parseInt(str.toString().replace(/\./g, '')) : null;
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

    if (date_join || date_end) {
      // ❌ SALAH - GANTI INI
      // const sqlContract = INSERT INTO contracts (NIK, date_join, date_end, contract_status) VALUES (?, ?, ?, ?);
      // ✅ BENAR - PAKAI INI
      const sqlContract = `INSERT INTO contracts (NIK, date_join, date_end, contract_status) VALUES (?, ?, ?, ?)`;
      await db.promise().query(sqlContract, [nik, date_join || null, date_end || null, 'Active']);
    }

    if (mcu_date) {
      // ❌ SALAH - GANTI INI
      // const sqlMcu = INSERT INTO mcu (NIK, last_mcu_date, mcu_result) VALUES (?, ?, ?);
      // ✅ BENAR - PAKAI INI
      const sqlMcu = `INSERT INTO mcu (NIK, last_mcu_date, mcu_result) VALUES (?, ?, ?)`;
      await db.promise().query(sqlMcu, [nik, mcu_date, 'Medical Check Up Completed']);
    }

    if (training_detail && training_date) {
      // ❌ SALAH - GANTI INI
      // const sqlTraining = INSERT INTO training (NIK, detail, training_date, expiry_date, certificate_file) VALUES (?, ?, ?, ?, ?);
      // ✅ BENAR - PAKAI INI
      const sqlTraining = `INSERT INTO training (NIK, detail, training_date, expiry_date, certificate_file) VALUES (?, ?, ?, ?, ?)`;
      await db.promise().query(sqlTraining, [nik, training_detail, training_date, expiry_date || null, fileData.file_training]);
    }

    res.json({ message: "Employee created successfully", nik });

  } catch (error) {
    console.error("Error creating employee:", error);
    res.status(500).json({ message: "Failed to create employee", error: error.message });
  }
};

export const updateEmployee = async (req, res) => {
  const nik = req.params.nik;
  if (!nik) return res.status(400).json({ message: "NIK required" });

  try {
    const {
      name, birth_place, birth_date, age, mother_name, religion,
      address, phone_number, marital_status, last_education, bank_account,
      identity_number, tax_number, department_id, position, employment_type,
      salary_all_in, salary_basic, fixed_allowance, non_fixed_allowance,
      bpjs_employment, bpjs_health, date_join, date_end, contract_status,
      mcu_date, training_detail, training_date, expiry_date
    } = req.body;

    const [existing] = await db.promise().query("SELECT * FROM employees WHERE NIK = ?", [nik]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const oldData = existing[0];
    const fileData = {
      photo: req.files?.photo?.[0]?.filename || oldData.photo,
      file_ktp: req.files?.ktp?.[0]?.filename || oldData.file_ktp,
      file_npwp: req.files?.npwpFile?.[0]?.filename || oldData.file_npwp,
      file_bpjs_kesehatan: req.files?.bpjsKesehatan?.[0]?.filename || oldData.file_bpjs_kesehatan,
      file_bpjs_ketenagakerjaan: req.files?.bpjsKetenagakerjaan?.[0]?.filename || oldData.file_bpjs_ketenagakerjaan,
      file_kk: req.files?.kartukeluarga?.[0]?.filename || oldData.file_kk,
      file_training: req.files?.sertifikattraining?.[0]?.filename || oldData.file_training,
      file_mcu: req.files?.hasilmcu?.[0]?.filename || oldData.file_mcu,
      file_cv: req.files?.cvkaryawan?.[0]?.filename || oldData.file_cv,
      file_ijazah: req.files?.degreeCertificate?.[0]?.filename || oldData.file_ijazah
    };

    const deleteOldFile = (oldFile, newFile) => {
      if (oldFile && newFile && oldFile !== newFile) {
        const filePath = path.join(process.cwd(), 'uploads', oldFile);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    };

    Object.keys(fileData).forEach(key => {
      if (req.files?.[key]?.[0]?.filename) {
        deleteOldFile(oldData[key], fileData[key]);
      }
    });

    const sqlEmployee = `
      UPDATE employees SET
        name = ?, birth_place = ?, birth_date = ?, age = ?, mother_name = ?,
        religion = ?, address = ?, phone_number = ?, marital_status = ?,
        last_education = ?, bank_account = ?, identity_number = ?, tax_number = ?,
        department_id = ?, position = ?, employment_type = ?,
        photo = ?, file_ktp = ?, file_npwp = ?, file_bpjs_kesehatan = ?,
        file_bpjs_ketenagakerjaan = ?, file_kk = ?, file_training = ?,
        file_mcu = ?, file_cv = ?, file_ijazah = ?
      WHERE NIK = ?
    `;
    const valuesEmployee = [
      name, birth_place, birth_date, age, mother_name, religion,
      address, phone_number, marital_status, last_education, bank_account,
      identity_number, tax_number, department_id, position, employment_type,
      fileData.photo, fileData.file_ktp, fileData.file_npwp, fileData.file_bpjs_kesehatan,
      fileData.file_bpjs_ketenagakerjaan, fileData.file_kk, fileData.file_training,
      fileData.file_mcu, fileData.file_cv, fileData.file_ijazah, nik
    ];
    await db.promise().query(sqlEmployee, valuesEmployee);

    if (salary_all_in || salary_basic || fixed_allowance || non_fixed_allowance) {
      const cleanNumber = (str) => str ? parseInt(str.toString().replace(/\./g, '')) : null;
      const [salaryExists] = await db.promise().query("SELECT * FROM salary WHERE NIK = ?", [nik]);
      
      if (salaryExists.length > 0) {
        const sqlSalary = `
          UPDATE salary SET
            salary_all_in = ?, salary_basic = ?, fixed_allowance = ?,
            non_fixed_allowance = ?, bpjs_employment = ?, bpjs_health = ?
          WHERE NIK = ?
        `;
        await db.promise().query(sqlSalary, [
          cleanNumber(salary_all_in), cleanNumber(salary_basic), 
          cleanNumber(fixed_allowance), cleanNumber(non_fixed_allowance),
          bpjs_employment || null, bpjs_health || null, nik
        ]);
      } else {
        const sqlSalary = `
          INSERT INTO salary (NIK, salary_all_in, salary_basic, fixed_allowance, non_fixed_allowance, bpjs_employment, bpjs_health)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        await db.promise().query(sqlSalary, [
          nik, cleanNumber(salary_all_in), cleanNumber(salary_basic),
          cleanNumber(fixed_allowance), cleanNumber(non_fixed_allowance),
          bpjs_employment || null, bpjs_health || null
        ]);
      }
    }

    if (date_join || date_end || contract_status) {
      const [contractExists] = await db.promise().query("SELECT * FROM contracts WHERE NIK = ? ORDER BY contract_id DESC LIMIT 1", [nik]);
      
      if (contractExists.length > 0) {
        const sqlContract = `
          UPDATE contracts SET
            date_join = ?, date_end = ?, contract_status = ?
          WHERE contract_id = ?
        `;
        await db.promise().query(sqlContract, [
          date_join || null, date_end || null, 
          contract_status || 'Active', contractExists[0].contract_id
        ]);
      } else {
        // ❌ SALAH - GANTI INI
        // const sqlContract = INSERT INTO contracts (NIK, date_join, date_end, contract_status) VALUES (?, ?, ?, ?);
        // ✅ BENAR - PAKAI INI
        const sqlContract = `INSERT INTO contracts (NIK, date_join, date_end, contract_status) VALUES (?, ?, ?, ?)`;
        await db.promise().query(sqlContract, [nik, date_join || null, date_end || null, contract_status || 'Active']);
      }
    }

    if (mcu_date) {
      const [mcuExists] = await db.promise().query("SELECT * FROM mcu WHERE NIK = ? ORDER BY mcu_id DESC LIMIT 1", [nik]);
      if (mcuExists.length > 0) {
        await db.promise().query("UPDATE mcu SET last_mcu_date = ? WHERE mcu_id = ?", [mcu_date, mcuExists[0].mcu_id]);
      } else {
        await db.promise().query("INSERT INTO mcu (NIK, last_mcu_date, mcu_result) VALUES (?, ?, ?)", 
          [nik, mcu_date, 'Medical Check Up Completed']);
      }
    }

    if (training_detail && training_date) {
      const [trainingExists] = await db.promise().query("SELECT * FROM training WHERE NIK = ? ORDER BY training_id DESC LIMIT 1", [nik]);
      if (trainingExists.length > 0) {
        await db.promise().query(
          "UPDATE training SET detail = ?, training_date = ?, expiry_date = ?, certificate_file = ? WHERE training_id = ?",
          [training_detail, training_date, expiry_date || null, fileData.file_training, trainingExists[0].training_id]
        );
      } else {
        await db.promise().query(
          "INSERT INTO training (NIK, detail, training_date, expiry_date, certificate_file) VALUES (?, ?, ?, ?, ?)",
          [nik, training_detail, training_date, expiry_date || null, fileData.file_training]
        );
      }
    }

    res.json({ message: "Employee updated successfully" });

  } catch (error) {
    console.error("Error updating employee:", error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteEmployee = async (req, res) => {
  const nik = req.params.nik;
  try {
    const [employee] = await db.promise().query("SELECT * FROM employees WHERE NIK = ?", [nik]);
    if (employee.length === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const fileFields = ['photo', 'file_ktp', 'file_npwp', 'file_bpjs_kesehatan', 
                       'file_bpjs_ketenagakerjaan', 'file_kk', 'file_training', 
                       'file_mcu', 'file_cv', 'file_ijazah'];
    
    fileFields.forEach(field => {
      if (employee[0][field]) {
        const filePath = path.join(process.cwd(), 'uploads', employee[0][field]);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    });

    await db.promise().query("DELETE FROM training WHERE NIK = ?", [nik]);
    await db.promise().query("DELETE FROM mcu WHERE NIK = ?", [nik]);
    await db.promise().query("DELETE FROM contracts WHERE NIK = ?", [nik]);
    await db.promise().query("DELETE FROM salary WHERE NIK = ?", [nik]);
    await db.promise().query("DELETE FROM employees WHERE NIK = ?", [nik]);
    
    res.json({ message: "Employee deleted successfully" });
  } catch (error) {
    console.error("Error deleting employee:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getEmployeeCounts = (req, res) => {
  const sql = `
    SELECT 
      SUM(CASE WHEN employment_type = 'fulltime' THEN 1 ELSE 0 END) AS fulltime,
      SUM(CASE WHEN employment_type = 'parttime' THEN 1 ELSE 0 END) AS parttime
    FROM employees
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results[0]);
  });
};