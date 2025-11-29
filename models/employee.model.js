import db from "../config/db.config.js";

const Employee = {
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

  // FILTER KEYWORD (name atau NIK)
  if (keyword) {
    query += ` AND (e.name LIKE ? OR e.nik LIKE ?)`;
    const like = `%${keyword}%`;
    params.push(like, like);
  }

  // FILTER DIVISION
  if (division) {
    query += ` AND d.division_name = ?`;
    params.push(division);
  }

  // FILTER DEPARTMENT
  if (department) {
    query += ` AND dp.department_name = ?`;
    params.push(department);
  }

  db.query(query, params, callback);
},


getById: (id, callback) => {
  const query = `
    SELECT 
      e.*,
      dp.department_name AS department_name,
      d.division_name AS division_name
    FROM employees e
    LEFT JOIN departments dp ON e.department_id = dp.department_id
    LEFT JOIN divisions d ON dp.division_id = d.division_id
    WHERE e.idz = ?
  `;
  db.query(query, [id], callback);
},


  //  SEARCH 
  search: (keyword, callback) => {
    const query = `
      SELECT 
        e.*,
        dp.department_name AS department_name,
        d.division_name AS division_name
      FROM employees e
      LEFT JOIN departments dp ON e.department_id = dp.department_id
      LEFT JOIN divisions d ON dp.division_id = d.division_id
      WHERE e.nik LIKE ? OR e.name LIKE ?
    `;
    
    const like = `%${keyword}%`;
    db.query(query, [like, like], callback);
  },

  create: (data, callback) => {
    const query = `
      INSERT INTO employees 
(nik, name, address, place_of_birth, date_of_birth, age, 
 phone_number, last_education, mother_name, religion, marital_status,
department_id, employment_type)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(query, [
      data.nik,
      data.name,
      data.address,
      data.place_of_birth,
      data.date_of_birth,
      data.age,
      data.phone_number,
      data.last_education,
      data.mother_name,
      data.religion,
      data.marital_status,
      data.department_id,
      data.employment_type
    ], callback);
  },

  update: (nik, data, callback) => {
  const query = `
    UPDATE employees SET
      nik=?, name=?, address=?, place_of_birth=?, date_of_birth=?, age=?,
      phone_number=?, last_education=?, mother_name=?, religion=?, marital_status=?,
      department_id=?, employment_type=?
    WHERE nik=?
  `;
  db.query(query, [
    data.nik,
    data.name,
    data.address,
    data.place_of_birth,
    data.date_of_birth,
    data.age,
    data.phone_number,
    data.last_education,
    data.mother_name,
    data.religion,
    data.marital_status,
    data.department_id,
    data.employment_type,
    nik // <-- pastikan ini nik lama, bukan id
  ], callback);
},


  delete: (id, callback) => {
    db.query("DELETE FROM employees WHERE nik = ?", [id], callback);
  }
};

export default Employee;
