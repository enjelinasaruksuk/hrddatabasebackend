# 🏬 SIMKARIN - Sistem Informasi Karyawan Terintegrasi

SIMKARIN adalah aplikasi berbasis web untuk manajemen data karyawan dan database HRD PT Lancang Kuning Sukses. Aplikasi ini dibangun menggunakan Next.js sebagai frontend dan Express.js sebagai backend.

---

## 📋 Prasyarat

Sebelum memulai instalasi, pastikan perangkat Anda telah terpasang:
1. Git - Version control system
2. Visual Studio Code - Code editor 
3. XAMPP/Laragon - Local server dan database
4. Node.js 
5. npm - Node package manager
6. MySQL - Database management system

---

## ⚙️ Instalasi Aplikasi

Berikut langkah-langkah untuk menjalankan aplikasi SIMKARIN secara lokal:

### 1. Cek Instalasi Tools

Buka terminal/command prompt dan jalankan perintah berikut untuk memastikan semua tools sudah terinstal:

1. git --version
2. node --version
3. npm --version

### 2. Setup Database

1. Jalankan XAMPP Control Panel atau Laragon
2. Start Apache dan MySQL
3. Buka browser dan akses: http://localhost/phpmyadmin
4. Buat database baru dengan nama: simkarin_db

### 3. Setup Backend

Clone repositori backend pada terminal:
1. git clone https://github.com/enjelinasaruksuk/hrddatabasebackend.git
2. cd hrddatabasebackend

Install dependencies:
1. npm install

### 4. Konfigurasi Environment Backend

Buat file .env di root folder backend dan isi dengan konfigurasi berikut:

JWT_SECRET=SECRET_KEY_SIMKARIN_2025
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=simkarin_db
PORT=5000

### 5. Jalankan Backend

Jalankan server backend dengan perintah:
1. node server.js

Backend akan berjalan di: http://localhost:5000

### 6. Setup Frontend

Buka terminal baru, lalu clone repositori frontend:

1. git clone https://github.com/enjelinasaruksuk/hrddatabasefrontend.git
2. cd hrddatabasefrontend

Install dependencies:
1. npm install

### 7. Jalankan Frontend

Jalankan aplikasi frontend dengan perintah:
1. npm run dev

Frontend akan berjalan di: http://localhost:3000

### 8. Akses Aplikasi

Buka browser dan akses aplikasi melalui:
1. http://localhost:3000

---

## 🚀 Cara Menjalankan Aplikasi

Setiap kali ingin menjalankan aplikasi:

1. Start XAMPP/Laragon (Apache & MySQL)
2. Terminal 1 - Backend:

   - cd hrddatabasebackend
   - node server.js
   
3. Terminal 2 - Frontend:
  
   - cd hrddatabasefrontend
   - npm run dev
   
4. Akses di browser: http://localhost:3000

---

## 📚 Dokumen Proyek

### Laporan,PPT AAS, Manual Book, dan Poster PBL tertera pada link berikut:
https://drive.google.com/drive/folders/19zWgjXbWByW05o5JB_QpxOfjlc5XAcDJ?usp=sharing

---

## 🎥 Video Presentasi & Tutorial

### Video Presentasi AAS
🎬 Video presentasi proyek PBL SIMKARIN:
https://youtu.be/2h_CM5S1qJA?si=ENuh7W6gJgTQAnfW

### Video Tutorial Penggunaan Aplikasi
🎬 Video tutorial lengkap yang mendemonstrasikan seluruh fitur aplikasi SIMKARIN:
https://youtu.be/PQWeF5rjajk?si=FR7rEyIv-Bc6sAcd

---

## 🛠️ Troubleshooting

### Port Sudah Digunakan
Jika port 3000 atau 5000 sudah digunakan, hentikan aplikasi lain atau ubah port di konfigurasi.

### Database Tidak Terkoneksi
1. Pastikan MySQL di XAMPP/Laragon sudah running
2. Cek konfigurasi .env apakah sudah benar
3. Pastikan database simkarin_db sudah dibuat

### Error saat npm install
1. Hapus folder node_modules dan file package-lock.json
2. Jalankan ulang npm install

---

## 👥 Tim Pengembang

IFPagi3A-5
1. 3312401015 - Enjelina Saruksuk  
2. 3312401006 – Marsha Olivia  
3. 3312401021 – Aulia Salsabilla  
4. 3312401028 – Sabrina Rosa Salsyabilla 
 
---

## 📄 Lisensi

Proyek ini dibuat untuk keperluan akademik sebagai bagian dari mata kuliah PBL.
Hak cipta © 2026 Tim SIMKARIN. Seluruh hak dilindungi.

---
