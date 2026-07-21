import { useState } from 'react';
import Navbar from './components/Navbar/Navbar';
import TentangKami from './pages/TentangKami';
import HomePage from './pages/HomePage';
import FeaturesPage from './pages/Fitur';
import PetaPrediksiPanen from './pages/Peta';
import AdminKecamatanDashboard from './pages/AdminKecamatanDashboard';

export default function App() {
  const [activePage, setActivePage] = useState('Beranda');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogout = () => {
    setIsLoggedIn(false);
    setActivePage('Beranda');
  };

  return (
    <div>
      <Navbar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
        onLoginSuccess={() => {
          setIsLoggedIn(true);
          setActivePage('Dashboard');
        }}
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