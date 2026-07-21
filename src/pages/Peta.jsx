import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import { 
  MapPin, 
  CloudRain, 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  ShieldCheck, 
  ShieldAlert, 
  Wind, 
  Thermometer, 
  Droplets,
  Layers,
  Info,
  Package,
  Calendar
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import geoData from '../assets/jember.json';
const MONTH_NAMES = {
  "1": "Jan", "2": "Feb", "3": "Mar", "4": "Apr",
  "5": "Mei", "6": "Jun", "7": "Jul", "8": "Ags",
  "9": "Sep", "10": "Okt", "11": "Nov", "12": "Des"
};

const toNumber = (v) => {
  if (v === undefined || v === null) return 0;
  if (typeof v === 'number') return v;
  const parsed = parseFloat(v);
  return isNaN(parsed) ? 0 : parsed;
};

export default function PetaPrediksiPanen() {
  const [data, setData] = useState({
    geo: null,
    pred: null,
    feat: null,
    weather: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedKecamatanCode, setSelectedKecamatanCode] = useState(null);
  const [activeTimelinePoint, setActiveTimelinePoint] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [resGeo, resPred, resFeat, resWeather] = await Promise.all([
          fetch('https://lstm-padi.onrender.com/predict-all-kecamatan').then(r => {
            if (!r.ok) throw new Error('Gagal memuat data prediksi');
            return r.json();
          }),
          fetch('https://lstm-padi.onrender.com/get-features-by-kecamatan').then(r => {
            if (!r.ok) throw new Error('Gagal memuat data fitur');
            return r.json();
          }),
          fetch('https://lstm-padi.onrender.com/get-cuaca-jember').then(r => {
            if (!r.ok) throw new Error('Gagal memuat data cuaca');
            return r.json();
          }),
        ]);

        setData({
          geo: geoData ,
          pred: resPred,
          feat: resFeat,
          weather: resWeather?.data || resWeather 
        });

        if (resGeo && resGeo.features && resGeo.features.length > 0) {
          const firstCode = resGeo.features[0].properties?.kode || 
                            resGeo.features[0].properties?.kode_kecamatan || 
                            resGeo.features[0].properties?.ID ||
                            Object.keys(resPred || {})[0];
          if (firstCode) {
            setSelectedKecamatanCode(firstCode);
          }
        }
      } catch (err) {
        setError(err.message || "Terjadi kesalahan saat memuat data sistem.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Jika status tidak ada atau tidak valid, otomatis menghasilkan warna abu-abu (#94a3b8)
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'aman': return '#10b981';
      case 'waspada': return '#f59e0b';
      case 'kritis': return '#f43f5e';
      default: return '#94a3b8'; // Abu-abu default jika data tidak ada / tidak dikenali
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'aman': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'waspada': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'kritis': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getLatestPeriodData = (kecamatanCode) => {
    if (!data.pred || !data.pred[kecamatanCode]) return null;
    const yearsData = data.pred[kecamatanCode];
    const years = Object.keys(yearsData).sort((a, b) => Number(b) - Number(a));
    if (years.length === 0) return null;
    
    const latestYear = years[0];
    const monthsData = yearsData[latestYear];
    const months = Object.keys(monthsData).sort((a, b) => Number(b) - Number(a));
    if (months.length === 0) return null;

    const latestMonth = months[0];
    return {
      year: latestYear,
      month: latestMonth,
      monthName: MONTH_NAMES[latestMonth] || latestMonth,
      ...(monthsData[latestMonth])
    };
  };

  const getChartDataForKecamatan = (kecamatanCode) => {
    if (!data.pred || !data.pred[kecamatanCode]) return [];
    const yearsData = data.pred[kecamatanCode];
    const timeline = [];

    const sortedYears = Object.keys(yearsData).sort((a, b) => Number(a) - Number(b));
    
    sortedYears.forEach(year => {
      const monthsData = yearsData[year];
      const sortedMonths = Object.keys(monthsData).sort((a, b) => Number(a) - Number(b));
      
      sortedMonths.forEach(month => {
        const item = monthsData[month];
        const monthLabel = MONTH_NAMES[month] || month;
        timeline.push({
          year,
          month,
          label: `${monthLabel} ${year}`,
          prediksi: item.prediksi ?? 0,
          aktual: item.aktual ?? 0
        });
      });
    });

    return timeline;
  };

  const getKecamatanName = (code) => {
    if (!data.geo || !data.geo.features) return code;
    const feature = data.geo.features.find((f) => {
      const propCode = f.properties?.kode || f.properties?.kode_kecamatan || f.properties?.ID;
      return propCode === code;
    });
    return feature?.properties?.nama || feature?.properties?.WADMKC || feature?.properties?.name || `Kecamatan ${code}`;
  };

  const getFeatureForPeriod = (code, year, month) => {

    if (!data.feat) {
      return null;
    }
    if (!data.feat[code]) {
      return null;
    }

    const yearObj = data.feat[code][year];
    if (!yearObj) {
      return null;
    }

    if (!yearObj[month]) {
      return null;
    }

    const arr = yearObj[month];
    if (Array.isArray(arr) && arr.length > 0) {
      return arr[0];
    }
    return null;
  };

  const onEachFeature = (feature, layer) => {
    const code = feature.properties?.kode || feature.properties?.kode_kecamatan || feature.properties?.ID;
    const name = feature.properties?.nama || feature.properties?.WADMKC || feature.properties?.name || code;
    const latest = getLatestPeriodData(code);
    const weatherInfo = data.weather && data.weather[code];

    // Jika data prediksi/status tidak ada, latest?.status bernilai undefined sehingga getStatusColor mengembalikan abu-abu
    const status = latest?.status;
    const fillColor = getStatusColor(status);

    if (layer instanceof L.Path) {
      layer.setStyle({
        fillColor: fillColor,
        weight: 1.5,
        opacity: 1,
        color: '#ffffff',
        dashArray: '3',
        fillOpacity: 0.7
      });
    }

    layer.on({
      mouseover: (e) => {
        const targetLayer = e.target;
        targetLayer.setStyle({
          weight: 3,
          color: '#0f766e',
          fillOpacity: 0.9
        });
        targetLayer.bringToFront();
      },
      mouseout: (e) => {
        const targetLayer = e.target;
        targetLayer.setStyle({
          weight: 1.5,
          color: '#ffffff',
          fillOpacity: 0.7
        });
      },
      click: () => {
        if (code) {
          setSelectedKecamatanCode(code);
          setActiveTimelinePoint(null);
        }
      }
    });

    const statusDisplay = status || 'Tidak Ada Data';
    const weatherTooltipContent = weatherInfo 
      ? `<div class="p-1 text-xs">
           <p class="font-bold text-slate-800">${name}</p>
           <p class="text-slate-600">Status: <span class="font-semibold" style="color: ${fillColor}">${statusDisplay}</span></p>
           <hr class="my-1 border-slate-200"/>
           <p class="text-slate-500">Suhu: ${weatherInfo.temp_avg ?? '-'}°C</p>
           <p class="text-slate-500">Kelembapan: ${weatherInfo.humidity_avg ?? '-'}%</p>
           <p class="text-slate-500">Angin: ${weatherInfo.windspeed_avg ?? '-'} m/s</p>
         </div>`
      : `<div class="p-1 text-xs">
           <p class="font-bold text-slate-800">${name}</p>
           <p class="text-slate-600">Status: <span class="font-semibold" style="color: ${fillColor}">${statusDisplay}</span></p>
         </div>`;

    layer.bindTooltip(weatherTooltipContent, {
      direction: 'auto',
      className: 'custom-leaflet-tooltip shadow-lg rounded-2xl border border-slate-100 bg-white p-2'
    });
  };

  const selectedName = selectedKecamatanCode ? getKecamatanName(selectedKecamatanCode) : '';
  const selectedLatest = selectedKecamatanCode ? getLatestPeriodData(selectedKecamatanCode) : null;
  const selectedWeather = selectedKecamatanCode && data.weather ? data.weather[selectedKecamatanCode] : null;
  const chartTimelineData = selectedKecamatanCode ? getChartDataForKecamatan(selectedKecamatanCode) : [];

  const activePointForFeatures = activeTimelinePoint || (chartTimelineData.length > 0 ? chartTimelineData[chartTimelineData.length - 1] : null);
  const activeFeatureItem = (selectedKecamatanCode && activePointForFeatures) 
    ? getFeatureForPeriod(selectedKecamatanCode, activePointForFeatures.year, activePointForFeatures.month) 
    : null;

  return (
    <div className="space-y-6  max-w-7xl mx-auto px-4 py-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm mb-1">
            <Layers className="w-4 h-4" />
            <span>SiPanen Jember Intelligence</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
            Peta Prediksi Panen Padi LSTM
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Monitoring spasial dan analisis tren hasil panen 31 kecamatan di Kabupaten Jember secara real-time.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 px-4 py-2 rounded-2xl text-xs font-medium flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Model LSTM Aktif & Sinkron
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-5 py-4 rounded-3xl text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-500" />
          <div>
            <span className="font-bold">Perhatian: </span> {error}. Sebagian komponen mungkin menggunakan data cadangan atau terbatas.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white p-4 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 mb-2">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" />
              Peta Sebaran Status Kecamatan
            </h2>
            <span className="text-xs text-slate-400 font-medium">Klik poligon untuk detail</span>
          </div>

          <div className="relative w-full h-[450px] md:h-[520px] rounded-2xl overflow-hidden border border-slate-100 z-0">
            {loading ? (
              <div className="absolute inset-0 bg-slate-50 flex flex-col items-center justify-center gap-3 z-50">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-slate-500 font-medium">Memuat Peta Spasial Jember...</p>
              </div>
            ) : data.geo ? (
              <MapContainer 
                center={[-8.1844, 113.6681]} 
                zoom={10} 
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <GeoJSON 
                  data={data.geo} 
                  onEachFeature={onEachFeature} 
                />
              </MapContainer>
            ) : (
              <div className="absolute inset-0 bg-slate-50 flex items-center justify-center text-slate-400 text-sm">
                Data peta tidak tersedia.
              </div>
            )}

            <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-slate-100 z-[400] text-xs space-y-2">
              <p className="font-bold text-slate-700 mb-1">Status Produksi</p>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span className="text-slate-600">Aman</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                <span className="text-slate-600">Waspada</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                <span className="text-slate-600">Kritis</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-400"></span>
                <span className="text-slate-600">Tidak Ada Data</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600" />
                Detail Wilayah
              </h2>
              {selectedKecamatanCode && (
                <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-xl font-mono">
                  {selectedKecamatanCode}
                </span>
              )}
            </div>

            {selectedKecamatanCode ? (
              <div className="mt-4 space-y-5">
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Kecamatan Terpilih</p>
                  <h3 className="text-xl font-extrabold text-slate-800 mt-0.5">{selectedName}</h3>
                  
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Status Keseluruhan ({selectedLatest?.monthName || '-'} {selectedLatest?.year || '-'}):</span>
                    <div className={`px-3 py-1 rounded-2xl text-xs font-bold border flex items-center gap-1.5 ${getStatusBadgeClass(selectedLatest?.status)}`}>
                      {selectedLatest?.status?.toLowerCase() === 'aman' && <ShieldCheck className="w-3.5 h-3.5" />}
                      {selectedLatest?.status?.toLowerCase() === 'waspada' && <AlertTriangle className="w-3.5 h-3.5" />}
                      {selectedLatest?.status?.toLowerCase() === 'kritis' && <ShieldAlert className="w-3.5 h-3.5" />}
                      {selectedLatest?.status || 'Tidak Ada Data'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 text-center">
                    <p className="text-[10px] text-slate-400 font-medium">Produktivitas</p>
                    <p className={`text-xs font-bold mt-1 ${
                      selectedLatest?.status_produktivitas === 'Aman' ? 'text-emerald-600' :
                      selectedLatest?.status_produktivitas === 'Waspada' ? 'text-amber-600' : 'text-rose-600'
                    }`}>
                      {selectedLatest?.status_produktivitas || '-'}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 text-center">
                    <p className="text-[10px] text-slate-400 font-medium">Suhu</p>
                    <p className={`text-xs font-bold mt-1 ${
                      selectedLatest?.status_suhu === 'Aman' ? 'text-emerald-600' :
                      selectedLatest?.status_suhu === 'Waspada' ? 'text-amber-600' : 'text-rose-600'
                    }`}>
                      {selectedLatest?.status_suhu || '-'}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 text-center">
                    <p className="text-[10px] text-slate-400 font-medium">Kelembapan</p>
                    <p className={`text-xs font-bold mt-1 ${
                      selectedLatest?.status_kelembapan === 'Aman' ? 'text-emerald-600' :
                      selectedLatest?.status_kelembapan === 'Waspada' ? 'text-amber-600' : 'text-rose-600'
                    }`}>
                      {selectedLatest?.status_kelembapan || '-'}
                    </p>
                  </div>
                </div>

                <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/60 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                    <CloudRain className="w-4 h-4 text-emerald-600" />
                    Kondisi Cuaca Rata-Rata
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white p-2 rounded-xl border border-emerald-100/50 shadow-sm">
                      <Thermometer className="w-3.5 h-3.5 text-rose-500 mx-auto mb-1" />
                      <span className="text-[10px] text-slate-400 block">Suhu</span>
                      <span className="text-xs font-bold text-slate-700">{selectedWeather?.temp_avg ?? '-'}°C</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-emerald-100/50 shadow-sm">
                      <Droplets className="w-3.5 h-3.5 text-blue-500 mx-auto mb-1" />
                      <span className="text-[10px] text-slate-400 block">Kelembapan</span>
                      <span className="text-xs font-bold text-slate-700">{selectedWeather?.humidity_avg ?? '-'}%</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-emerald-100/50 shadow-sm">
                      <Wind className="w-3.5 h-3.5 text-teal-500 mx-auto mb-1" />
                      <span className="text-[10px] text-slate-400 block">Angin</span>
                      <span className="text-xs font-bold text-slate-700">{selectedWeather?.windspeed_avg ?? '-'} m/s</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs">
                    <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-700">Z-Score: {selectedLatest?.z_score ?? '0.00'}</span>
                      <p className="text-slate-500 text-[11px] mt-0.5">Indikator anomali statistik dibanding rata-rata historis wilayah.</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Prediksi Periode Ini</span>
                      <span className="font-extrabold text-emerald-600 text-sm">{selectedLatest?.prediksi?.toLocaleString() ?? 0} ton</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px]">Realisasi Aktual</span>
                      <span className="font-extrabold text-slate-700 text-sm">{selectedLatest?.aktual ? `${selectedLatest.aktual.toLocaleString()} ton` : 'Belum Ada'}</span>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <MapPin className="w-8 h-8 text-slate-300 mb-2 animate-bounce" />
                <p className="text-sm">Silakan klik salah satu wilayah kecamatan pada peta untuk melihat detail analitik.</p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-400">SiPanen Jember — LSTM Forecasting Engine v2.4</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-6">
              <div>
                <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>Analisis Time-Series Model LSTM</span>
                </div>
                <h2 className="text-lg md:text-xl font-extrabold text-slate-800">
                  Tren Aktual vs Prediksi — Kecamatan {selectedName || 'Jember'}
                </h2>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-slate-400"></span>
                  <span className="text-slate-600">Aktual</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  <span className="text-slate-600">Prediksi</span>
                </div>
              </div>
            </div>

            <div className="w-full h-[280px]">
              {chartTimelineData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={chartTimelineData} 
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    onMouseMove={(state) => {
                      if (state && state.activeIndex !== undefined && state.activeIndex !== null) {
                        const idx = Number(state.activeIndex);
                        const hoveredData = chartTimelineData[idx];
                        if (hoveredData) {
                          setActiveTimelinePoint(hoveredData);
                        }
                      } else {
                        console.log('[onMouseMove] tidak ada activeIndex pada event ini:', state);
                      }
                    }}
                    onMouseLeave={() => setActiveTimelinePoint(null)}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="label" 
                      stroke="#94a3b8" 
                      fontSize={11} 
                      tickLine={false} 
                    />
                    <YAxis 
                      stroke="#94a3b8" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#ffffff', 
                        borderRadius: '16px', 
                        border: '1px solid #f1f5f9', 
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        fontSize: '12px' 
                      }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="aktual" 
                      name="Aktual" 
                      stroke="#94a3b8" 
                      strokeWidth={2} 
                      dot={{ r: 3 }} 
                      activeDot={{ r: 6 }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="prediksi" 
                      name="Prediksi LSTM" 
                      stroke="#10b981" 
                      strokeWidth={2.5} 
                      dot={{ r: 3 }} 
                      activeDot={{ r: 6 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                  Memuat data grafik tren atau pilih kecamatan terlebih dahulu...
                </div>
              )}
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-4 italic">
            * Gerakkan kursor pada titik grafik di atas untuk melihat detail faktor produksi pada bulan terkait secara real-time.
          </p>
        </div>

        <div className="lg:col-span-4 bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-600" />
                Detail Faktor Produksi
              </h3>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                {activePointForFeatures ? `${MONTH_NAMES[activePointForFeatures.month] || activePointForFeatures.month} ${activePointForFeatures.year}` : 'Periode'}
              </span>
            </div>

            {activeFeatureItem ? (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-medium">Luas Tanam</span>
                  <span className="text-sm font-extrabold text-slate-800 mt-0.5 block">
                    {toNumber(activeFeatureItem["luas tanam"]).toLocaleString()} <span className="text-xs font-normal text-slate-500">ha</span>
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-medium">Luas Panen Bersih</span>
                  <span className="text-sm font-extrabold text-slate-800 mt-0.5 block">
                    {toNumber(activeFeatureItem["luas panen bersih"]).toLocaleString()} <span className="text-xs font-normal text-slate-500">ha</span>
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-medium">Jumlah Pupuk</span>
                  <span className="text-sm font-extrabold text-slate-800 mt-0.5 block">
                    {toNumber(activeFeatureItem.jumlah_pupuk).toLocaleString()} <span className="text-xs font-normal text-slate-500">kg</span>
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-medium">Curah Hujan</span>
                  <span className="text-sm font-extrabold text-slate-800 mt-0.5 block">
                    {toNumber(activeFeatureItem.curah_hujan_mm).toLocaleString()} <span className="text-xs font-normal text-slate-500">mm</span>
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-medium">Suhu Rata-rata</span>
                  <span className="text-sm font-extrabold text-slate-800 mt-0.5 block">
                    {toNumber(activeFeatureItem.suhu_rata2_c).toLocaleString()} <span className="text-xs font-normal text-slate-500">°C</span>
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-medium">Kelembapan</span>
                  <span className="text-sm font-extrabold text-slate-800 mt-0.5 block">
                    {toNumber(activeFeatureItem.kelembaban_persen).toLocaleString()} <span className="text-xs font-normal text-slate-500">%</span>
                  </span>
                </div>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-center p-4 text-slate-400 text-xs">
                Data tidak tersedia untuk periode bulan ini.
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
            <Calendar className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <span>Sumber: Raw Feature Engineering Pipeline (LSTM)</span>
          </div>
        </div>
      </div>
    </div>
  );
}