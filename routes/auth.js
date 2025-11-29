import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../config/db.config.js";

const router = express.Router();

// =========================================
// LOGIN + AUTO REGISTER
// =========================================
router.post("/login", async (req, res) => {
  const { username, password, role } = req.body;
  
  if (!username || !password || !role) {
    return res.status(400).json({ message: "All fields required" });
  }

  const query = `SELECT * FROM users WHERE username = ? AND role = ?`;
  
  db.query(query, [username, role], async (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Server error" });
    }

    // =========================================
    // CASE 1: USER BELUM ADA → AUTO-REGISTER
    // =========================================
    if (result.length === 0) {
      try {
        const hashed = await bcrypt.hash(password, 10);
        const insertQuery = `INSERT INTO users (username, password, role) VALUES (?, ?, ?)`;
        
        db.query(insertQuery, [username, hashed, role], (err2, insertResult) => {
          if (err2) {
            console.error("Auto-register error:", err2);
            return res.status(500).json({ message: "Auto-register failed" });
          }

          const token = jwt.sign(
            { id: insertResult.insertId, role },
            process.env.JWT_SECRET || "SECRET_KEY",
            { expiresIn: "1d" }
          );

          return res.json({
            message: "User created & login success (auto register)",
            token,
            role,
            username
          });
        });
      } catch (error) {
        console.error("Hash error:", error);
        return res.status(500).json({ message: "Hash error" });
      }
      return;
    }

    // =========================================
    // CASE 2: USER ADA → LOGIN BIASA
    // =========================================
    const user = result[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      return res.status(400).json({ message: "Wrong password" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || "SECRET_KEY",
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login success",
      token,
      role: user.role,
      username: user.username
    });
  });
});

export default router;