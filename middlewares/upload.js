import multer from "multer";
import path from "path";

// konfigurasi storage multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // folder tempat file disimpan
  },
  filename: (req, file, cb) => {
    // bikin nama unik untuk upload (timestamp + originalname)
    const uniqueName = Date.now() + "-" + file.originalname;
    
    // simpan nama asli ke properti custom, nanti dipakai untuk DB
    file.savedName = file.originalname;
    
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

export default upload;
