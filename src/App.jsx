import { useState, useEffect } from 'react';
import Navbar from './components/Navbar/Navbar';
import TentangKami from './pages/TentangKami';
import HomePage from './pages/HomePage';
import FeaturesPage from './pages/Fitur';
import PetaPrediksiPanen from './pages/Peta';
import AdminKecamatanDashboard from './pages/AdminKecamatanDashboard';

export default function App() {
  const [activePage, setActivePage] = useState('Beranda');
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });

  // Handler saat login berhasil
  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    localStorage.setItem('isLoggedIn', 'true');
    setActivePage('Dashboard');
  };

  // Handler saat logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('isLoggedIn');
    setActivePage('Beranda');
  };

  useEffect(() => {
    if (!isLoggedIn && activePage === 'Dashboard') {
      setActivePage('Beranda');
    }
  }, [isLoggedIn, activePage]);

  return (
    <div>
      <Navbar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
        onLoginSuccess={handleLoginSuccess}
      />
      <main className="pt-16">
        {activePage === 'Beranda' && <HomePage />}
        {activePage === 'Tentang Kami' && <TentangKami />}
        {activePage === 'Fitur' && <FeaturesPage />}
        {activePage === 'Peta' && <PetaPrediksiPanen />}
        {activePage === 'Dashboard' && isLoggedIn && <AdminKecamatanDashboard />}
      </main>
    </div>
  );
}