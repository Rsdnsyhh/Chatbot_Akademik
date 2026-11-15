/* KONFIGURASI. Aktifkan USE_API bila backend RAG/LLM sudah tersedia (lihat README). */
const CONFIG = {
  USE_API: false,
  TIMEOUT_MS: 8000, // batas waktu menunggu API sebelum memakai mesin lokal
  API_URL: 'http://localhost:8000/api/chat', // POST {question, nim} -> {answer, sources:[{title,date}]}

  /* Firebase (config web memang publik; keamanan diatur oleh Security Rules) */
  FIREBASE_VER: '10.14.1',
  STUDENT_DOMAIN: 'unmul.local', // NIM 2409106025 -> email 2409106025@unmul.local (hanya internal)
  FIREBASE: {
    apiKey: 'AIzaSyA3sxtqLdXW_f5KG2TqP71imhfX34S_y78',
    authDomain: 'chatbot-akademik-unmul.firebaseapp.com',
    projectId: 'chatbot-akademik-unmul',
    storageBucket: 'chatbot-akademik-unmul.firebasestorage.app',
    messagingSenderId: '645144268880',
    appId: '1:645144268880:web:e7df15b927c8d118580155'
  }
};
