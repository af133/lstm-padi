import { ArrowRight, Zap, MapPin, BarChart3, Shield, Users, Sprout } from "lucide-react";
import { useState, useEffect } from "react";

interface HomePageProps {
  onNavigate: (page: string) => void;
  onAuthModalOpen: () => void;
}

export function HomePage({ onNavigate, onAuthModalOpen }: HomePageProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const heroImages = [
    '/hero-rice-field.png',
    '/hero-rice-field-2.png',
    '/hero-rice-field-3.png'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Hero Section - Auto-sliding Carousel */}
      <section 
        className="relative w-full h-screen bg-cover bg-center flex items-center justify-center overflow-hidden"
        style={{ backgroundImage: `url('${heroImages[currentSlide]}')` }}
      >
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
        
        {/* Content overlay */}
        <div className="relative z-10 text-center text-white px-4 sm:px-6 lg:px-12 max-w-4xl mx-auto w-full">
          <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight drop-shadow-lg">
            Prediksi Panen Padi dengan LSTM
          </h1>

          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 mb-6 sm:mb-8 leading-relaxed drop-shadow-md px-2">
            Dashboard Web-GIS interaktif untuk memprediksi hasil panen padi di Kabupaten Jember 
            menggunakan teknologi LSTM Deep Learning dan data cuaca real-time.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-2">
            <button
              onClick={() => onNavigate("peta")}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              Jelajahi Peta <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5" />
            </button>
            <button
              onClick={onAuthModalOpen}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl bg-white text-emerald-700 font-semibold text-sm sm:text-base hover:bg-white/90 transition-all shadow-lg"
            >
              Login Admin
            </button>
          </div>
        </div>

        {/* Carousel indicators */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
          {heroImages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all ${
                idx === currentSlide ? 'bg-white w-6 sm:w-8' : 'bg-white/50'
              }`}
            />
          ))}
        </div>

        <style>{`
          @keyframes slideChange {
            0% { opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { opacity: 0; }
          }
        `}</style>
      </section>

      {/* Content section - only background styling */}
      <div className="bg-gradient-to-b from-white to-blue-50">

      {/* Features Section */}
      <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 py-12 sm:py-16 md:py-24">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 text-center mb-2 sm:mb-4">
          Fitur Unggulan
        </h2>
        <p className="text-sm sm:text-base text-slate-600 text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          Teknologi terdepan untuk mendukung ketahanan pangan Kabupaten Jember
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Feature 1 */}
          <div className="p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl bg-white border border-slate-100 hover:border-emerald-200 hover:shadow-lg transition-all group">
            <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
              <Zap className="w-6 sm:w-7 h-6 sm:h-7" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 sm:mb-3">LSTM Deep Learning</h3>
            <p className="text-sm sm:text-base text-slate-600">
              Algoritma pembelajaran mendalam untuk memprediksi pola fenologi padi dengan akurasi tinggi
              berdasarkan data time-series cuaca dan agroklimatologi.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl bg-white border border-slate-100 hover:border-blue-200 hover:shadow-lg transition-all group">
            <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
              <MapPin className="w-6 sm:w-7 h-6 sm:h-7" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 sm:mb-3">Dashboard Web-GIS</h3>
            <p className="text-sm sm:text-base text-slate-600">
              Visualisasi peta interaktif yang menampilkan zonasi prediksi panen per kecamatan secara
              real-time dengan layer geografis yang detail.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl bg-white border border-slate-100 hover:border-amber-200 hover:shadow-lg transition-all group">
            <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-6 sm:w-7 h-6 sm:h-7" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 sm:mb-3">Data Real-Time</h3>
            <p className="text-sm sm:text-base text-slate-600">
              Integrasi data cuaca BMKG real-time untuk analisis prediksi yang akurat dan rekomendasi
              distribusi pupuk bersubsidi tepat sasaran.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-12 sm:py-16 md:py-24">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-2 sm:mb-4">
            Bagaimana Cara Kerjanya?
          </h2>
          <p className="text-sm sm:text-base text-emerald-100 text-center max-w-2xl mx-auto mb-8 sm:mb-12">
            Sistem prediksi kami menggunakan teknologi AI terkini untuk memberikan hasil terbaik
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
            {[
              {
                step: "01",
                title: "Data Dikumpulkan",
                desc: "Data cuaca, iklim, dan historis panen dari berbagai sumber",
              },
              {
                step: "02",
                title: "Diproses AI",
                desc: "LSTM model menganalisis pola dan tren data time-series",
              },
              {
                step: "03",
                title: "Diprediksi",
                desc: "Sistem memprediksi hasil panen per kecamatan dengan akurat",
              },
              {
                step: "04",
                title: "Divisualisasi",
                desc: "Hasil ditampilkan dalam peta interaktif yang mudah dipahami",
              },
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl lg:rounded-2xl p-4 sm:p-5 lg:p-6 border border-white/30">
                  <div className="text-3xl sm:text-4xl font-bold text-emerald-200 mb-2 sm:mb-3">{item.step}</div>
                  <h3 className="text-base sm:text-lg font-bold mb-1 sm:mb-2">{item.title}</h3>
                  <p className="text-emerald-100 text-xs sm:text-sm">{item.desc}</p>
                </div>
                {idx < 3 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 transform -translate-y-1/2">
                    <ArrowRight className="w-5 sm:w-6 h-5 sm:h-6 text-emerald-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Research Project Info */}
      <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 py-12 sm:py-16 md:py-24">
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-8 lg:p-12 border border-slate-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-4 sm:mb-6">
                Riset Terdepan untuk Ketahanan Pangan
              </h2>
              <p className="text-sm sm:text-base text-slate-700 mb-4 sm:mb-6 leading-relaxed">
                Penelitian ini merupakan inisiatif Universitas Jember untuk mengembangkan sistem
                prediksi panen padi yang adaptif terhadap perubahan iklim ekstrem (El Niño/La Niña).
              </p>
              <ul className="space-y-3 sm:space-y-4">
                {[
                  "Pemodelan LSTM multivariat untuk time-series jangka panjang",
                  "Dashboard Web-GIS interaktif dengan visualisasi real-time",
                  "Rekomendasi distribusi pupuk berbasis prediksi hasil panen",
                ].map((item, idx) => (
                  <li key={idx} className="flex gap-2 sm:gap-3 items-start">
                    <Shield className="w-4 sm:w-5 h-4 sm:h-5 text-emerald-600 flex-shrink-0 mt-0.5 sm:mt-1" />
                    <span className="text-xs sm:text-sm text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <img
              src="/prediction-chart.png"
              alt="Visualisasi prediksi data"
              className="rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg w-full h-auto"
            />
          </div>
        </div>
      </section>

      {/* Map Preview */}
      <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 py-12 sm:py-16 md:py-24">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 text-center mb-8 sm:mb-12">
          Peta Interaktif Jember
        </h2>
        <div className="rounded-lg sm:rounded-xl lg:rounded-3xl overflow-hidden shadow-lg sm:shadow-xl lg:shadow-2xl">
          <img
            src="/gis-map.png"
            alt="Peta GIS Kabupaten Jember"
            className="w-full h-auto object-cover"
          />
          <div className="bg-gradient-to-t from-slate-900/80 to-transparent p-4 sm:p-6 lg:p-8 text-white text-center">
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 sm:mb-3">Jelajahi Prediksi Per Kecamatan</h3>
            <p className="text-xs sm:text-sm lg:text-base text-slate-200 mb-4 sm:mb-6">
              Lihat detail prediksi panen, status kesehatan tanaman, dan analisis cuaca untuk setiap wilayah
            </p>
            <button
              onClick={() => onNavigate("peta")}
              className="w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm sm:text-base transition-all inline-flex items-center justify-center gap-2"
            >
              Buka Peta Lengkap <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="w-full bg-slate-900 text-white py-12 sm:py-16 md:py-24">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-2 sm:mb-4">
            Tim Peneliti
          </h2>
          <p className="text-xs sm:text-sm lg:text-base text-slate-300 text-center max-w-2xl mx-auto mb-8 sm:mb-12">
            Kolaborasi dari para ahli di bidang agroklimatologi, machine learning, dan GIS
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
            {[
              { name: "Dr. Ir. Bambang Setiawan, M.P.", role: "Ketua Peneliti — Agroklimatologi" },
              { name: "Dr. Ratna Puspitasari, S.Kom., M.T.", role: "Anggota Peneliti — Machine Learning & GIS" },
              { name: "Ir. Agus Dwi Prasetyo, M.Si.", role: "Anggota Peneliti — Ahli Pertanian" },
              { name: "Dian Kusuma Wardani, S.T., M.Kom.", role: "Anggota Peneliti — Web-GIS Developer" },
              { name: "Fajar Nur Rahman", role: "Asisten Peneliti — Mahasiswa" },
              { name: "Sinta Ayu Lestari", role: "Asisten Peneliti — Mahasiswa" },
            ].map((member, idx) => (
              <div key={idx} className="bg-slate-800 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-slate-700 hover:border-emerald-500 transition-all">
                <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white font-bold mb-3 sm:mb-4 text-xs sm:text-sm">
                  {member.name.split(" ")[0][0]}{member.name.split(" ")[1][0]}
                </div>
                <h3 className="font-bold text-white mb-1 text-xs sm:text-sm lg:text-base">{member.name}</h3>
                <p className="text-slate-400 text-xs sm:text-sm">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 text-white py-12 sm:py-16 md:py-24">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-12 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">
            Siap Mengeksplorasi Prediksi Panen?
          </h2>
          <p className="text-xs sm:text-sm lg:text-lg text-emerald-100 mb-6 sm:mb-8 max-w-2xl mx-auto">
            Gunakan dashboard kami untuk mendapatkan insights mendalam tentang prediksi panen padi
            di setiap kecamatan Jember dengan akurasi tinggi.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <button
              onClick={() => onNavigate("peta")}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl bg-white text-emerald-700 font-semibold text-sm sm:text-base hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
            >
              Jelajahi Peta <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5" />
            </button>
            <button
              onClick={onAuthModalOpen}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm sm:text-base transition-all border border-emerald-500"
            >
              Login sebagai Admin
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-bold mb-4">SiPanen Jember</h4>
              <p className="text-sm">Sistem prediksi panen padi berbasis AI untuk ketahanan pangan Kabupaten Jember.</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Navigasi</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" onClick={() => onNavigate("home")} className="hover:text-white transition">Home</a></li>
                <li><a href="#" onClick={() => onNavigate("peta")} className="hover:text-white transition">Peta</a></li>
                <li><a href="#" onClick={onAuthModalOpen} className="hover:text-white transition">Login</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Teknologi</h4>
              <ul className="space-y-2 text-sm">
                <li>LSTM Deep Learning</li>
                <li>Web-GIS & Leaflet</li>
                <li>Data BMKG Real-time</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Institusi</h4>
              <p className="text-sm">Universitas Jember<br />Kabupaten Jember, Jawa Timur</p>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-6 flex justify-between items-center text-sm">
            <p>&copy; 2024 SiPanen Jember. Semua hak dilindungi.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white transition">Privacy</a>
              <a href="#" className="hover:text-white transition">Terms</a>
              <a href="#" className="hover:text-white transition">Contact</a>
            </div>
          </div>
        </div>
      </footer>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
