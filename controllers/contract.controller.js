const db = require("../config/db.config.js");

exports.getAllContracts = (req, res) => {
  db.query(
    `SELECT nik, name, position, date_join, date_end,
     DATEDIFF(date_end, CURDATE()) AS days_left
     FROM employees
     WHERE status='contract'`,
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json(result);
    }
  );
};
