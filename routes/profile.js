import express from "express";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";
import db from "../config/db.config.js";
import { authenticateToken } from "../middlewares/auth.js";

const router = express.Router();

// =========================================
// SETUP MULTER UNTUK UPLOAD FOTO
// =========================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/profiles";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (jpeg, jpg, png, gif)"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

// =========================================
// GET PROFILE - Ambil data user yang login
// =========================================
router.get("/", authenticateToken, (req, res) => {
  const userId = req.user.id;
  
  const query = `SELECT user_id, username, phone_number, role, profile_photo FROM users WHERE user_id = ?`;
  
  db.query(query, [userId], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Server error" });
    }
    
    if (result.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const user = result[0];
    
    // Tambahkan full URL untuk profile photo
    if (user.profile_photo) {
      user.profile_photo_url = `${req.protocol}://${req.get('host')}/${user.profile_photo}`;
    }
    
    res.json({
      message: "Profile retrieved successfully",
      user
    });
  });
});

// =========================================
// UPDATE PROFILE - Update data user
// =========================================
router.put("/", authenticateToken, upload.single('profile_photo'), async (req, res) => {
  const userId = req.user.id;
  const { username, phone_number, password } = req.body;
  
  try {
    // Validasi password jika diisi
    if (password && password.length < 8) {
      return res.status(400).json({ 
        message: "Password must be at least 8 characters long" 
      });
    }
    
    // Ambil data user lama
    const getUserQuery = `SELECT profile_photo FROM users WHERE user_id = ?`;
    db.query(getUserQuery, [userId], async (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ message: "Server error" });
      }
      
      if (result.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const oldUser = result[0];
      
      // Siapkan data untuk update
      let updateFields = [];
      let updateValues = [];
      
      if (username) {
        updateFields.push("username = ?");
        updateValues.push(username);
      }
      
      if (phone_number) {
        updateFields.push("phone_number = ?");
        updateValues.push(phone_number);
      }
      
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updateFields.push("password = ?");
        updateValues.push(hashedPassword);
      }
      
      // Handle upload foto baru
      if (req.file) {
        const photoPath = req.file.path.replace(/\\/g, '/');
        updateFields.push("profile_photo = ?");
        updateValues.push(photoPath);
        
        // Hapus foto lama jika ada
        if (oldUser.profile_photo && fs.existsSync(oldUser.profile_photo)) {
          fs.unlinkSync(oldUser.profile_photo);
        }
      }
      
      if (updateFields.length === 0) {
        return res.status(400).json({ 
          message: "No fields to update" 
        });
      }
      
      updateValues.push(userId);
      
      const updateQuery = `UPDATE users SET ${updateFields.join(", ")} WHERE user_id = ?`;
      
      db.query(updateQuery, updateValues, (err2, updateResult) => {
        if (err2) {
          console.error("Update error:", err2);
          
          // Hapus foto yang baru diupload jika update gagal
          if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
          
          return res.status(500).json({ message: "Failed to update profile" });
        }
        
        // Ambil data user yang sudah diupdate
        const getUpdatedQuery = `SELECT user_id, username, phone_number, role, profile_photo FROM users WHERE user_id = ?`;
        db.query(getUpdatedQuery, [userId], (err3, updatedResult) => {
          if (err3) {
            return res.status(500).json({ message: "Profile updated but failed to retrieve new data" });
          }
          
          const updatedUser = updatedResult[0];
          if (updatedUser.profile_photo) {
            updatedUser.profile_photo_url = `${req.protocol}://${req.get('host')}/${updatedUser.profile_photo}`;
          }
          
          res.json({
            message: "Profile updated successfully",
            user: updatedUser
          });
        });
      });
    });
    
  } catch (error) {
    console.error("Error:", error);
    
    // Hapus foto jika ada error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ message: "Server error" });
  }
});

export default router;