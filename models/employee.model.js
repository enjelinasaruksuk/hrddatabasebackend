import db from "../config/db.config.js";

const Employee = {
  // GET all employees
  getAll: (callback) => {
    const query = `
      SELECT 
        e.*,
        dp.department_name AS department_name,
        d.division_name AS division_name
      FROM employees e
      LEFT JOIN departments dp ON e.department_id = dp.department_id
      LEFT JOIN divisions d ON dp.division_id = d.division_id
    `;
    db.query(query, callback);
  },

  // GET employees by employment type dengan filter
  getByEmploymentType: (type, keyword, division, department, callback) => {
    let query = `
      SELECT 
        e.*,
        dp.department_name AS department_name,
        d.division_name AS division_name
      FROM employees e
      LEFT JOIN departments dp ON e.department_id = dp.department_id
      LEFT JOIN divisions d ON dp.division_id = d.division_id
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
    console.log("Tipe:", typeof nik);

    const query = `
      SELECT 
        e.*,
        dp.department_name AS department_name,
        d.division_name AS division_name
      FROM employees e
      LEFT JOIN departments dp ON e.department_id = dp.department_id
      LEFT JOIN divisions d ON dp.division_id = d.division_id
      WHERE e.NIK = ?
    `;

    console.log("Query SQL:", query);
    console.log("Parameter:", [nik]);

    db.query(query, [nik], (err, results) => {
      console.log("Error:", err);
      console.log("Results:", results);
      console.log("Results length:", results ? results.length : 0);

      if (err) {
        console.error("Database error:", err);
        return callback(err, null);
      }

      // Return single object, bukan array
      const result = results && results.length > 0 ? results[0] : null;
      console.log("Final result:", result);
      console.log("=== END DEBUG ===\n");

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