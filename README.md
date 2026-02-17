# N-Queens Solver dengan Pewarnaan

## a. Penjelasan Program

Program ini mengimplementasikan algoritma brute-force backtracking untuk menyelesaikan masalah N-Queens dengan constraint pewarnaan tambahan. Output ditampilkan pada web interface dengan visualisasi real-time berikut update board dalam interval 50ms. Solver ditulis dalam C++ dan dijalankan melalui Express.js backend.

## b. Requirement dan Instalasi

**Requirements:**
- Node.js (v14+)
- Express.js 4.x
- g++ compiler (MinGW di Windows, gcc/clang di Linux/Mac)

**Instalasi:**
```bash
cd src
npm install
```

## c. Cara Mengkompilasi

Jalankan dari root directory:

**Windows:**
```bash
g++ -Wall -Wextra -O2 src/main.cpp -o bin/main.exe
```

**Linux/Mac:**
```bash
g++ -Wall -Wextra -O2 src/main.cpp -o bin/main
```

## d. Cara Menjalankan dan Menggunakan

1. Compile program terlebih dahulu (lihat bagian c)
2. Jalankan server dari folder src:
   ```bash
   cd src
   npm start
   ```
3. Buka browser ke **http://localhost:3000**
4. Masukkan grid NxN (format: baris per baris, karakter A-Z):
   ```
   AAB
   CBB
   CCA
   ```
5. Klik tombol "Solve" untuk menjalankan solver
6. Lihat visualisasi board yang terupdate secara real-time
7. Download hasil (PNG atau TXT) setelah selesai

---

**Nashiruddin Akram** (13524090) | Teknik Informatika ITB
