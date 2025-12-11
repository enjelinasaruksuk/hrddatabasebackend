import express from "express";
import db from "../config/db.config.js";
const router = express.Router();

router.get("/", (req, res) => {
  const query = `
    SELECT 
      c.contract_id, 
      c.NIK as nik,
      c.date_join, 
      c.date_end,
      c.contract_status,
      e.name, 
      e.position,
      dp.department_name,
      d.division_name
    FROM contracts c
    JOIN employees e ON c.NIK = e.NIK
    LEFT JOIN departments dp ON e.department_id = dp.department_id
    LEFT JOIN divisions d ON dp.division_id = d.division_id
    ORDER BY c.date_join DESC
  `;

  db.query(query, (err, rows) => {
    if (err) {
      console.error("Error fetching contracts:", err);
      return res.status(500).json({ error: "Failed to fetch contracts" });
    }
    
    console.log("✅ Contracts fetched:", rows.length);
    res.json(rows);
  });
});

export default router;