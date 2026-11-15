# Retro-OS Chatbot Akademik

Prototipe web chatbot layanan akademik bergaya **Retro OS / Windows 95** (window title bar biru, font pixel, bevel 1px, scanline CRT, ikon pixel). Dibuat dengan HTML + CSS + JavaScript murni, **tanpa backend dan tanpa instalasi**, sehingga langsung bisa dijalankan dari VS Code.

Studi kasus: lingkungan kampus Program Studi Informatika, Fakultas Teknik, Universitas Mulawarman.

## Cara menjalankan (VS Code)
1. Ekstrak zip, lalu buka folder `retro-chatbot` di VS Code (`File > Open Folder`).
2. Pasang ekstensi **Live Server** (VS Code akan menawarkannya otomatis).
3. Klik kanan `index.html` > **Open with Live Server**. Browser terbuka di `http://127.0.0.1:5500`.

Alternatif tanpa ekstensi: buka terminal di folder proyek, jalankan `python -m http.server 8000`, lalu buka `http://localhost:8000`.

> **Jangan klik tombol ▷ (Run Code) di pojok kanan atas editor.** Tombol itu milik ekstensi Code Runner dan hanya untuk Python/JS/dll., sehingga menampilkan *"Code language not supported or defined"* untuk HTML. Pesan itu bukan error di kodenya.
> Opsi lain tanpa ekstensi: tekan `Ctrl+Shift+B` (menjalankan server Python lewat `.vscode/tasks.json`), lalu buka `http://localhost:5500`. Atau cukup klik dua kali `index.html` di File Explorer, karena web ini juga jalan langsung dari file.

> Internet dibutuhkan hanya untuk memuat font Google (Press Start 2P dan Inter). Tanpa internet tampilan tetap jalan dengan font cadangan.

## Akun demo
| Peran | Login | Password |
|---|---|---|
| Mahasiswa | NIM `2409106025` (juga `…024`, `…013`, `…043`) | `unmul123` |
| Admin | `admin@unmul.ac.id` | `admin123` |

Di halaman login, pilih tab **Mahasiswa** (isi NIM) atau **Admin** (isi email). Akun mahasiswa tambahan dibuat admin lewat jendela *Akun Mahasiswa*.

## Fitur
**Tata letak**: sidebar menu di kiri (di HP menjadi menu bawah) dan satu panel utama di kanan, lengkap dengan status bar *ONLINE* dan jam. Pindah menu langsung mengganti isi panel (tanpa jendela bertumpuk), tombol Back browser berfungsi, ada animasi transisi dan layar loading singkat. Tidak ada tombol minimize/maximize/close dan tidak ada taskbar menu terbuka.

**Dashboard Mahasiswa** (`student/dashboard.html`)
- **Beranda**: sapaan, statistik pribadi, *topik populer* (klik langsung bertanya), dan pertanyaan terakhir.
- **Chatbot**: avatar, jam kirim, indikator mengetik, tombol Salin, jawaban dengan kartu sumber dokumen, serta panel *topik cepat* di samping (di HP berupa chip).
- **Dokumen**: cari dan filter kategori dokumen akademik aktif.
- **Panduan**: cara memakai dan catatan etika. **Pengaturan**: scanline CRT, animasi mengetik, tampilan sumber.
- **Sampah**: hapus riwayat chat (dengan konfirmasi). **Keluar**: logout dengan konfirmasi.

**Dashboard Admin** (`admin/dashboard.html`)
- **Ringkasan**: statistik, grafik pertanyaan 7 hari terakhir, bar kualitas jawaban, daftar *perlu ditindaklanjuti* (tombol **+ Dokumen**), dan pertanyaan terbaru.
- **Dokumen**: cari, tambah, edit (halaman editor), hapus, aktif/nonaktifkan.
- **Log**: cari, filter *Belum terjawab*, **Ekspor CSV** untuk uji akurasi.
- **Mahasiswa**: tambah/hapus akun. **Reset data demo** ada di Ringkasan.

## Struktur folder
```
retro-chatbot/
├─ index.html              Halaman login (tab Mahasiswa / Admin)
├─ student/dashboard.html  Desktop mahasiswa
├─ admin/dashboard.html    Desktop admin
├─ data/seed.js            Data awal: akun demo, dokumen contoh, saran pertanyaan
├─ assets/
│  ├─ css/
│  │  ├─ base.css          Token warna, reset, efek CRT
│  │  ├─ components.css    Window, tombol, input, tab, progress, tabel, modal, chat
│  │  └─ desktop.css       Desktop, ikon, taskbar, start menu, responsif
│  └─ js/
│     ├─ errors.js         Penanganan error global (dimuat pertama)
│     ├─ config.js         Pengaturan (USE_API, API_URL)
│     ├─ icons.js          Ikon pixel (SVG inline)
│     ├─ store.js          Penyimpanan localStorage + hash password
│     ├─ auth.js           Login, sesi, penjagaan halaman
│     ├─ ui.js             Toast, modal, window manager, desktop, pengaturan
│     ├─ chatbot.js        Mesin jawaban chatbot
│     ├─ login.js · student.js · admin.js   Logika tiap halaman
└─ .vscode/extensions.json Rekomendasi Live Server
```

## Cara kerja chatbot
`assets/js/chatbot.js` mencari paragraf dokumen aktif yang paling cocok dengan kata kunci pertanyaan (versi sederhana dari pendekatan RAG). Aturannya:
1. Jawaban **hanya** diambil dari dokumen resmi, lengkap dengan sumbernya.
2. Jika tidak ada kecocokan, bot mengaku tidak tahu, mencatat pertanyaan sebagai *Belum terjawab*, dan admin bisa menambah dokumennya.
3. Pertanyaan data pribadi (nilai, IPK, tagihan) ditolak dengan penjelasan lingkup.

Isi dokumen di `data/seed.js` hanyalah **contoh**. Ganti dengan isi dokumen akademik resmi lewat Dashboard Admin, atau edit `seed.js` lalu klik *Reset data demo*.

## Menyambungkan ke backend RAG/LLM
Di `assets/js/config.js` ubah `USE_API: true` dan isi `API_URL`. Chatbot akan mengirim:
```json
POST {API_URL}   { "question": "…", "nim": "2409106025" }
```
dan mengharapkan balasan:
```json
{ "answer": "…", "sources": [ { "title": "Pengisian KRS", "date": "2026-08-01" } ] }
```
Jika API gagal, chatbot otomatis memakai mesin lokal.

## Penanganan error
- **Error global**: error tak terduga ditangkap dan ditampilkan sebagai toast, tanpa membuat halaman macet. Detail ada di Console browser (F12).
- **File hilang/gagal dimuat**: muncul layar peringatan yang menyebut file yang bermasalah, bukan halaman kosong.
- **Penyimpanan**: bila localStorage diblokir atau penuh, data disimpan sementara di memori dan pengguna diberi tahu. Data yang rusak atau hilang dipulihkan otomatis dari data awal.
- **Login**: validasi format NIM (8–12 digit) dan email, batas 5 percobaan gagal (kunci 30 detik), sesi habis setelah 8 jam, dan akun yang dihapus otomatis terlempar ke login.
- **Chatbot**: input kosong/terlalu panjang ditolak, kirim ganda dicegah, dan API yang mati, lambat (8 detik), atau berformat salah otomatis memakai mesin lokal.
- **Jendela**: jika satu jendela gagal dirender, hanya jendela itu yang menampilkan pesan dan tombol *Coba lagi*; aplikasi lain tetap jalan.
- **Admin**: semua form divalidasi (judul, isi, tanggal, NIM, nama, password), dan ekspor CSV aman dari injeksi rumus Excel.

Tidak ada kode yang dapat dijamin 100% bebas error pada semua kondisi. Jika masih menemui masalah, buka Console (F12) dan kirim pesan error-nya.

## Catatan penting
- Ini **prototipe**: data (akun, dokumen, log, riwayat chat) disimpan di `localStorage` browser, dan login hanya diperiksa di sisi klien. Password memang di-hash (SHA-256), tetapi ini **bukan keamanan sungguhan**. Untuk produksi, pindahkan autentikasi dan penyimpanan ke backend dan database.
- Data tiap browser terpisah. Untuk mengosongkan, pakai *Reset data demo* atau hapus data situs di browser.
- Ingin menambah aplikasi/jendela baru? Tambahkan fungsi render dan satu entri pada daftar `apps` di `student.js` atau `admin.js`; ikon dan taskbar otomatis menyesuaikan.
