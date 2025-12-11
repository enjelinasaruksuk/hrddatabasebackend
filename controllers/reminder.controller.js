import db from "../config/db.config.js";

const getContractReminders = (req, res) => {
  const query = `
    SELECT 
      e.name,
      e.position,
      c.date_end,
      DATEDIFF(c.date_end, CURDATE()) AS days_left
    FROM contracts c
    JOIN employees e ON e.NIK = c.NIK
    WHERE DATEDIFF(c.date_end, CURDATE()) <= 30
    ORDER BY days_left ASC
  `;

  db.query(query, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
};

export default {
  getContractReminders
};
