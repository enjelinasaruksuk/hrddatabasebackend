import db from "../config/db.config.js";

const Employee = {
  // GET all employees
  getAll: (callback) => {
  const query = `
    SELECT 
      e.*,
      dp.department_name AS department_name,
      dv.division_name AS division_name,

      -- Salary
      s.salary_all_in,
      s.salary_basic,
      s.fixed_allowance,
      s.non_fixed_allowance AS allowance_irregular,
      s.bpjs_employment,
      s.bpjs_health,

      -- Contract
      c.date_join,
      c.date_end,
      c.contract_status,

      -- MCU (latest)
      (
        SELECT DATE_FORMAT(last_mcu_date, '%Y-%m-%d')
        FROM mcu 
        WHERE NIK = e.NIK
        ORDER BY last_mcu_date DESC 
        LIMIT 1
      ) AS mcu_history,

      -- TRAINING
      (
        SELECT GROUP_CONCAT(
          CONCAT(detail, ' (', DATE_FORMAT(training_date,'%Y-%m-%d'), ')')
          ORDER BY training_date DESC SEPARATOR ', '
        )
        FROM training 
        WHERE NIK = e.NIK
      ) AS training_list

    FROM employees e
    LEFT JOIN departments dp ON e.department_id = dp.department_id
    LEFT JOIN divisions dv ON dp.division_id = dv.division_id
    LEFT JOIN salary s ON s.nik = e.NIK
    LEFT JOIN contracts c ON c.nik = e.NIK
    LEFT JOIN mcu m ON m.nik = e.NIK
    LEFT JOIN training t ON t.nik = e.NIK
  `;
  db.query(query, callback);
},

  // GET employees by employment type lengkap dengan salary, contract, MCU, training
getByEmploymentType: (type, keyword, division, department, callback) => {
  let query = `
    SELECT 
      e.*,
      dp.department_name AS department_name,
      d.division_name AS division_name,

      -- Salary
      s.salary_all_in,
      s.salary_basic,
      s.fixed_allowance,
      s.non_fixed_allowance AS allowance_irregular,
      s.bpjs_employment,
      s.bpjs_health,

      -- Contract
      c.date_join,
      c.date_end,
      c.contract_status,

      -- MCU (latest)
      (
        SELECT DATE_FORMAT(last_mcu_date, '%Y-%m-%d')
        FROM mcu 
        WHERE NIK = e.NIK
        ORDER BY last_mcu_date DESC 
        LIMIT 1
      ) AS last_mcu_date,

      -- TRAINING
      (
        SELECT GROUP_CONCAT(
          CONCAT(detail, ' (', DATE_FORMAT(training_date,'%Y-%m-%d'), ')')
          ORDER BY training_date DESC SEPARATOR ', '
        )
        FROM training 
        WHERE NIK = e.NIK
      ) AS training_list

    FROM employees e
    LEFT JOIN departments dp ON e.department_id = dp.department_id
    LEFT JOIN divisions d ON dp.division_id = d.division_id
    LEFT JOIN salary s ON e.NIK = s.NIK
    LEFT JOIN contracts c ON e.NIK = c.NIK
    WHERE e.employment_type = ?
  `;

  let params = [type];

  if (keyword) {
    query += ` AND (e.name LIKE ? OR e.NIK LIKE ?)`;
    const like = `%${keyword}%`;
    params.push(like, like);
  }

  if (division) {
    query += ` AND d.division_name = ?`;
    params.push(division);
  }

  if (department) {
    query += ` AND dp.department_name = ?`;
    params.push(department);
  }

  db.query(query, params, callback);
},

  // GET employee by NIK - DENGAN DEBUG
  getById: (nik, callback) => {
  console.log("\n=== MODEL getById DEBUG ===");
  console.log("NIK input:", nik);

  const query = `
    SELECT 
      e.*,
      dp.department_name AS department_name,
      d.division_name AS division_name,

      -- Salary
      s.salary_all_in,
      s.salary_basic,
      s.fixed_allowance,
      s.non_fixed_allowance AS allowance_irregular,
      s.bpjs_employment,
      s.bpjs_health,

      -- Contract
      c.date_join,
      c.date_end,
      c.contract_status,

      -- MCU (latest)
      (
        SELECT DATE_FORMAT(last_mcu_date, '%Y-%m-%d')
        FROM mcu 
        WHERE NIK = e.NIK
        ORDER BY last_mcu_date DESC 
        LIMIT 1
      ) AS last_mcu_date,

      -- TRAINING
      (
        SELECT GROUP_CONCAT(
          CONCAT(detail, ' (', DATE_FORMAT(training_date,'%Y-%m-%d'), ')')
          ORDER BY training_date DESC SEPARATOR ', '
        )
        FROM training 
        WHERE NIK = e.NIK
      ) AS training_list

    FROM employees e
    LEFT JOIN departments dp ON e.department_id = dp.department_id
    LEFT JOIN divisions dv ON dp.division_id = dv.division_id
    LEFT JOIN salary s ON s.nik = e.NIK
    LEFT JOIN contracts c ON c.nik = e.NIK
    LEFT JOIN mcu m ON m.nik = e.NIK
    LEFT JOIN training t ON t.nik = e.NIK
    WHERE e.NIK = ?
  `;

  db.query(query, [nik], (err, results) => {
    if (err) return callback(err, null);

    const result = results && results.length > 0 ? results[0] : null;
    callback(null, result);
  });
},

  // SEARCH - cari berdasarkan NIK atau nama
  search: (keyword, callback) => {
    const query = `
      SELECT 
        e.*,
        dp.department_name AS department_name,
        d.division_name AS division_name
      FROM employees e
      LEFT JOIN departments dp ON e.department_id = dp.department_id
      LEFT JOIN divisions d ON dp.division_id = d.division_id
      WHERE e.NIK LIKE ? OR e.name LIKE ?
    `;

    const like = `%${keyword}%`;
    db.query(query, [like, like], callback);
  },

  // CREATE employee
  create: (data, callback) => {
    const query = `
      INSERT INTO employees 
      (NIK, name, address, birth_place, birth_date, age, 
       phone_number, last_education, mother_name, religion, marital_status,
       department_id, employment_type, identity_number, tax_number, bank_account, position)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(query, [
      data.nik,
      data.name,
      data.address,
      data.birth_place,
      data.birth_date,
      data.age,
      data.phone_number,
      data.last_education,
      data.mother_name,
      data.religion,
      data.marital_status,
      data.department_id,
      data.employment_type,
      data.identity_number,
      data.tax_number,
      data.bank_account,
      data.position
    ], callback);
  },

  // UPDATE employee
  update: (nik, data, callback) => {
    const query = `
      UPDATE employees SET
        NIK=?, name=?, address=?, birth_place=?, birth_date=?, age=?,
        phone_number=?, last_education=?, mother_name=?, religion=?, marital_status=?,
        department_id=?, employment_type=?, identity_number=?, tax_number=?, bank_account=?, position=?
      WHERE NIK=?
    `;
    db.query(query, [
      data.nik,
      data.name,
      data.address,
      data.birth_place,
      data.birth_date,
      data.age,
      data.phone_number,
      data.last_education,
      data.mother_name,
      data.religion,
      data.marital_status,
      data.department_id,
      data.employment_type,
      data.identity_number,
      data.tax_number,
      data.bank_account,
      data.position,
      nik
    ], callback);
  },

  // DELETE employee
  delete: (nik, callback) => {
    db.query("DELETE FROM employees WHERE NIK = ?", [nik], callback);
  }
};

export default Employee;