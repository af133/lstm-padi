import React from 'react';
import Footer from '../components/Footer/Footer';
import { 
  FiCpu, 
  FiMap, 
  FiShield, 
  FiCheckCircle, 
  FiMail, 
  FiArrowLeft, 
  FiBookOpen, 
  FiAward, 
  FiLayers, 
  FiCalendar, 
  FiUser,
  FiExternalLink
} from 'react-icons/fi';

export default function TentangKami() {
  // Data Tim Dosen Utama
  const mainResearchers = [
    {
      name: "Khoirunnisa' Afandi, S.Kom., M.Kom",
      role: "Ketua Peneliti",
      expertise: "Data Mining",
      institution: "Dosen Fasilkom, Universitas Jember",
      task: "Mengkoordinasikan seluruh tahapan penelitian, mengembangkan algoritma deep learning, serta memimpin penyusunan draft publikasi jurnal dan pendaftaran HKI.",
      initials: "KA"
    },
    {
      name: "Fajrin Nurman Arifin, S.T., M.Eng",
      role: "Anggota Peneliti 1",
      expertise: "Manajemen Sistem Informasi",
      institution: "Dosen Fasilkom, Universitas Jember",
      task: "Bertanggung jawab penuh pada rekayasa data dan pengembangan front-end Web-GIS Dashboard.",
      initials: "FA"
    },
    {
      name: "M. Habibullah Arief, S.Kom., M.Kom",
      role: "Anggota Peneliti 2",
      expertise: "Analisis dan Pemodelan Spasial",
      institution: "Dosen Fasilkom, Universitas Jember",
      task: "Bertanggung jawab penuh pada pengembangan back-end Web-GIS Dashboard.",
      initials: "HA"
    },
    {
      name: "Asmak Afriliana, S.TP., M.P., Ph.D",
      role: "Anggota Peneliti 3",
      expertise: "Agriculture Engineering",
      institution: "Dosen Fakultas Teknologi Pertanian, Universitas Jember",
      task: "Memvalidasi parameter agroklimatologi dan business logic untuk rekomendasi distribusi pupuk urea bersubsidi berbasis hasil prediksi.",
      initials: "AA"
    }
  ];

  // Data Asisten Mahasiswa
  const studentAssistants = [
    {
      name: "Andre Firmansyah",
      nim: "232410101037",
      role: "Membantu pengembangan algoritma",
      initials: "AF"
    },
    {
      name: "Muhammad Raihan Rabbani",
      nim: "232410101059",
      role: "Membantu merancang website serta submit artikel ilmiah",
      initials: "MR"
    }
  ];

  // Data Timeline & Target
  const timelineStages = [
    { title: "Persiapan Penelitian", desc: "Lokasi, studi literatur, protokol penelitian" },
    { title: "Pengumpulan Data", desc: "Data iklim, produksi, dan lahan (31 kecamatan)" },
    { title: "Pra-processing Data", desc: "Pembersihan, normalisasi, integrasi dataset" },
    { title: "Pembangunan Model", desc: "Model LSTM terlatih, target akurasi awal R2 ≥ 0,75" },
    { title: "Rancang Bangun Website", desc: "Prototype Web-GIS Dashboard" },
    { title: "Validasi Model", desc: "Target MAE ≤ 0,5 ton/ha, RMSE ≤ 0,7 ton/ha, R2 ≥ 0,85" },
    { title: "Publikasi Hasil Penelitian", desc: "Artikel di jurnal JUTIF (Sinta 2)" },
    { title: "Penyusunan Laporan", desc: "Laporan kemajuan dan laporan hasil" }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-emerald-500 selection:text-white">
      <section className="relative bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-900 text-white py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#34d399_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            April – November 2026
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Tentang Kami
          </h1>
          <p className="text-lg md:text-xl text-emerald-100 font-medium mb-6 max-w-3xl mx-auto leading-relaxed">
            Kelompok Riset Manajemen Data dan Informasi (MANDI) — Fakultas Ilmu Komputer, Universitas Jember
          </p>
          <p className="text-slate-300 text-base md:text-lg max-w-3xl mx-auto leading-relaxed">
            Kami adalah tim peneliti multidisiplin yang mengembangkan <span className="text-amber-300 font-semibold">Web-GIS Dashboard Berbasis Deep Learning</span> untuk Peringatan Dini Ketahanan Pangan dan Tata Kelola Prediksi Panen Padi di Kabupaten Jember. Penelitian ini berlangsung April–November 2026 di Fasilkom Universitas Jember.
          </p>
        </div>
      </section>

      {/* 2. TENTANG PENELITIAN */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-8 md:p-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
            <span className="w-3 h-8 bg-emerald-600 rounded-full inline-block"></span>
            Apa yang Kami Kerjakan?
          </h2>
          <p className="text-slate-600 text-base md:text-lg leading-relaxed mb-6">
            Penelitian ini menggabungkan tiga aspek: pemodelan time-series multivariat LSTM berbasis data iklim, dashboard Web-GIS interaktif untuk visualisasi peta kerentanan pangan, dan sistem rekomendasi distribusi pupuk bersubsidi berbasis hasil prediksi. Objek penelitian mencakup data agroklimatologi (suhu, curah hujan, kelembapan, kecepatan angin), data fenologi dan produksi padi historis, serta data geospasial vektor batas administrasi 31 kecamatan di Kabupaten Jember.
          </p>
          
          {/* 3 Badge / Tag Kecil */}
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-semibold border border-emerald-200/60 shadow-xs">
              <FiCpu className="text-emerald-600" /> Deep Learning (LSTM)
            </span>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 text-sm font-semibold border border-blue-200/60 shadow-xs">
              <FiMap className="text-blue-600" /> Web-GIS Dashboard
            </span>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 text-amber-700 text-sm font-semibold border border-amber-200/60 shadow-xs">
              <FiShield className="text-amber-600" /> Ketahanan Pangan
            </span>
          </div>
        </div>
      </section>

      {/* 3. TIM PENELITI UTAMA */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Tim Peneliti</h2>
          <p className="text-slate-600">Dosen peneliti utama yang mengarahkan dan mengawal jalannya riset.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {mainResearchers.map((item, index) => (
            <div key={index} className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200/80 hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-4 mb-5">
                  {/* Avatar Placeholder */}
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-xl shadow-inner shrink-0">
                    {item.initials}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 leading-snug">{item.name}</h3>
                    <span className="inline-block px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-xs font-semibold mt-1">
                      {item.role}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-slate-600 mb-6 border-t border-slate-100 pt-4">
                  <p><strong className="text-slate-700">Bidang Keahlian:</strong> {item.expertise}</p>
                  <p><strong className="text-slate-700">Institusi:</strong> {item.institution}</p>
                </div>
              </div>

              <blockquote className="bg-slate-50 border-l-4 border-emerald-500 p-3.5 rounded-r-xl text-xs md:text-sm text-slate-600 italic">
                "{item.task}"
              </blockquote>
            </div>
          ))}
        </div>
      </section>

      {/* 4. ASISTEN PENELITI (MAHASISWA) */}
      <section className="py-12 px-6 max-w-5xl mx-auto">
        <div className="bg-emerald-900/5 border border-emerald-900/10 rounded-2xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Asisten Peneliti</h2>
            <p className="text-slate-600 text-sm md:text-base">
              Penelitian ini turut melibatkan mahasiswa Fasilkom Universitas Jember sebagai asisten peneliti.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {studentAssistants.map((student, index) => (
              <div key={index} className="bg-white rounded-xl p-5 shadow-xs border border-slate-200/70 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0">
                  {student.initials}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">{student.name}</h4>
                  <p className="text-xs text-slate-500 font-mono mb-1">NIM: {student.nim}</p>
                  <p className="text-xs text-slate-600">{student.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. TIMELINE & TARGET PENELITIAN */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Timeline & Target Capaian</h2>
          <p className="text-slate-600">Tahapan metodologis dan progres pelaksanaan riset.</p>
        </div>

        {/* Stepper container */}
        <div className="bg-white rounded-2xl p-6 md:p-10 shadow-sm border border-slate-200/80">
          <div className="relative border-l-2 border-emerald-500/30 ml-4 md:ml-6 space-y-8 py-2">
            {timelineStages.map((stage, index) => (
              <div key={index} className="relative pl-8 md:pl-10 group">
                {/* Dot */}
                <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 group-hover:bg-white transition-colors"></div>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md w-fit">
                    Tahap {index + 1}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">{stage.title}</h3>
                <p className="text-sm text-slate-600">{stage.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-sm text-slate-500 bg-slate-50/50 py-3 rounded-xl">
            <FiCalendar className="text-emerald-600" />
            <span>Masa pelaksanaan: <strong className="text-slate-700">April – November 2026</strong></span>
          </div>
        </div>
      </section>

      {/* 6. KOLABORASI & AFILIASI */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Afiliasi & Dukungan</h2>
          <p className="text-slate-600">Sinergi institusional dalam mewujudkan ketahanan pangan berbasis teknologi.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-xs border border-slate-200/80 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4 text-xl">
              <FiLayers />
            </div>
            <h3 className="font-bold text-slate-900 mb-1 text-sm md:text-base">Kelompok Riset MANDI</h3>
            <p className="text-xs text-slate-500">Manajemen Data dan Informasi</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-xs border border-slate-200/80 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4 text-xl">
              <FiBookOpen />
            </div>
            <h3 className="font-bold text-slate-900 mb-1 text-sm md:text-base">Fakultas Ilmu Komputer</h3>
            <p className="text-xs text-slate-500">Universitas Jember</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-xs border border-slate-200/80 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4 text-xl">
              <FiShield />
            </div>
            <h3 className="font-bold text-slate-900 mb-1 text-sm md:text-base">Fakultas Teknologi Pertanian</h3>
            <p className="text-xs text-slate-500">Universitas Jember</p>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200/60 rounded-2xl p-6 text-center text-sm md:text-base text-emerald-900 leading-relaxed">
          Penelitian ini selaras dengan Rencana Induk Penelitian Universitas Jember pada Riset Unggulan Agroindustri, Tema Ketahanan Pangan dan Pertanian Industrial (Smart Farming).
        </div>
      </section>

      {/* 7. TARGET PUBLIKASI & LUARAN */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Target Luaran</h2>
          <p className="text-slate-600">Output nyata yang dihasilkan dari rangkaian penelitian ini.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-xs border border-slate-200/80 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4 font-bold">
                01
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Publikasi Jurnal</h3>
              <p className="text-sm text-slate-600">JUTIF (Jurnal Teknik Informatika), terakreditasi Sinta 2.</p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <FiAward /> Sinta 2 Indexed Target
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-xs border border-slate-200/80 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-4 font-bold">
                02
              </div>
              <h3 className="font-bold text-slate-900 mb-2">HKI</h3>
              <p className="text-sm text-slate-600">Hak Cipta Program Komputer untuk Web-GIS Dashboard SiPanen.</p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 text-xs font-semibold text-blue-600 flex items-center gap-1">
              <FiShield /> Hak Kekayaan Intelektual
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-xs border border-slate-200/80 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-4 font-bold">
                03
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Prototype TKT 3</h3>
              <p className="text-sm text-slate-600">Purwarupa perangkat lunak tervalidasi di lingkungan simulasi.</p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 text-xs font-semibold text-amber-600 flex items-center gap-1">
              <FiCpu /> Tingkat Kesiapan Teknologi
            </div>
          </div>
        </div>
      </section>

      {/* 8. CTA PENUTUP */}
      <section className="py-20 px-6 bg-gradient-to-r from-emerald-900 to-slate-900 text-white mt-12 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-extrabold mb-4">Ingin Berkolaborasi atau Bertanya Lebih Lanjut?</h2>
          <p className="text-emerald-100 mb-8 text-sm md:text-base">
            Terhubunglah dengan tim riset kami untuk diskusi lebih lanjut seputar ketahanan pangan dan implementasi teknologi prediksi panen.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-colors flex items-center gap-2 shadow-lg shadow-emerald-900/40">
              <FiMail /> Hubungi Tim Kami
            </button>
            <button className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold transition-colors flex items-center gap-2">
              <FiArrowLeft /> Kembali ke Beranda
            </button>
          </div>
        </div>
      </section>
        <Footer/>
    </div>
  );
}