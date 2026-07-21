import { useState, useEffect } from 'react';
import logo from '../../assets/logo.png'

const Navbar = ({ activePage, setActivePage, isLoggedIn, onLogout, onLoginSuccess }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const baseMenuItems = ['Beranda', 'Tentang Kami', 'Peta', 'Fitur'];
  const menuItems = isLoggedIn ? [...baseMenuItems, 'Dashboard'] : baseMenuItems;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (username === 'admin@padi.com' && password === 'hello@Padi.com') {
      setIsLoggedInState();
    } else {
      setErrorMessage('Username atau password salah!');
    }
  };

  const setIsLoggedInState = () => {
    setErrorMessage('');
    setUsername('');
    setPassword('');
    setIsModalOpen(false);
    onLoginSuccess();
  };
  const loginButtonClass = "hidden md:flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 text-white font-semibold text-sm hover:shadow-lg hover:shadow-emerald-500/20 hover:-translate-y-0.5 transition-all duration-300";
  const mobileLoginButtonClass = "w-full mt-4 px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 text-white font-semibold hover:opacity-90 transition-all duration-300";

  return (
    <>
      <nav
        className={`fixed w-full z-2000 transition-all duration-500 backdrop-blur-xl bg-black/60 border-b border-white/10 shadow-lg shadow-black/20`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center text-white">
        <div 
          onClick={() => setActivePage('Beranda')}
          className="flex items-center gap-3 text-2xl font-bold tracking-tight cursor-pointer"
        >
          <img src={logo} alt="Logo SiPadi Jember" className="w-10 h-10 object-contain" />
          <span className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
            SiPadi Jember
          </span>
        </div>
          <ul className="hidden md:flex gap-2 font-medium text-sm">
            {menuItems.map((item) => (
              <button
                key={item}
                onClick={() => setActivePage(item)}
                className={`relative px-4 py-2 rounded-full transition-all duration-300 ${
                  activePage === item 
                    ? 'bg-white/20 text-white font-semibold' 
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                {item}
              </button>
            ))}
          </ul>
          <button 
            onClick={() => {
              if (isLoggedIn) onLogout();
              else setIsModalOpen(true);
            }}
            className={loginButtonClass}
          >
            {isLoggedIn ? 'Logout' : 'Login'}
          </button>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-full hover:bg-white/10 transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            <svg
              className={`w-6 h-6 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={isOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16m-7 6h7'}
              />
            </svg>
          </button>
        </div>

        {/* Mobile Menu Panel */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-500 ease-in-out ${
            isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="bg-black/90 backdrop-blur-xl px-6 py-6 flex flex-col gap-1 border-b border-white/10">
            {menuItems.map((item, i) => (
              <button
                key={item}
                onClick={() => {
                  setActivePage(item);
                  setIsOpen(false);
                }}
                className={`text-left w-full relative px-4 py-3 rounded-xl transition-all duration-300 ${
                  activePage === item 
                    ? 'bg-emerald-500/20 text-emerald-300 font-semibold text-lg' 
                    : 'text-white/80 hover:text-white hover:bg-white/5 text-lg'
                }`}
                style={{ transitionDelay: `${i * 50}ms` }}
              >
                {item}
              </button>
            ))}
            <button 
              onClick={() => {
                setIsOpen(false);
                if (isLoggedIn) onLogout();
                else setIsModalOpen(true);
              }}
              className={mobileLoginButtonClass}
            >
              {isLoggedIn ? 'Logout' : 'Login'}
            </button>
          </div>
        </div>
      </nav>

      {/* Modal Pop-up Form Login */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-white/10 text-white p-8 rounded-2xl shadow-2xl w-full max-w-md relative animate-in fade-in zoom-in duration-300">
            {/* Tombol Close (X) */}
            <button 
              onClick={() => {
                setIsModalOpen(false);
                setErrorMessage('');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl font-bold"
            >
              &times;
            </button>

            <h2 className="text-2xl font-bold mb-2">Login Admin</h2>
            <p className="text-sm text-gray-400 mb-6">Masukkan kredensial akun Anda untuk mengakses dashboard.</p>

            {errorMessage && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500 text-red-200 text-sm rounded-lg">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Email / Username</label>
                <input 
                  type="email" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin@gmail.com" 
                  required
                  // Border Fokus Hijau
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  required
                  // Border Fokus Hijau
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <button 
                type="submit"
                // Tombol Masuk Hijau
                className="mt-2 w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold hover:opacity-90 transition-opacity shadow-lg shadow-emerald-900/50"
              >
                Masuk
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;