import { useState } from 'react';
import Navbar from './components/Navbar/Navbar';
import TentangKami from './pages/TentangKami';
import HomePage from './pages/HomePage';

export default function App() {
  const [activePage, setActivePage] = useState('Beranda');

  return (
    <div>
      <Navbar activePage={activePage} setActivePage={setActivePage} />
      <main >
        {activePage === 'Beranda' && <HomePage />}
        {activePage === 'Tentang Kami' && <TentangKami />}
      </main>
    </div>
  );
}