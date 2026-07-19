========================================================================
           LSTM PADI BACKEND API - DOKUMENTASI & PANDUAN INSTALASI
========================================================================

Proyek ini adalah backend service berbasis FastAPI yang digunakan untuk 
melakukan peramalan (prediksi) hasil panen padi di Kabupaten Jember menggunakan 
model Deep Learning Long Short-Term Memory (LSTM). Backend ini juga terintegrasi 
dengan Firebase Firestore sebagai basis data dan API BMKG untuk sinkronisasi data cuaca secara otomatis.

------------------------------------------------------------------------
1. STRUKTUR DIREKTORI PROYEK
------------------------------------------------------------------------
Berikut adalah struktur folder dan berkas utama dalam proyek ini:

backend-lstm-padi/
├── app/                        # Direktori utama aplikasi FastAPI
│   ├── api/                    # Handler API/Route endpoint
│   │   ├── autentifikasi.py    # Endpoint login admin, logout, dan status session
│   │   ├── features.py         # CRUD data fitur kecamatan ke Firestore
│   │   └── predict.py          # Endpoint untuk pemrosesan prediksi LSTM
│   ├── core/                   # Konfigurasi inti aplikasi
│   │   ├── config.py           # Memuat environment variables dari .env
│   │   ├── firebase_config.py  # Inisialisasi Firebase Admin SDK
│   │   └── master_data.py      # Data pemetaan kode desa (ADM4) untuk API BMKG
│   ├── models/                 # Model LSTM dan Scaler pra-pemrosesan
│   │   ├── model_lstm_panen_jember_tuned.h5  # Model TensorFlow LSTM
│   │   ├── scaler_X.pkl        # Scaler MinMaxScaler untuk Fitur Input
│   │   └── scaler_Y.pkl        # Scaler MinMaxScaler untuk Fitur Output (Produksi)
│   ├── schemas/                # Skema data Pydantic untuk request validation
│   │   └── input_data.py       # Validasi input data login & fitur kecamatan
│   ├── services/               # Logika bisnis & pengolahan data
│   │   ├── firebase_service.py # Interaksi Firestore REST API & Scheduler Cuaca BMKG
│   │   └── predict_service.py  # Logika pemrosesan sekuensial & prediksi LSTM
│   └── main.py                 # Titik masuk utama aplikasi (Main entrypoint)
├── .env                        # File konfigurasi environment aktual (diabaikan oleh git)
├── .env.example                # Template konfigurasi environment (contoh/placeholder)
├── .gitignore                  # File daftar pengecualian Git
├── readme.txt                  # Dokumentasi ini (berkas panduan)
├── requirements.txt            # Daftar pustaka/dependensi Python
└── venv/                       # Virtual environment Python (opsional)

------------------------------------------------------------------------
2. PERSYARATAN SISTEM (PRE-REQUISITES)
------------------------------------------------------------------------
Sebelum memulai instalasi, pastikan sistem Anda telah terpasang:
- Python 3.10 atau versi 3.12 (Direkomendasikan)
- Pip (Python Package Manager)
- Git (untuk cloning repository)
- Akses internet aktif (untuk koneksi Firestore & BMKG API)

------------------------------------------------------------------------
3. PANDUAN INSTALASI & MENJALANKAN (DARI NOL)
------------------------------------------------------------------------

=== PERINTAH CEPAT SEKALI JALAN (QUICK COPY-PASTE SETUP) ===

Untuk menginstal dan menjalankan backend secara instan, buka terminal Anda lalu jalankan baris perintah di bawah ini sesuai sistem operasi Anda:

- Untuk Linux / macOS (Bash):
  git clone -b backend https://github.com/af133/lstm-padi.git && cd backend-lstm-padi && python3 -m venv venv && source venv/bin/activate && pip install --upgrade pip && pip install -r requirements.txt && cp .env.example .env && uvicorn app.main:app --reload

- Untuk Windows (PowerShell):
  git clone -b backend https://github.com/af133/lstm-padi.git; cd backend-lstm-padi; python -m venv venv; .\venv\Scripts\Activate.ps1; pip install --upgrade pip; pip install -r requirements.txt; copy .env.example .env; uvicorn app.main:app --reload

*Catatan: Setelah perintah selesai dieksekusi, harap sesuaikan isi berkas `.env` dengan kredensial Firebase dan reCAPTCHA Anda.*

=============================================================

Langkah-langkah detailnya:

Langkah 1: Clone Repository
Buka terminal/command prompt Anda, lalu jalankan perintah berikut:
   git clone -b backend https://github.com/af133/lstm-padi.git
   cd backend-lstm-padi

Langkah 2: Buat Virtual Environment (venv)
Membuat venv sangat disarankan untuk menjaga dependensi proyek terisolasi:
   python -m venv venv

Langkah 3: Aktifkan Virtual Environment
- Di Windows (Command Prompt):
   venv\Scripts\activate
- Di Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
- Di Linux / macOS:
   source venv/bin/activate

Setelah aktif, terminal Anda akan memiliki tanda (venv) di awal baris.

Langkah 4: Instal Dependensi / Library
Jalankan perintah berikut untuk menginstal seluruh pustaka yang dibutuhkan:
   pip install --upgrade pip
   pip install -r requirements.txt

Langkah 5: Konfigurasi Environment File (.env)
Buat berkas bernama `.env` di direktori utama proyek (sejajar dengan readme.txt), lalu isi dengan konfigurasi berikut (sesuaikan nilainya jika diperlukan):

--- Mulai Isi File .env ---
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
FIREBASE_APP_ID=your_firebase_app_id
FIREBASE_MEASUREMENT_ID=your_measurement_id
MODEL_OUTPUT_MODE=auto
MODEL_OUTPUT_MULTIPLIER=1
MODEL_OUTPUT_OFFSET=0
RECAPTCHA_SITE_KEY=your_recaptcha_site_key
SECRET_KEY_RECAPTCHA=your_recaptcha_secret_key
PREDICTION_API_URL=http://127.0.0.1:8000
--- Selesai Isi File .env ---

Langkah 6: Menjalankan Server Aplikasi
Jalankan FastAPI server menggunakan Uvicorn:
   uvicorn app.main:app --reload

Jika berhasil, Anda akan melihat log seperti:
   INFO:     Started server process [PID]
   INFO:     Waiting for application startup.
   Scheduler cuaca telah aktif via Lifespan!
   INFO:     Application startup complete.
   INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)

------------------------------------------------------------------------
4. FITUR DAN ALUR PENGIMPLEMENTASIAN (WORKFLOW)
------------------------------------------------------------------------

A. Mekanisme Prediksi LSTM (Rolling Prediction)
- Model LSTM membutuhkan input berdimensi (1, 3, 16) yang berarti membutuhkan 3 bulan data runtun waktu (sequence length = 3) dengan masing-masing bulan memiliki 16 fitur input.
- Fitur input yang digunakan di antaranya: luas tanam, luas panen bersih, curah hujan, suhu rata-rata, kelembaban, lag fitur tanam/panen/curah hujan, jumlah pupuk, serta transformasi sin/cos bulan untuk representasi siklus musiman.
- API `/predict-all-kecamatan` secara otomatis memetakan riwayat data per kecamatan, mengurutkannya, melakukan normalisasi menggunakan `scaler_X.pkl`, menjalankan model `model_lstm_panen_jember_tuned.h5`, melakukan denormalisasi hasil prediksi menggunakan `scaler_Y.pkl`, serta mengembalikan data prediksi lengkap beserta prediksi untuk 1 bulan ke depan.

B. Sinkronisasi Cuaca Otomatis (BMKG Scheduler)
- Saat aplikasi FastAPI berjalan, lifecycle event (`lifespan`) akan memanggil fungsi `start_scheduler()`.
- Scheduler berjalan di latar belakang (BackgroundScheduler) setiap 3 jam sekali.
- Proses scheduler:
  1. Membaca `DESA_MAPPING` untuk mengetahui daftar desa dalam setiap Kecamatan di Jember.
  2. Melakukan request data cuaca aktual ke API Resmi BMKG (https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4={kode_desa}).
  3. Menghitung rata-rata suhu, kelembaban, dan kecepatan angin untuk seluruh desa di kecamatan tersebut.
  4. Menyimpan data tersebut ke Firestore collection `cuaca_jember/{kecamatan_kode}`.
  5. Memperbarui field fitur `suhu_rata2_c` dan `kelembaban_persen` pada dokumen bulan berjalan di collection `kecamatan_features` sehingga model prediksi selalu mendapatkan data cuaca terupdate.

C. Autentikasi & Verifikasi reCAPTCHA
- Endpoint `/login` memvalidasi username (admin@padi.com) dan password (hello@Password123).
- Request login harus menyertakan token reCAPTCHA dari sisi frontend yang diverifikasi langsung ke API Google reCAPTCHA menggunakan `SECRET_KEY_RECAPTCHA`.
- Setelah login berhasil, backend mengembalikan HTTP-Only Cookie bernama `session_padi` dengan nilai `authenticated_user` yang berlaku selama 24 jam (max_age=86400).
- Cookie ini digunakan sebagai otorisasi pada endpoint sensitif (seperti `/status`).

------------------------------------------------------------------------
5. DOKUMENTASI API ENDPOINTS
------------------------------------------------------------------------
Setelah aplikasi berjalan, dokumentasi interaktif (Swagger UI) dapat langsung diakses di:
👉 http://127.0.0.1:8000/docs
👉 http://127.0.0.1:8000/redoc

Rincian Endpoint:

1. Health Check
   - GET / : Mengetahui apakah backend aktif.

2. Autentikasi & Sesi
   - POST /login : Melakukan login admin (memerlukan token reCAPTCHA).
   - POST /logout : Menghapus session cookie `session_padi`.
   - GET /status : Mengecek apakah user memiliki session valid (memerlukan Cookie: session_padi).

3. Pengelolaan Fitur Kecamatan (Firestore CRUD)
   - GET /get-features-by-kecamatan : Mengambil seluruh data fitur, dikelompokkan berdasarkan Kode Kecamatan -> Tahun -> Bulan.
   - POST /save-features : Menambahkan dokumen fitur baru untuk kecamatan tertentu.
   - PATCH /update-features/{doc_id} : Mengubah data fitur tertentu berdasarkan ID dokumen.
   - DELETE /delete-features/{doc_id} : Menghapus dokumen fitur berdasarkan ID dokumen.

4. Prediksi Panen
   - GET /predict-all-kecamatan : Menjalankan kalkulasi prediksi panen padi untuk seluruh kecamatan di Kabupaten Jember menggunakan model LSTM.

------------------------------------------------------------------------
6. PEMELIHARAAN (MAINTENANCE) & TROUBLESHOOTING
------------------------------------------------------------------------
- Kredensial Firebase:
  Pastikan Firebase Project Anda memiliki aturan Firestore yang sesuai atau backend dikonfigurasi dengan API Key yang valid agar REST API dapat menyimpan/membaca data.
- Tensor Dimension Error:
  Jika terdapat error terkait bentuk input tensor pada model LSTM, periksa kembali array `feature_order` di `app/services/predict_service.py` baris 27. Pastikan jumlah dan urutan fitur yang dilewatkan ke model tepat 16 fitur.
- Scheduler Tidak Berjalan:
  Pastikan service dijalankan menggunakan server ASGI seperti Uvicorn (`uvicorn app.main:app`) sehingga lifespan startup handler dieksekusi dengan benar untuk memulai Scheduler.
