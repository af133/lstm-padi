import { useState, useEffect } from 'react';

const Navbar = ({ activePage, setActivePage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const menuItems = ['Beranda', 'Tentang Kami', 'Peta', 'Fitur'];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed w-full z-2000 transition-all duration-500 backdrop-blur-xl bg-black/60 border-b border-white/10 shadow-lg shadow-black/20
          
      `}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center text-white">
        {/* Logo - Klik untuk ke Beranda */}
        <div 
          onClick={() => setActivePage('Beranda')}
          className="flex items-center gap-2 text-2xl font-bold tracking-tight cursor-pointer"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-blue-400 to-cyan-300 animate-pulse" />
          <span className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
            LSTM
          </span>
        </div>

        {/* Desktop Menu */}
        <ul className="hidden md:flex gap-2 font-medium text-sm">
          {menuItems.map((item) => (
            <li key={item}>
              <button
                onClick={() => setActivePage(item)}
                className={`relative px-4 py-2 rounded-full transition-all duration-300 ${
                  activePage === item 
                    ? 'bg-white/20 text-white font-semibold' 
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                {item}
              </button>
            </li>
          ))}
        </ul>

        {/* Login Button */}
        <button className="hidden md:flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-white text-black font-semibold text-sm hover:bg-blue-50 hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5 transition-all duration-300">
          Login
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
                  ? 'bg-white/20 text-white font-semibold text-lg' 
                  : 'text-white/80 hover:text-white hover:bg-white/5 text-lg'
              }`}
              style={{ transitionDelay: `${i * 50}ms` }}
            >
              {item}
            </button>
          ))}
          <button className="w-full mt-4 px-6 py-3 rounded-full bg-white text-black font-semibold hover:bg-blue-50 transition-all duration-300">
            Login
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;