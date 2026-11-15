/* DATA AWAL (contoh). Ganti isi dokumen dengan dokumen akademik resmi, atau kelola lewat Dashboard Admin. */
const SEED = {
  users: [],
  suggest: ['Bagaimana cara mengisi KRS?', 'Cara mengajukan cuti akademik', 'Syarat surat keterangan aktif kuliah', 'Jam layanan akademik'],
  docs: [
    { id: 'd1', title: 'Pengisian KRS', cat: 'Akademik', date: '2026-08-01', active: true,
      content: 'KRS diisi melalui sistem informasi akademik pada periode yang ditetapkan kalender akademik. Mahasiswa memilih mata kuliah sesuai batas SKS yang diizinkan.\n\nSetelah pengisian, KRS harus disetujui dosen wali. KRS yang belum disetujui dosen wali belum dianggap sah.' },
    { id: 'd2', title: 'Cuti Akademik', cat: 'Akademik', date: '2026-08-01', active: true,
      content: 'Mahasiswa dapat mengajukan cuti akademik dengan alasan yang jelas. Pengajuan dilakukan secara tertulis kepada program studi sebelum perkuliahan semester berjalan dimulai.\n\nKetentuan lengkap mengenai masa cuti mengikuti pedoman akademik yang berlaku.' },
    { id: 'd3', title: 'Surat Keterangan Aktif Kuliah', cat: 'Administrasi', date: '2026-08-01', active: true,
      content: 'Surat keterangan aktif kuliah dapat diminta di bagian akademik dengan membawa kartu mahasiswa dan KRS semester berjalan.\n\nProses penerbitan mengikuti jam layanan bagian akademik.' },
    { id: 'd4', title: 'Pembayaran UKT', cat: 'Keuangan', date: '2026-08-01', active: true,
      content: 'Pembayaran UKT dilakukan pada periode yang diumumkan setiap semester. Mahasiswa yang mengalami kendala pembayaran dapat menghubungi bagian keuangan atau bagian akademik untuk menanyakan prosedur keringanan.' },
    { id: 'd5', title: 'Jam Layanan Akademik', cat: 'Umum', date: '2026-08-01', active: true,
      content: 'Layanan tatap muka bagian akademik tersedia pada hari kerja dan jam kerja. Di luar jam tersebut, mahasiswa dapat memakai chatbot ini atau mengirim pertanyaan tertulis.' },
    { id: 'd6', title: 'Pengajuan Tugas Akhir', cat: 'Akademik', date: '2026-08-01', active: true,
      content: 'Pengajuan judul tugas akhir dilakukan kepada koordinator program studi setelah mahasiswa memenuhi syarat SKS minimal yang tercantum dalam pedoman akademik.\n\nDosen pembimbing ditetapkan setelah judul disetujui.' }
  ]
};
