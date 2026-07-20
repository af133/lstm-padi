import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import geoData from '../assets/jember.json';

const normalizeName = (name) => {
  if (!name) return '';
  return name.toString().normalize('NFKD').trim().toUpperCase().replace(/[^A-Z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
};

const KecamatanMap = ({ predictionData, featureData, weatherData }) => {
  const [selected, setSelected] = useState(null);

  const namaToKode = useMemo(() => {
    const map = new Map();
    geoData?.features?.forEach((f) => {
      const props = f.properties || {};
      const key = normalizeName(props.NAMOBJ || props.WADMKC);
      if (key) map.set(key, { kode: props.kode || '', kodeBmkg: props.kode_bmkg || props.kode });
    });
    return map;
  }, []);

  const getKode = (props) => namaToKode.get(normalizeName(props?.WADMKC || props?.NAMOBJ))?.kodeBmkg || '';
    // consoloe.log(kode);
    const getWeatherData = (kode) => {
      if (!weatherData) return null;
      
      if (Array.isArray(weatherData)) {
        return weatherData.find(w => 
          String(w.kecamatan_kode || w.id) === String(kode)
        ) || null;
      }
      
      return weatherData[kode] || null;
    };
    const getLatestData = (kode) => {
    const dataPred = predictionData?.[kode];
    const dataFeat = featureData?.[kode];
    
    let predResult = null;
    let tahunTerakhir = '-';
    let bulanTerakhir = '-';
    if (dataPred) {
      const tahunList = Object.keys(dataPred).sort();
      tahunTerakhir = tahunList[tahunList.length - 1];
      const bulanList = Object.keys(dataPred[tahunTerakhir]).sort((a, b) => a - b);
      bulanTerakhir = bulanList[bulanList.length - 1];
      predResult = dataPred[tahunTerakhir][bulanTerakhir];
    }
    let featResult = null;
    if (dataFeat) {
      featResult = dataFeat[tahunTerakhir]?.[bulanTerakhir]?.[0];
      
      // Jika kosong (karena 2025 belum ada di featureData), ambil tahun/bulan terakhir yang ADA di featureData!
      if (!featResult) {
        const tahunFeatList = Object.keys(dataFeat).sort();
        const lastTahunFeat = tahunFeatList[tahunFeatList.length - 1];
        const bulanFeatList = Object.keys(dataFeat[lastTahunFeat]).sort((a, b) => a - b);
        const lastBulanFeat = bulanFeatList[bulanFeatList.length - 1];
        featResult = dataFeat[lastTahunFeat][lastBulanFeat]?.[0] || null;
      }
    }

    return {
      tahun: tahunTerakhir,
      bulan: bulanTerakhir,
      pred: predResult,
      feat: featResult
    };
  };

  const getColor = (kode) => {
    const data = predictionData?.[kode];
    if (!data) return '#94a3b8';
    const t = Object.keys(data).sort().pop();
    const b = Object.keys(data[t]).sort((a, b) => a - b).pop();
    const status = data[t][b]?.status?.toLowerCase();
    
    switch (status) {
      case 'aman': return '#22c55e';
      case 'waspada': return '#f59e0b';
      case 'kritis': case 'rawan': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  const onEachFeature = (feature, layer) => {
    const kode = getKode(feature.properties);
    layer.on({
      click: () => {
        const latest = getLatestData(kode);
        const weather = getWeatherData(kode);
        
        setSelected({
          namaDesa: feature.properties?.NAMOBJ || 'Tanpa Nama',
          weather: weather,
          ...latest
        });
      },
      mouseover: (e) => e.target.setStyle({ weight: 3, fillOpacity: 0.9 }),
      mouseout: (e) => e.target.setStyle({ weight: 1, fillOpacity: 0.7 }),
    });
    layer.bindTooltip(`<b>${feature.properties?.NAMOBJ}</b>`, { sticky: true });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 bg-white p-6 rounded-3xl shadow-lg border border-neutral-100">
      {/* MAP SECTION */}
      <div className="relative flex-1 h-[500px] rounded-2xl overflow-hidden shadow-inner">
        <MapContainer 
          center={[-8.25, 113.65]} 
          zoom={11} 
          className="h-full w-full" 
          maxBounds={[[-8.55, 113.35], [-7.95, 113.95]]} 
          maxBoundsViscosity={1.0} 
          minZoom={10}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" className="grayscale brightness-[0.8] contrast-[1.2]" />
          <GeoJSON
            data={geoData}
            style={(f) => ({ fillColor: getColor(getKode(f.properties)), weight: 1, color: '#ffffff', fillOpacity: 0.7 })}
            onEachFeature={onEachFeature}
          />
        </MapContainer>
      </div>

      {/* INFO PANEL */}
      <div className="lg:w-80 bg-neutral-900 text-white p-6 rounded-2xl">
        <h3 className="text-xl font-bold mb-6 border-b border-neutral-700 pb-2">Detail Wilayah</h3>
        {selected ? (
          <div className="space-y-4">
            <h4 className="text-2xl font-bold text-emerald-400">{selected.namaDesa}</h4>
            <div className="text-xs text-neutral-400 bg-neutral-800 p-2 rounded-lg">
              Data Prediksi: {selected.bulan ? new Date(0, selected.bulan - 1).toLocaleString('id-ID', { month: 'long' }) : '-'} {selected.tahun}
            </div>
            
            <div className="bg-neutral-800 p-4 rounded-xl space-y-3">
              <p className="text-sm">Prediksi: <b>{selected.pred?.prediksi ?? 0} Ton</b></p>
              {selected.pred?.status && (
                <div className="flex items-center gap-2">
                  <p className="text-sm">Status:</p>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${selected.pred.status === 'Aman' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {selected.pred.status}
                  </span>
                </div>
              )}
              {(selected.pred?.status?.toLowerCase() === 'waspada' || selected.pred?.status?.toLowerCase() === 'rawan') && (
                <div className="bg-yellow-500/10 border border-yellow-500/50 p-3 rounded-lg mt-2">
                  <p className="text-xs text-yellow-100 italic">⚠️ Segera lakukan <b>penyaluran pupuk tambahan</b> di wilayah ini.</p>
                </div>
              )}
            </div>

            <div className="space-y-1 text-xs text-neutral-300 pt-2 border-t border-neutral-800">
                <p>Curah Hujan: {selected.feat?.curah_hujan_mm ?? '-'} mm</p>
                <p>Suhu: {selected.weather?.temp_avg ?? '-'} °C</p>
                <p>Kecepatan Angin: {selected.weather?.windspeed_avg ?? '-'} km/jam</p>
                <p>Kelembapan: {selected.weather?.humidity_avg ?? '-'} %</p>
            </div>
          </div>
        ) : (
          <p className="text-neutral-500 text-sm mt-4 text-center">Klik wilayah pada peta untuk melihat data terbaru.</p>
        )}
      </div>
    </div>
  );
};

export default KecamatanMap;