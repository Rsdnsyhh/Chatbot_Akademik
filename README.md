# Retro-OS Chatbot Akademik

Prototipe web chatbot layanan akademik bergaya Retro OS / Windows 95 (title bar biru, font pixel, bevel 1px, scanline CRT, ikon pixel). Dibuat dengan HTML + CSS + JavaScript murni di sisi klien, dengan **Firebase** (Authentication + Firestore) sebagai database dan sistem login. Tidak ada server sendiri dan tidak ada proses build.

Studi kasus: lingkungan kampus Program Studi Informatika, Fakultas Teknik, Universitas Mulawarman.

## Cara menjalankan (VS Code)

1. Clone atau ekstrak repo, lalu buka foldernya di VS Code (File > Open Folder).
2. Pasang ekstensi **Live Server**.
3. Klik kanan `index.html` > **Open with Live Server** (biasanya di `http://127.0.0.1:5500`).

Alternatif tanpa ekstensi: jalankan `python -m http.server 8000` di folder proyek, lalu buka `http://localhost:8000`.

Catatan:
- Aplikasi **harus dibuka lewat server lokal atau GitHub Pages**. Membuka `index.html` dengan klik dua kali tidak lagi didukung, karena SDK Firebase dimuat sebagai module.
- **Koneksi internet wajib** (login dan data memakai Firebase, font memakai Google Fonts).
- Jangan klik tombol ▷ (Run Code) milik ekstensi Code Runner; itu bukan untuk HTML.

## Akun

Tidak ada akun demo di repo ini. Akun dikelola lewat Firebase:

- **Mahasiswa**: login dengan NIM (8–12 digit) dan password. Akun dibuat oleh admin lewat menu **Mahasiswa** di dashboard admin. Mahasiswa tidak bisa mendaftar sendiri.
- **Admin**: login dengan email dan password. Admin ditambahkan manual lewat Firebase Console (lihat bagian *Menambah admin*).

Di balik layar, NIM diubah menjadi email internal `NIM@unmul.local` untuk Firebase Authentication. Tampilan login tidak berubah.

## Menyiapkan Firebase (sekali saja, untuk pemilik project)

1. Buat project di [console.firebase.google.com](https://console.firebase.google.com), lalu tambahkan **Web app** dan salin `firebaseConfig` ke `assets/js/config.js` (bagian `FIREBASE`).
2. **Authentication** > Sign-in method > aktifkan **Email/Password**.
3. **Firestore Database** > Create database (mulai dengan Test mode).
4. Isi data awal: sementara buat halaman seed yang membuat akun dan dokumen dari `data/seed.js` (akun awal diisi pada `SEED.users`), jalankan sekali, lalu **hapus** halaman itu dan kosongkan `SEED.users`.
5. Firestore > tab **Rules** > tempel isi `firestore.rules` > **Publish**. Tanpa langkah ini database terbuka untuk siapa pun.
6. Untuk kerja bersama: Firebase Console > Project settings > Users and permissions > tambahkan temanmu sebagai **Editor**, dan GitHub > Settings > Collaborators.

Teman satu tim cukup clone repo dan membuka lewat Live Server; config Firebase sudah ada di `config.js` sehingga semua orang memakai database yang sama.

## Menambah admin

1. Authentication > Users > **Add user** (email dan password kuat).
2. Salin **User UID** akun tersebut.
3. Firestore > koleksi `users` > **Add document**, Document ID = UID tadi, dengan field string: `id` (email, huruf kecil), `role` = `admin`, `name`.

## Fitur

**Tata letak:** sidebar menu di kiri (di HP menjadi menu bawah) dan satu panel utama di kanan, dengan status bar dan jam. Pindah menu langsung mengganti isi panel, tombol Back browser berfungsi, ada animasi transisi dan layar loading singkat.

**Dashboard Mahasiswa** (`student/dashboard.html`)
- Beranda: sapaan, statistik pribadi, topik populer, dan pertanyaan terakhir.
- Chatbot: avatar, jam kirim, indikator mengetik, tombol Salin, jawaban dengan kartu sumber dokumen, dan panel topik cepat.
- Dokumen: cari dan filter kategori dokumen akademik aktif.
- Panduan, Pengaturan (scanline CRT, animasi mengetik, tampilan sumber), Sampah (hapus riwayat chat), dan Keluar.

**Dashboard Admin** (`admin/dashboard.html`)
- Ringkasan: statistik, grafik pertanyaan 7 hari terakhir, kualitas jawaban, daftar yang perlu ditindaklanjuti, dan pertanyaan terbaru.
- Dokumen: cari, tambah, edit, hapus, aktif/nonaktifkan.
- Log: cari, filter Belum terjawab, Ekspor CSV.
- Mahasiswa: tambah dan hapus akun.

## Data: di mana disimpan

| Data | Lokasi | Dibagi ke semua pengguna |
|---|---|---|
| Profil akun (`users`) | Firestore | Ya (admin melihat semua, mahasiswa hanya profilnya) |
| Dokumen akademik (`docs`) | Firestore | Ya (semua baca, hanya admin yang mengubah) |
| Log pertanyaan (`logs`) | Firestore | Admin melihat semua, mahasiswa hanya miliknya |
| Password | Firebase Authentication | Tidak (tidak bisa dibaca siapa pun) |
| Riwayat chat, pengaturan, hitungan gagal login | `localStorage` browser | Tidak (per browser) |

## Struktur folder

```
├─ index.html              Halaman login (tab Mahasiswa / Admin)
├─ firestore.rules         Security Rules (ditempel di Firebase Console)
├─ student/dashboard.html  Dashboard mahasiswa
├─ admin/dashboard.html    Dashboard admin
├─ data/seed.js            Saran pertanyaan dan dokumen contoh (bahan seed awal)
├─ assets/
│  ├─ css/                 base.css · components.css · desktop.css
│  └─ js/
│     ├─ errors.js         Penanganan error global (dimuat pertama)
│     ├─ config.js         Pengaturan (USE_API, API_URL, config Firebase)
│     ├─ icons.js          Ikon pixel (SVG inline)
│     ├─ store.js          Cache + sinkronisasi Firestore, localStorage untuk data lokal
│     ├─ auth.js           Login Firebase Auth, sesi, penjagaan halaman
│     ├─ ui.js             Toast, modal, window manager, desktop, pengaturan
│     ├─ chatbot.js        Mesin jawaban chatbot
│     └─ login.js · student.js · admin.js   Logika tiap halaman
└─ .vscode/extensions.json Rekomendasi Live Server
```

## Cara kerja Store

`Store` tetap sinkron seperti sebelumnya. Saat halaman dimuat, `await Store.init()` mengambil `users`, `docs`, dan `logs` dari Firestore ke memori. Setiap `Store.s('docs', ...)` memperbarui memori dan menulis selisihnya ke Firestore di belakang layar. Akun mahasiswa baru dibuat dengan `Store.addUser(nim, nama, password)`.

## Cara kerja chatbot

`assets/js/chatbot.js` mencari paragraf dokumen aktif yang paling cocok dengan kata kunci pertanyaan (versi sederhana dari pendekatan RAG):

- Jawaban hanya diambil dari dokumen resmi, lengkap dengan sumbernya.
- Jika tidak ada kecocokan, bot mengaku tidak tahu, mencatat pertanyaan sebagai **Belum terjawab**, dan admin bisa menambah dokumennya.
- Pertanyaan data pribadi (nilai, IPK, tagihan) ditolak dengan penjelasan lingkup.

Isi dokumen di `data/seed.js` hanyalah contoh. Ganti dengan dokumen akademik resmi lewat Dashboard Admin.

## Menyambungkan ke backend RAG/LLM

Di `assets/js/config.js` ubah `USE_API: true` dan isi `API_URL`. Chatbot akan mengirim:

```
POST {API_URL}   { "question": "…", "nim": "2409106025" }
```

dan mengharapkan balasan:

```
{ "answer": "…", "sources": [ { "title": "Pengisian KRS", "date": "2026-08-01" } ] }
```

Jika API gagal, chatbot otomatis memakai mesin lokal.

## Keamanan

- Autentikasi dilakukan oleh Firebase Authentication; password tidak disimpan di kode atau database aplikasi.
- Hak akses dijaga oleh **Security Rules** (`firestore.rules`): mahasiswa hanya membaca dokumen dan log miliknya, hanya admin yang mengubah dokumen dan akun.
- `firebaseConfig` di `config.js` memang publik; keamanannya bergantung pada Security Rules, jadi pastikan rules sudah dipasang.
- Jangan menaruh password, file service account, atau kunci rahasia lain di repo.
- Batas 5 percobaan gagal (kunci 30 detik) dan sesi habis setelah 8 jam diterapkan di sisi klien sebagai lapisan tambahan; Firebase juga membatasi percobaan login berulang.

## Keterbatasan yang diketahui

- Menghapus mahasiswa di dashboard menghapus **profilnya** di Firestore sehingga ia tidak bisa masuk lagi, tetapi akun di Firebase Authentication tetap ada. Hapus manual di Firebase Console bila perlu. Menambahkan ulang NIM yang sama dengan password berbeda akan ditolak sampai akun lamanya dihapus.
- Riwayat chat masih tersimpan di browser masing-masing.
- Tombol **Bersihkan data lokal** di Ringkasan admin hanya membersihkan pengaturan dan riwayat chat di browser itu, tidak menghapus data di database.

## Penanganan error

- **Error global:** error tak terduga ditampilkan sebagai toast tanpa membuat halaman macet; detail ada di Console browser (F12).
- **File gagal dimuat:** muncul layar peringatan yang menyebut file yang bermasalah.
- **Koneksi database:** gangguan saat login menampilkan pesan khusus; bila dashboard gagal memuat data, muncul layar error yang jelas.
- **Penyimpanan lokal:** bila `localStorage` diblokir atau penuh, data lokal disimpan sementara di memori.
- **Login:** validasi format NIM (8–12 digit) dan email, batas percobaan gagal, sesi habis setelah 8 jam, dan akun tanpa profil otomatis dikeluarkan.
- **Chatbot:** input kosong atau terlalu panjang ditolak, kirim ganda dicegah, dan API yang mati atau lambat (8 detik) otomatis diganti mesin lokal.
- **Jendela:** jika satu jendela gagal dirender, hanya jendela itu yang menampilkan pesan dan tombol Coba lagi.
- **Admin:** semua form divalidasi, dan ekspor CSV aman dari injeksi rumus Excel.

Tidak ada kode yang dapat dijamin 100% bebas error pada semua kondisi. Jika masih menemui masalah, buka Console (F12) dan kirim pesan error-nya.

## Menambah aplikasi/jendela baru

Tambahkan fungsi render dan satu entri pada daftar `apps` di `student.js` atau `admin.js`; ikon dan menu otomatis menyesuaikan.
