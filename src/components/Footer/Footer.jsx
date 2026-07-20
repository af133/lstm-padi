import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-neutral-900 text-neutral-400 py-2">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12">
        
        {/* Branding */}
        <div className="col-span-1 md:col-span-2">
          <h2 className="text-white text-2xl font-bold mb-4">SiPanen Jember</h2>
          <p className="max-w-sm mb-6">
            Sistem pendukung keputusan pertanian cerdas untuk Kabupaten Jember. 
            Mengintegrasikan data citra satelit dan AI untuk ketahanan pangan daerah.
          </p>
          <div className="flex gap-4">
            {/* Social Media Placeholders */}
            <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center hover:bg-emerald-600 transition cursor-pointer">IG</div>
            <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center hover:bg-emerald-600 transition cursor-pointer">LI</div>
            <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center hover:bg-emerald-600 transition cursor-pointer">TW</div>
          </div>
        </div>

        {/* Links */}
        <div>
          <h4 className="text-white font-bold mb-4">Navigasi</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-emerald-400 transition">Beranda</a></li>
            <li><a href="#" className="hover:text-emerald-400 transition">Dashboard</a></li>
            <li><a href="#" className="hover:text-emerald-400 transition">Metodologi</a></li>
            <li><a href="#" className="hover:text-emerald-400 transition">Publikasi</a></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-white font-bold mb-4">Hubungi Kami</h4>
          <ul className="space-y-2 text-sm">
            <li>Jl. Kalimantan No. 37</li>
            <li>Jember, Jawa Timur</li>
            <li className="mt-4 text-emerald-400 font-semibold">info@sipanen.id</li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-neutral-800 text-center text-xs">
        <p>&copy; {new Date().getFullYear()} SiPanen Jember. Dikembangkan oleh Tim Peneliti Universitas Jember.</p>
      </div>
    </footer>
  );
};

export default Footer;