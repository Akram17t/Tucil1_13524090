# Queens Solver

## Deskripsi Program
Program solver N-Queens dengan algoritma brute-force dengan bahasa c++ yang dilengkapi visualisasi website real-time sederhana. Program menerima grid NxN dengan constraint pewarnaan, lalu mencari penempatan N queens sehingga tidak ada dua queens pada warna yang sama, baris yang sama, kolom yang sama, atau bersebelahan (horizontal/vertikal/diagonal).

## Requirements
- **C++ Compiler**: MinGW g++ atau compiler C++ lainnya
- **Node.js**: Versi 14 atau lebih baru
- **npm**: Package manager untuk Node.js

## Instalasi
1. Clone repository ini
2. Install dependencies Node.js:
   ```bash
   npm install
   ```

## Cara Kompilasi
Compile program C++ solver dengan perintah:
```bash
g++ -Wall -Wextra -O2 main.cpp -o output/main.exe
```

Atau di Linux/Mac:
```bash
g++ -Wall -Wextra -O2 main.cpp -o output/main
```

## Cara Menjalankan
1. Pastikan solver C++ sudah dikompilasi (ada file `output/main.exe`)
2. Start server:
   ```bash
   npm start
   ```
3. Buka browser dan akses: **http://localhost:3000**
4. Masukkan grid NxN di textarea
5. Klik tombol **Solve**
6. Hasil dan visualisasi proses akan ditampilkan secara real-time

## Struktur File
```
.
├── main.cpp                 # Solver C++ brute-force
├── server.js                # Express.js server dengan SSE
├── index.html               # Frontend web UI
├── package.json             # Node.js dependencies
├── output/
│   └── main.exe             # Binary hasil kompilasi
└── .gitignore               # Git ignore rules
```

## Author
**Nashiruddin Akram**  
NIM: 13524090  
Teknik Informatika ITB
