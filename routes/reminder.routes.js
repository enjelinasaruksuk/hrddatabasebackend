import express from "express";
import db from "../config/db.config.js";

const router = express.Router();

// =========================
// CONTRACT REMINDER
// =========================
router.get("/contracts", async (req, res) => {
  try {
    const sql = `
      SELECT 
        c.contract_id AS id,
        e.name,
        e.position,
        c.date_join,
        c.date_end,
        DATEDIFF(c.date_end, CURDATE()) AS days_left
      FROM contracts c
      JOIN employees e ON e.NIK = c.NIK
      WHERE c.date_end IS NOT NULL
        AND DATEDIFF(c.date_end, CURDATE()) <= 30
      ORDER BY days_left ASC
    `;

    db.query(sql, (err, result) => {
      if (err) {
        console.error("Contract reminder error:", err);
        return res.status(500).json({ message: "DB Error", error: err });
      }
      res.json(result);
    });
  } catch (error) {
    console.error("Contract reminder catch:", error);
    res.status(500).json({ message: "Server Error", error });
  }
});

// =========================
// TRAINING REMINDER
// =========================
router.get("/training", async (req, res) => {
  try {
    const sql = `
      SELECT 
        t.training_id AS id,
        e.name,
        e.position,
        t.detail AS training_name,
        t.expiry_date,
        DATEDIFF(t.expiry_date, CURDATE()) AS days_left
      FROM training t
      JOIN employees e ON e.NIK = t.NIK
      WHERE t.expiry_date IS NOT NULL
        AND DATEDIFF(t.expiry_date, CURDATE()) <= 30
      ORDER BY days_left ASC
    `;

    db.query(sql, (err, result) => {
      if (err) {
        console.error("Training reminder error:", err);
        return res.status(500).json({ message: "DB Error", error: err });
      }
      res.json(result);
    });
  } catch (error) {
    console.error("Training reminder catch:", error);
    res.status(500).json({ message: "Server Error", error });
  }
});

// =========================
// TOTAL NOTIFICATION COUNT
// =========================
router.get("/count", async (req, res) => {
  try {
    const sqlContracts = `
      SELECT COUNT(*) AS count
      FROM contracts  
      WHERE date_end IS NOT NULL
        AND DATEDIFF(date_end, CURDATE()) <= 30
    `;

    const sqlTraining = `
      SELECT COUNT(*) AS count
      FROM training
      WHERE expiry_date IS NOT NULL
        AND DATEDIFF(expiry_date, CURDATE()) <= 30
    `;

    db.query(sqlContracts, (err1, c1) => {
      if (err1) {
        console.error("Count contracts error:", err1);
        return res.status(500).json({ message: "DB Error", error: err1 });
      }

      db.query(sqlTraining, (err2, c2) => {
        if (err2) {
          console.error("Count training error:", err2);
          return res.status(500).json({ message: "DB Error", error: err2 });
        }

        const total = c1[0].count + c2[0].count;

        res.json({
          contracts: c1[0].count,
          training: c2[0].count,
          total,
        });
      });
    });
  } catch (error) {
    console.error("Count catch error:", error);
    res.status(500).json({ message: "Server Error", error });
  }
});

export default router;