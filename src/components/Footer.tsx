import { Sprout, Mail, MapPin, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-50 border-t border-slate-800">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-16 sm:py-20">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                <Sprout className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-bold text-lg">SiPanen</div>
                <div className="text-xs text-slate-400">Jember</div>
              </div>
            </div>
            <p className="text-sm text-slate-300">
              Sistem prediksi panen padi berbasis AI untuk ketahanan pangan Kabupaten Jember.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4 text-slate-50">Navigasi</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-slate-300 hover:text-white transition text-sm">Beranda</a></li>
              <li><a href="#" className="text-slate-300 hover:text-white transition text-sm">Peta Prediksi</a></li>
              <li><a href="#" className="text-slate-300 hover:text-white transition text-sm">Tentang Kami</a></li>
              <li><a href="#" className="text-slate-300 hover:text-white transition text-sm">Dokumentasi</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-4 text-slate-50">Sumber Daya</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-slate-300 hover:text-white transition text-sm">API Docs</a></li>
              <li><a href="#" className="text-slate-300 hover:text-white transition text-sm">Tutorial</a></li>
              <li><a href="#" className="text-slate-300 hover:text-white transition text-sm">FAQ</a></li>
              <li><a href="#" className="text-slate-300 hover:text-white transition text-sm">Blog</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4 text-slate-50">Kontak</h3>
            <ul className="space-y-3">
              <li className="flex gap-2 items-start text-sm text-slate-300">
                <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                <span>Universitas Jember, Jawa Timur</span>
              </li>
              <li className="flex gap-2 items-center text-sm text-slate-300">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span>sipanen@unej.ac.id</span>
              </li>
              <li className="flex gap-2 items-center text-sm text-slate-300">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>(0331) 123-456</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
          <p className="text-slate-400">&copy; 2024 SiPanen Jember. Semua hak dilindungi.</p>
          <div className="flex gap-6">
            <a href="#" className="text-slate-300 hover:text-white transition">Privacy</a>
            <a href="#" className="text-slate-300 hover:text-white transition">Terms</a>
            <a href="#" className="text-slate-300 hover:text-white transition">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
