/* KONFIGURASI. Aktifkan USE_API bila backend RAG/LLM sudah tersedia (lihat README). */
const CONFIG = {
  USE_API: false,
  TIMEOUT_MS: 8000, // batas waktu menunggu API sebelum memakai mesin lokal
  API_URL: 'http://localhost:8000/api/chat' // POST {question, nim} -> {answer, sources:[{title,date}]}
};
