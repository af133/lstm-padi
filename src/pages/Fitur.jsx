import React from 'react';
import Footer from '../components/Footer/Footer';
import { 
  Sprout, 
  Map, 
  AlertTriangle, 
  Truck, 
  TrendingUp, 
  Database, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  Activity, 
  CloudRain, 
  Layers, 
  BarChart3, 
  ExternalLink,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* 1. HERO HALAMAN FITUR */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-900 via-emerald-800 to-slate-900 text-white py-24 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs sm:text-sm font-medium mb-6 backdrop-blur-sm">
            <Sprout className="w-4 h-4" />
            <span>Dokumentasi Sistem & Fitur Modul</span>
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Fitur Unggulan SiPanen Jember
          </h1>
          <p className="text-lg sm:text-xl text-emerald-100 font-medium max-w-2xl mx-auto mb-6">
            Teknologi cerdas untuk prediksi panen, visualisasi spasial, dan tata kelola ketahanan pangan yang lebih presisi
          </p>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Setiap fitur dirancang untuk mengubah data mentah menjadi keputusan yang tepat sasaran — dari prediksi hasil panen hingga rekomendasi distribusi pupuk bersubsidi.
          </p>
        </div>
      </section>

      {/* 2. FITUR 1 — PREDIKSI PANEN BERBASIS LSTM */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1 bg-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-bold tracking-wider text-emerald-600 uppercase bg-emerald-50 px-3 py-1 rounded-full">Core AI Engine</span>
              <Activity className="w-6 h-6 text-emerald-600 animate-pulse" />
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">01</div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Input Sequence 12 Bulan</h4>
                  <p className="text-xs text-slate-500">Window size dengan fitur multivariat cuaca dan vegetasi</p>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">02</div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Arsitektur Neural Network</h4>
                  <p className="text-xs text-slate-500">Dua hidden layer @64 neuron, optimizer Adam untuk konvergensi optimal</p>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0">03</div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Validasi Performa Model</h4>
                  <p className="text-xs text-slate-500">Target akurasi model R² ≥ 0,85, RMSE ≤ 0,7 ton/ha</p>
                </div>
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2 space-y-6">
            <div className="inline-flex p-3 rounded-2xl bg-emerald-100 text-emerald-700">
              <Layers className="w-6 h-6" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Prediksi Panen dengan Deep Learning (LSTM)
            </h2>
            <p className="text-slate-600 leading-relaxed text-base sm:text-lg">
              Model Long Short-Term Memory mengolah data time-series multivariat — suhu, curah hujan, kelembapan, kecepatan angin, dan indeks vegetasi (NDVI) — untuk memprediksi volume hasil panen padi per kecamatan. Berbeda dari model konvensional, LSTM mampu menangkap pola anomali cuaca jangka panjang tanpa kehilangan informasi penting.
            </p>
            <ul className="space-y-3 pt-2">
              <li className="flex items-center gap-3 text-slate-700 text-sm font-medium">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                Input sequence 12 bulan (window size) dengan fitur multivariat
              </li>
              <li className="flex items-center gap-3 text-slate-700 text-sm font-medium">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                Dua hidden layer @64 neuron, optimizer Adam
              </li>
              <li className="flex items-center gap-3 text-slate-700 text-sm font-medium">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                Target akurasi model R² ≥ 0,85, RMSE ≤ 0,7 ton/ha
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 3. FITUR 2 — DASHBOARD WEB-GIS INTERAKTIF */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-slate-100/50 rounded-3xl my-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex p-3 rounded-2xl bg-blue-100 text-blue-700">
              <Map className="w-6 h-6" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Peta Interaktif 31 Kecamatan
            </h2>
            <p className="text-slate-600 leading-relaxed text-base sm:text-lg">
              Hasil prediksi divisualisasikan dalam peta vektor interaktif berbasis Leaflet. Setiap kecamatan diberi warna sesuai status ketahanan pangan, sehingga pemangku kebijakan dapat langsung melihat wilayah mana yang perlu perhatian khusus.
            </p>
            <ul className="space-y-3 pt-2">
              <li className="flex items-center gap-3 text-slate-700 text-sm font-medium">
                <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                Klik wilayah untuk detail prediksi dan tren produksi bulanan
              </li>
              <li className="flex items-center gap-3 text-slate-700 text-sm font-medium">
                <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                Update otomatis dari integrasi API cuaca dan citra satelit
              </li>
              <li className="flex items-center gap-3 text-slate-700 text-sm font-medium">
                <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                Tampilan responsif untuk desktop maupun mobile
              </li>
            </ul>
          </div>
          <div className="bg-gradient-to-br from-blue-900 to-slate-900 p-6 sm:p-8 rounded-3xl shadow-xl text-white relative overflow-hidden min-h-[320px] flex flex-col justify-between">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:12px_12px]"></div>
            <div className="relative z-10 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-300 bg-blue-500/20 px-3 py-1 rounded-full border border-blue-400/30">Leaflet Web-GIS</span>
              <span className="text-xs text-slate-300">Kabupaten Jember (31 Kecamatan)</span>
            </div>
            <div className="relative z-10 my-auto py-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600/30 border border-blue-400/40 text-blue-300 mb-4 backdrop-blur-md">
                <Map className="w-8 h-8" />
              </div>
              <p className="text-sm font-medium text-slate-200">Visualisasi Spasial Real-Time Aktif</p>
              <p className="text-xs text-slate-400 mt-1">Interaksi klik wilayah, popup info, & lapis poligon wilayah tersedia</p>
            </div>
            <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800 pt-4">
              <span>Status: Online</span>
              <span>Layer: NDVI & Curah Hujan</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FITUR 3 — KLASIFIKASI STATUS KETAHANAN PANGAN */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex p-3 rounded-2xl bg-amber-100 text-amber-700 mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-4">
            Klasifikasi Tiga Tingkat: Aman, Waspada, Kritis
          </h2>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
            Setiap kecamatan diklasifikasikan otomatis berdasarkan hasil prediksi panen dan tren historisnya, memudahkan identifikasi wilayah berisiko sejak dini.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Kartu Hijau — Aman */}
          <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-emerald-100 flex flex-col justify-between relative overflow-hidden group hover:border-emerald-300 transition-all">
            <div className="absolute top-0 left-0 right-0 h-2 bg-emerald-500"></div>
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-6 font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="inline-block text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider mb-3">Status 1</span>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Aman</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Produksi sesuai atau di atas target, tidak ada indikasi risiko
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-slate-100 text-xs font-medium text-emerald-600 flex items-center gap-1">
              <span>Kondisi Stabil</span>
            </div>
          </div>

          {/* Kartu Kuning — Waspada */}
          <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-amber-100 flex flex-col justify-between relative overflow-hidden group hover:border-amber-300 transition-all">
            <div className="absolute top-0 left-0 right-0 h-2 bg-amber-500"></div>
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-6 font-bold">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <span className="inline-block text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-wider mb-3">Status 2</span>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Waspada</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Terdapat penurunan tren produksi, perlu pemantauan lanjutan
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-slate-100 text-xs font-medium text-amber-600 flex items-center gap-1">
              <span>Perlu Monitoring Ketat</span>
            </div>
          </div>

          {/* Kartu Merah — Kritis */}
          <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-rose-100 flex flex-col justify-between relative overflow-hidden group hover:border-rose-300 transition-all">
            <div className="absolute top-0 left-0 right-0 h-2 bg-rose-500"></div>
            <div>
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mb-6 font-bold">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <span className="inline-block text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-full uppercase tracking-wider mb-3">Status 3</span>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Kritis</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Risiko gagal panen tinggi, memerlukan intervensi segera
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-slate-100 text-xs font-medium text-rose-600 flex items-center gap-1">
              <span>Prioritas Intervensi</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FITUR 4 — REKOMENDASI DISTRIBUSI PUPUK */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-slate-100/50 rounded-3xl my-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1 bg-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-bold tracking-wider text-emerald-600 uppercase bg-emerald-50 px-3 py-1 rounded-full">DSS Logistics</span>
              <Truck className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                  <Sprout className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Fase Fenologi Tanaman</h4>
                  <p className="text-xs text-slate-500">Sinkronisasi alokasi pupuk berdasarkan siklus tanam riil</p>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Validasi Pakar</h4>
                  <p className="text-xs text-slate-500">Diverifikasi bersama pakar agroklimatologi daerah</p>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Dukungan Keputusan Daerah</h4>
                  <p className="text-xs text-slate-500">Mendukung penuh Sistem Pendukung Keputusan (DSS) Pemda</p>
                </div>
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2 space-y-6">
            <div className="inline-flex p-3 rounded-2xl bg-emerald-100 text-emerald-700">
              <Truck className="w-6 h-6" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Rekomendasi Alokasi Pupuk Bersubsidi
            </h2>
            <p className="text-slate-600 leading-relaxed text-base sm:text-lg">
              Berdasarkan hasil prediksi dan zonasi kebutuhan tiap wilayah, sistem menghasilkan rekomendasi jadwal dan alokasi distribusi pupuk urea bersubsidi yang lebih sinkron dengan siklus tanam riil di lapangan — menekan inefisiensi logistik dan mencegah kelangkaan pupuk.
            </p>
            <ul className="space-y-3 pt-2">
              <li className="flex items-center gap-3 text-slate-700 text-sm font-medium">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                Rekomendasi berbasis fase fenologi tanaman padi
              </li>
              <li className="flex items-center gap-3 text-slate-700 text-sm font-medium">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                Divalidasi bersama pakar agroklimatologi
              </li>
              <li className="flex items-center gap-3 text-slate-700 text-sm font-medium">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                Mendukung Sistem Pendukung Keputusan (DSS) pemerintah daerah
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 6. FITUR 5 — GRAFIK TREN & RIWAYAT DATA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex p-3 rounded-2xl bg-blue-100 text-blue-700">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Grafik Tren Produksi Bulanan
            </h2>
            <p className="text-slate-600 leading-relaxed text-base sm:text-lg">
              Setiap kecamatan memiliki grafik riwayat dan proyeksi produksi padi, memungkinkan perbandingan antara data historis dan hasil prediksi model untuk memahami pola musiman dari waktu ke waktu.
            </p>
            <div className="flex items-center gap-6 pt-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-400"></span>
                <span className="text-xs text-slate-600 font-medium">Data Historis BPS</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
                <span className="text-xs text-emerald-700 font-medium">Prediksi LSTM</span>
              </div>
            </div>
          </div>
          
          {/* Mock Line Chart */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Proyeksi vs Riwayat Produksi</h4>
                <p className="text-xs text-slate-500">Kecamatan Ambulu, Jember (Ton/Ha)</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg">Live Mock</span>
            </div>
            
            <div className="h-48 flex items-end justify-between gap-2 pt-6 pb-2 border-b border-slate-100 relative">
              {/* Grid lines background */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-30">
                <div className="border-b border-dashed border-slate-200 w-full"></div>
                <div className="border-b border-dashed border-slate-200 w-full"></div>
                <div className="border-b border-dashed border-slate-200 w-full"></div>
              </div>

              {/* Dummy Bars/Points representing line chart flow */}
              {[
                { month: 'Jan', val: 55, pred: 53 },
                { month: 'Feb', val: 62, pred: 60 },
                { month: 'Mar', val: 78, pred: 75 },
                { month: 'Apr', val: 85, pred: 88 },
                { month: 'May', val: 68, pred: 70 },
                { month: 'Jun', val: 50, pred: 52 },
                { month: 'Jul', val: 45, pred: 48 },
                { month: 'Aug', val: 60, pred: 64 },
              ].map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 relative z-10 h-full justify-end group">
                  <div className="w-full flex justify-center items-end gap-1 h-36">
                    <div style={{ height: `${item.val}%` }} className="w-2 bg-slate-300 rounded-t-sm transition-all group-hover:bg-slate-400"></div>
                    <div style={{ height: `${item.pred}%` }} className="w-2 bg-emerald-600 rounded-t-sm transition-all group-hover:bg-emerald-500"></div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">{item.month}</span>
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-between mt-4 text-xs text-slate-500">
              <span>* Data diperbarui per siklus bulanan</span>
              <span className="font-semibold text-emerald-600">Akurasi R² = 0.88</span>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FITUR 6 — INTEGRASI DATA REAL-TIME */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-slate-100/50 rounded-3xl my-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex p-3 rounded-2xl bg-emerald-100 text-emerald-700 mb-4">
            <Database className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-4">
            Sumber Data Terintegrasi
          </h2>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
            Sistem mengintegrasikan berbagai sumber data resmi untuk menjaga akurasi dan relevansi prediksi.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl shadow-md shadow-slate-200/50 border border-slate-100">
            <CloudRain className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <span className="block text-xs font-bold text-slate-900">BMKG / GLDAS</span>
              <span className="block text-xs text-slate-500">Data cuaca (suhu, curah hujan, kelembapan, angin)</span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl shadow-md shadow-slate-200/50 border border-slate-100">
            <Map className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="block text-xs font-bold text-slate-900">Sentinel-2 (Google Earth Engine)</span>
              <span className="block text-xs text-slate-500">Data vegetasi (NDVI)</span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl shadow-md shadow-slate-200/50 border border-slate-100">
            <BarChart3 className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="block text-xs font-bold text-slate-900">BPS</span>
              <span className="block text-xs text-slate-500">Data historis produksi dan luas panen padi</span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl shadow-md shadow-slate-200/50 border border-slate-100">
            <Sprout className="w-5 h-5 text-emerald-700 shrink-0" />
            <div>
              <span className="block text-xs font-bold text-slate-900">Dinas Tanaman Pangan, Hortikultura & Perkebunan</span>
              <span className="block text-xs text-slate-500">Data fenologi dan alokasi pupuk</span>
            </div>
          </div>
        </div>
      </section>

      {/* 8. PERBANDINGAN DENGAN SISTEM SEBELUMNYA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-4">
            Kenapa Berbeda dari Sistem Sebelumnya?
          </h2>
          <p className="text-slate-600 text-base">
            Evaluasi perbandingan arsitektur konvensional dengan inovasi SiPanen Jember.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 bg-slate-900 text-white font-semibold text-sm">
            <div className="p-5 border-b md:border-b-0 md:border-r border-slate-800 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
              <span>Sistem Sebelumnya</span>
            </div>
            <div className="p-5 flex items-center gap-2 bg-emerald-950/50">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>SiPanen Jember</span>
            </div>
          </div>

          <div className="divide-y divide-slate-100 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-5 text-slate-600 flex items-start gap-3 bg-slate-50/50 md:border-r border-slate-100">
                <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>Model Random Forest, tidak menangkap dependensi temporal jangka panjang</span>
              </div>
              <div className="p-5 text-slate-900 font-medium flex items-start gap-3 bg-emerald-50/20">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Model LSTM, menangkap pola musiman jangka panjang</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-5 text-slate-600 flex items-start gap-3 bg-slate-50/50 md:border-r border-slate-100">
                <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>Output tabular, sulit diadopsi pemangku kebijakan</span>
              </div>
              <div className="p-5 text-slate-900 font-medium flex items-start gap-3 bg-emerald-50/20">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Visualisasi spasial interaktif berbasis peta</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-5 text-slate-600 flex items-start gap-3 bg-slate-50/50 md:border-r border-slate-100">
                <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>Tanpa rekomendasi kebijakan</span>
              </div>
              <div className="p-5 text-slate-900 font-medium flex items-start gap-3 bg-emerald-50/20">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Rekomendasi distribusi pupuk berbasis prediksi</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. CTA PENUTUP */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-900 rounded-3xl p-8 sm:p-12 lg:p-16 text-white text-center relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]"></div>
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Coba Dashboard Prediksi Sekarang
            </h2>
            <p className="text-emerald-100 text-sm sm:text-base leading-relaxed">
              Eksplorasi data spasial ketahanan pangan Kabupaten Jember secara langsung melalui sistem interaktif kami.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <a 
                href="#dashboard" 
                className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2"
              >
                <span>Lihat Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <a 
                href="#metodologi" 
                className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-all border border-white/20 backdrop-blur-md flex items-center gap-2"
              >
                <span>Pelajari Metodologi Penelitian</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>
        <Footer/>
    </div>
  );
}