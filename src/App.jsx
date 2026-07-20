import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import KecamatanMap from './components/KecamatanMap';
const SiPanenLanding = () => {
  const [data, setData] = useState({ geo: null, pred: {}, feat: {}, weather: null });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resGeo, resPred, resFeat,resWeather] = await Promise.all([
          fetch('src/assets/jember.json').then(r => r.json()),
          fetch('https://lstm-padi.onrender.com/predict-all-kecamatan').then(r => r.json()),
          fetch('https://lstm-padi.onrender.com/get-features-by-kecamatan').then(r => r.json()),
          fetch('https://lstm-padi.onrender.com/get-cuaca-jember').then(r => r.json()),
        ]);
        setData({ geo: resGeo, pred: resPred, feat: resFeat, weather: resWeather });
      } catch (err) { console.error("Error loading data:", err); }
    };
    fetchData();
  }, []);
  return (
    <div className="bg-neutral-50 min-h-screen text-neutral-900 font-sans">
      <Navbar/>
      

      {/* 1. HERO SECTION */}
      <section className="relative pt-20 pb-24 overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-yellow-600">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-12">
          <div className="md:w-1/2 text-white">
            <span className="inline-block bg-white/20 px-4 py-1 rounded-full text-sm font-semibold mb-4 backdrop-blur-sm border border-white/30">
              Sistem Pendukung Keputusan Pertanian Berbasis AI
            </span>
            <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
              Peringatan Dini Ketahanan Pangan untuk Kabupaten Jember
            </h1>
            <p className="text-emerald-50 mb-8 text-lg">
              Prediksi panen padi berbasis Deep Learning (LSTM) yang divisualisasikan secara spasial untuk 31 kecamatan. SiPanen Jember membantu pemerintah daerah mencegah gagal panen dan menekan inefisiensi logistik.
            </p>
            <div className="flex gap-4">
              <button className="bg-yellow-400 text-neutral-900 font-bold px-8 py-3 rounded-xl hover:bg-yellow-300 transition">Lihat Dashboard Prediksi</button>
              <button className="border border-white/50 text-white font-semibold px-8 py-3 rounded-xl hover:bg-white/10 transition">Pelajari Metodologi</button>
            </div>
          </div>
          
          <div className="md:w-1/2 relative">
            <img src="src/assets/Gemini_Generated_Image_n7qd40n7qd40n7qd-removebg-preview.png" alt="Petani" className="relative z-10 w-full max-w-lg mx-auto" />
            
            {/* Floating Card */}
            <div className="absolute bottom-10 -left-10 bg-white/10 backdrop-blur-xl border border-white/20 p-5 rounded-2xl text-white z-20 shadow-2xl">
              <p className="text-xs uppercase tracking-widest mb-1 opacity-80">Diperbarui otomatis dari BMKG</p>
              <div className="flex items-center gap-4">
                <span className="text-4xl">🌤️</span>
                <div>
                  <p className="text-2xl font-bold">28°C</p>
                  <p className="text-sm font-medium">Berawan Sebagian</p>
                </div>
                <div className="border-l border-white/20 pl-4 text-xs space-y-1">
                  <p>Kelembapan: 78%</p>
                  <p>Curah Hujan: 2mm</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. MASALAH & URGENSI */}
      <section className="py-20 max-w-7xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-12">Mengapa Sistem Ini Dibutuhkan?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { t: "Iklim Ekstrem", d: "Fenomena El Niño/La Niña memicu pergeseran siklus tanam dan risiko gagal panen." },
            { t: "Distribusi Pupuk", d: "Jadwal distribusi pupuk sering tidak sinkron dengan kebutuhan riil di lapangan." },
            { t: "Integrasi Spasial", d: "Model lama berupa data tabular, sulit untuk visualisasi wilayah strategis." }
          ].map((item, i) => (
            <div key={i} className="p-8 bg-white rounded-2xl shadow-sm border border-neutral-100 hover:shadow-xl transition-shadow">
              <h3 className="text-xl font-bold mb-4 text-emerald-800">{item.t}</h3>
              <p className="text-neutral-600">{item.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. FITUR UTAMA */}
      <section className="py-20 bg-emerald-50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-16">Solusi Kami</h2>
          <div className="grid md:grid-cols-3 gap-10">
            {['Prediksi LSTM Multivariat', 'Dashboard Web-GIS Interaktif', 'Rekomendasi Pupuk'].map((feat, i) => (
              <div key={i} className="space-y-4">
                <div className="w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto text-2xl mb-6">★</div>
                <h3 className="font-bold text-xl">{feat}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

        {/* 4. PETA INTERAKTIF */}
      <section className="py-20 max-w-7xl mx-auto px-6">
      <h2 className="text-3xl font-bold text-center mb-4">Peta Prediksi Panen 31 Kecamatan</h2>
      <p className="text-center text-neutral-500 mb-12">
        Jelajahi status ketahanan pangan tiap kecamatan di Kabupaten Jember secara real-time.
      </p>
      
      {data.geo ? (
        <KecamatanMap 
          geoJsonData={data.geo} 
          predictionData={data.pred} 
          featureData={data.feat} 
          weatherData={data.weather}
        />
      ) : (
        <div className="h-[500px] w-full bg-neutral-100 animate-pulse rounded-3xl flex items-center justify-center text-neutral-400">
          Memuat Peta dan Data Prediksi...
        </div>
      )}
      
      <p className="text-center text-sm mt-6 text-neutral-400 italic">
        Data diperbarui otomatis dari integrasi API BMKG dan citra satelit Sentinel-2
      </p>
    </section>

      {/* 5. TIM PENELITI */}
      <section className="py-20 bg-neutral-50 text-neutral-900">
  <div className="max-w-7xl mx-auto px-6 text-center">
    <h2 className="text-3xl font-bold mb-12 text-neutral-900">Tim Peneliti</h2>
    <div className="grid md:grid-cols-3 gap-8">
      {['Khoirunnisa\' Afandi', 'M. Habibullah Arief', 'Fajrin Nurman Arifin'].map((nama, i) => (
        <div 
          key={i} 
          className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm hover:shadow-xl transition-shadow duration-300"
        >
          <div className="w-24 h-24 bg-neutral-100 rounded-full mx-auto mb-6 border-4 border-white shadow-inner">
             {/* Kamu bisa ganti div ini dengan <img src={...} /> untuk foto profil */}
          </div>
          <h4 className="font-bold text-lg text-neutral-900">{nama}</h4>
          <p className="text-emerald-600 font-medium text-sm mt-1">Peneliti Universitas Jember</p>
        </div>
      ))}
    </div>
  </div>
      </section>

      {/* 6. FOOTER CTA */}
      <footer className="py-20 bg-emerald-950 text-emerald-100 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-6 text-white">Berbasis Riset Ilmiah</h2>
          <p className="mb-10 leading-relaxed">
            SiPanen Jember dikembangkan sebagai bagian dari penelitian berkelanjutan Universitas Jember. 
            Menggabungkan Deep Learning dan SIG untuk solusi tata kelola pangan yang adaptif.
          </p>
          <div className="flex gap-4 justify-center">
            <button className="bg-white text-emerald-950 font-bold px-8 py-3 rounded-xl hover:bg-emerald-50">Hubungi Kami</button>
            <button className="border border-emerald-700 px-8 py-3 rounded-xl hover:bg-emerald-900">Lihat Publikasi Ilmiah</button>
          </div>
        </div>
      </footer>
      <Footer/>
    </div>
  );
};

export default SiPanenLanding;