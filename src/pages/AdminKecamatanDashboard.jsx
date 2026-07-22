import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, Plus, Download, Upload, Search, Edit3, Trash2, 
  ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, X, 
  RefreshCw, FileSpreadsheet, MapPin, Activity,
  Layers, Check, HelpCircle
} from 'lucide-react';
import geoData from '../assets/jember.json';
import * as XLSX from 'xlsx';
const feature_order = [
  'luas tanam', 'luas panen bersih', 'curah_hujan_mm', 'suhu_rata2_c', 'kelembaban_persen',
  'luas_tanam_lag3', 'luas_tanam_lag4', 'curah_hujan_lag1', 'curah_hujan_lag2',
  'jumlah_pupuk','panen_lag_1', 'panen_lag_2', 
  'tanam_lag_1', 'tanam_lag_2','produksi_ton'
];

// --- HELPER FUNCTIONS ---
const titleCase = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const getKecamatanOptions = (geoJson) => {
  const seen = new Map();
  if (geoJson && geoJson.features) {
    geoJson.features.forEach((f) => {
      const kode = f.properties?.kode;
      const nama = f.properties?.WADMKC;
      if (kode && nama && !seen.has(kode)) {
        seen.set(kode, titleCase(nama));
      }
    });
  }
  return Array.from(seen.entries())
    .map(([kode, nama]) => ({ kode, nama }))
    .sort((a, b) => a.nama.localeCompare(b.nama));
};

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export default function AdminKecamatanDashboard() {
  // --- STATES ---
  const [records, setRecords] = useState([]);
  const [kecamatanOptions, setKecamatanOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [selectedKecamatanFilter, setSelectedKecamatanFilter] = useState('');
  const [selectedTahunFilter, setSelectedTahunFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Modals
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentDocId, setCurrentDocId] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importPreviewData, setImportPreviewData] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(null);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportMode, setExportMode] = useState('filtered');
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [toasts, setToasts] = useState([]);

  const initialFormState = {
    kode: '',
    tahun: new Date().getFullYear(),
    bulan: new Date().getMonth() + 1,
    'luas tanam': 0,
    'luas panen bersih': 0,
    curah_hujan_mm: 0,
    suhu_rata2_c: 0,
    kelembaban_persen: 0,
    luas_tanam_lag3: 0,
    luas_tanam_lag4: 0,
    curah_hujan_lag1: 0,
    curah_hujan_lag2: 0,
    jumlah_pupuk: 0,
    panen_lag_1: 0,
    panen_lag_2: 0,
    tanam_lag_1: 0,
    tanam_lag_2: 0
  };

  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});

  // --- TOAST HELPER ---
  const addToast = (message, type = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // --- FETCH DATA ---
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [apiRes] = await Promise.all([
        fetch('https://lstm-padi.onrender.com/get-all-kecamatan'),
        
      ]);

      if (!apiRes.ok) throw new Error(`Gagal memuat data dari server (${apiRes.status})`);
      const apiData = await apiRes.json();
      setRecords(Array.isArray(apiData) ? apiData : apiData.data || []);

      if (geoData) {
        const options = getKecamatanOptions( geoData);
        setKecamatanOptions(options);
      } else {
        const fallbackOptions = [
          { kode: "35.09.01", nama: "Jember" },
          { kode: "35.09.08", nama: "Puger" },
          { kode: "35.09.21", nama: "Sumbersari" },
          { kode: "35.09.07", nama: "Kaliwates" },
          { kode: "35.09.06", nama: "Patrang" }
        ];
        setKecamatanOptions(fallbackOptions);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Terjadi kesalahan saat memuat data.");
      addToast(err.message || "Gagal memuat data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- MAPPING HELPERS ---
  const mapPayloadToDisplay = (features) => {
    const displayData = {};
    feature_order.forEach(key => {
      // Menangani variasi underscore vs spasi untuk luas tanam dan luas panen bersih
      if (key === 'luas tanam') {
        displayData[key] = features['luas tanam'] ?? features.luas_tanam ?? 0;
      } else if (key === 'luas panen bersih') {
        displayData[key] = features['luas panen bersih'] ?? features.luas_panen_bersih ?? 0;
      } else {
        displayData[key] = features[key] ?? 0;
      }
    });
    return displayData;
  };

  const mapFeaturesToPayload = (form) => {
    const featuresPayload = {};
    feature_order.forEach(key => {
      featuresPayload[key] = Number(form[key] || 0);
    });

    return {
      bulan: Number(form.bulan),
      tahun: Number(form.tahun),
      kode: form.kode,
      features: featuresPayload
    };
  };

  const getNamaKecamatan = (kode) => {
    const found = kecamatanOptions.find(o => o.kode === kode);
    return found ? found.nama : kode;
  };

  // --- TABLE FILTERING & PAGINATION ---
  const filteredRecords = useMemo(() => {
    return records.filter(item => {
      const namaKec = getNamaKecamatan(item.kode).toLowerCase();
      const matchKecamatan = selectedKecamatanFilter ? item.kode === selectedKecamatanFilter : true;
      const matchTahun = selectedTahunFilter ? String(item.tahun) === selectedTahunFilter : true;
      const matchSearch = searchTerm ? (
        namaKec.includes(searchTerm.toLowerCase()) || 
        item.kode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(item.tahun).includes(searchTerm)
      ) : true;
      return matchKecamatan && matchTahun && matchSearch;
    });
  }, [records, selectedKecamatanFilter, selectedTahunFilter, searchTerm, kecamatanOptions]);

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(start, start + itemsPerPage);
  }, [filteredRecords, currentPage]);

  const availableYears = useMemo(() => {
    const years = new Set(records.map(r => r.tahun));
    return Array.from(years).sort((a, b) => b - a);
  }, [records]);

  // --- FORM HANDLERS ---
  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setCurrentDocId(null);
    setFormData(initialFormState);
    setFormErrors({});
    setIsAddEditModalOpen(true);
  };

  const handleOpenEditModal = (record) => {
    setIsEditMode(true);
    setCurrentDocId(record.id);
    const mappedFeatures = mapPayloadToDisplay(record.features || {});
    setFormData({
      kode: record.kode,
      tahun: record.tahun,
      bulan: record.bulan,
      ...mappedFeatures
    });
    setFormErrors({});
    setIsAddEditModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.kode) errors.kode = "Kode kecamatan wajib dipilih.";
    if (!formData.tahun || isNaN(Number(formData.tahun))) errors.tahun = "Tahun wajib diisi.";
    if (!formData.bulan) errors.bulan = "Bulan wajib dipilih.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      addToast("Mohon lengkapi field yang wajib diisi.", "error");
      return;
    }

    const payload = mapFeaturesToPayload(formData);

    try {
      let res;
      if (isEditMode && currentDocId) {
        res = await fetch(`https://lstm-padi.onrender.com/update-features/${currentDocId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('https://lstm-padi.onrender.com/save-features', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) throw new Error("Gagal menyimpan data ke server.");

      addToast(isEditMode ? "Data berhasil diperbarui!" : "Data berhasil ditambahkan!", "success");
      setIsAddEditModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      addToast(err.message || "Terjadi kesalahan saat menyimpan data.", "error");
    }
  };

  // --- DELETE HANDLERS ---
  const handleOpenDeleteModal = (record) => {
    setRecordToDelete(record);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!recordToDelete) return;
    try {
      const res = await fetch(`https://lstm-padi.onrender.com/delete-features/${recordToDelete.id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error("Gagal menghapus data.");

      addToast("Data berhasil dihapus.", "success");
      setIsDeleteModalOpen(false);
      setRecordToDelete(null);
      fetchData();
    } catch (err) {
      console.error(err);
      addToast(err.message || "Gagal menghapus data.", "error");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRowIds.length === 0) return;
    if (!window.confirm(`Yakin ingin menghapus ${selectedRowIds.length} data terpilih?`)) return;

    try {
      let successCount = 0;
      for (const id of selectedRowIds) {
        const res = await fetch(`https://lstm-padi.onrender.com/delete-features/${id}`, { method: 'DELETE' });
        if (res.ok) successCount++;
      }
      addToast(`Berhasil menghapus ${successCount} dari ${selectedRowIds.length} data.`, "success");
      setSelectedRowIds([]);
      fetchData();
    } catch (err) {
      addToast("Terjadi kesalahan saat menghapus data massal.", "error");
    }
  };

  // --- IMPORT & TEMPLATE HANDLERS ---
  const handleDownloadTemplate = () => {
    const templateRow = {
      Kode: "35.09.21",
      Kecamatan: "Sumbersari"
    };
    
    // Mengisi kolom berdasarkan urutan feature_order secara persis
    feature_order.forEach(key => {
      templateRow[key] = 0;
    });

    templateRow.tahun = 2026;
    templateRow.bulan = 6;

    const worksheet = XLSX.utils.json_to_sheet([templateRow]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template Fitur");
    XLSX.writeFile(workbook, "template-import-fitur-kecamatan.xlsx");
    addToast("Template Excel berhasil diunduh.", "success");
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      parseExcelFile(file);
    }
  };

  const parseExcelFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const validatedRows = jsonData.map((row, index) => {
          let kodeInput = String(row.Kode || row.kode || '').trim();
          let namaInput = String(row.Kecamatan || row.kecamatan || '').trim();
          let tahunInput = row.tahun ?? row.Tahun;
          let bulanInput = row.bulan ?? row.Bulan;
          
          let matchedOption = kecamatanOptions.find(o => o.kode === kodeInput || o.nama.toLowerCase() === namaInput.toLowerCase());

          if (!matchedOption && namaInput) {
            matchedOption = kecamatanOptions.find(o => o.nama.toLowerCase() === namaInput.toLowerCase());
          }

          const isValid = Boolean(matchedOption && tahunInput && bulanInput !== undefined);

          const featuresObj = {};
          feature_order.forEach(key => {
            featuresObj[key] = Number(row[key] || 0);
          });

          return {
            rowNumber: index + 1,
            kode: matchedOption ? matchedOption.kode : kodeInput,
            namaKecamatan: matchedOption ? matchedOption.nama : (namaInput || 'Tidak Dikenali'),
            tahun: Number(tahunInput || 2026),
            bulan: Number(bulanInput || 1),
            features: featuresObj,
            isValid,
            errorMsg: !matchedOption ? "Kecamatan/Kode tidak valid" : !tahunInput ? "Tahun kosong" : null
          };
        });

        setImportPreviewData(validatedRows);
      } catch (err) {
        console.error(err);
        addToast("Gagal memparsing file Excel.", "error");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExecuteImport = async () => {
    const validRows = importPreviewData.filter(r => r.isValid);
    if (validRows.length === 0) {
      addToast("Tidak ada data valid untuk diimpor.", "error");
      return;
    }

    setIsImporting(true);
    setImportProgress({ current: 0, total: validRows.length, success: 0, failed: 0 });

    let success = 0;
    let failed = 0;

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      try {
        const payload = {
          bulan: row.bulan,
          tahun: row.tahun,
          kode: row.kode,
          features: row.features
        };
        const res = await fetch('https://lstm-padi.onrender.com/save-features', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) success++;
        else failed++;
      } catch {
        failed++;
      }
      setImportProgress({ current: i + 1, total: validRows.length, success, failed });
    }

    setIsImporting(false);
    addToast(`Import selesai. Berhasil: ${success}, Gagal: ${failed}`, success > 0 ? "success" : "error");
    setIsImportModalOpen(false);
    setImportFile(null);
    setImportPreviewData([]);
    setImportProgress(null);
    fetchData();
  };

  // --- EXPORT HANDLERS ---
  const handleExportData = () => {
    const targetData = exportMode === 'all' ? records : filteredRecords;
    if (targetData.length === 0) {
      addToast("Tidak ada data untuk diexport.", "error");
      return;
    }

    const exportRows = targetData.map(item => {
      const rowObj = {
        Kode: item.kode,
        Kecamatan: getNamaKecamatan(item.kode)
      };

      feature_order.forEach(key => {
        rowObj[key] = item.features?.[key] ?? 0;
      });

      rowObj.tahun = item.tahun;
      rowObj.bulan = item.bulan;
      return rowObj;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Fitur LSTM");
    
    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `data-fitur-kecamatan-${dateStr}.xlsx`);
    addToast("Export data berhasil diunduh.", "success");
    setIsExportModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased pb-20">
      {/* --- TOAST CONTAINER --- */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 p-4 rounded-2xl shadow-xl border backdrop-blur-md transition-all transform translate-y-0 animate-in fade-in slide-in-from-top-5 ${
              toast.type === 'success' ? 'bg-emerald-900/90 text-white border-emerald-700' :
              toast.type === 'error' ? 'bg-rose-900/90 text-white border-rose-700' :
              'bg-slate-900/90 text-white border-slate-700'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> :
             toast.type === 'error' ? <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" /> :
             <HelpCircle className="w-5 h-5 text-sky-400 shrink-0" />}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        ))}
      </div>

      {/* --- HEADER --- */}
      <header className="bg-emerald-800 text-white shadow-lg sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-700 p-2.5 rounded-2xl border border-emerald-600 shadow-inner">
              <Activity className="w-7 h-7 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest font-semibold text-emerald-300 bg-emerald-900/50 px-2.5 py-0.5 rounded-full">SiPanen Jember</span>
                <span className="text-xs text-emerald-200/85">• Model LSTM Input Management</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard Admin — Kelola Data Fitur Kecamatan</h1>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-medium transition shadow-sm border border-emerald-600"
            >
              <Upload className="w-4 h-4" /> Import Excel
            </button>
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-medium transition shadow-sm border border-emerald-600"
            >
              <Download className="w-4 h-4" /> Export Excel
            </button>
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 text-sm font-semibold transition shadow-md"
            >
              <Plus className="w-4 h-4" /> Tambah Data
            </button>
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT CONTAINER --- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        
        {/* STATS & FILTER BAR */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
          
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-700">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Record</p>
              <p className="text-2xl font-bold text-slate-900">{filteredRecords.length} <span className="text-xs font-normal text-slate-500">dari {records.length} data</span></p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Filter Kecamatan</label>
            <select
              value={selectedKecamatanFilter}
              onChange={(e) => { setSelectedKecamatanFilter(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            >
              <option value="">Semua Kecamatan ({kecamatanOptions.length})</option>
              {kecamatanOptions.map(opt => (
                <option key={opt.kode} value={opt.kode}>{opt.nama} ({opt.kode})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Filter Tahun</label>
            <select
              value={selectedTahunFilter}
              onChange={(e) => { setSelectedTahunFilter(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            >
              <option value="">Semua Tahun</option>
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Cari Cepat</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Cari kecamatan / tahun..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
          </div>

        </div>

        {/* BULK ACTIONS BAR */}
        {selectedRowIds.length > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between shadow-sm animate-in fade-in">
            <span className="text-sm font-semibold text-emerald-900">
              {selectedRowIds.length} baris dipilih
            </span>
            <button
              onClick={handleBulkDelete}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition shadow-sm"
            >
              <Trash2 className="w-4 h-4" /> Hapus Terpilih
            </button>
          </div>
        )}

        {/* DATA TABLE CARD */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center gap-4 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
              <p className="text-sm font-medium">Memuat data fitur kecamatan...</p>
            </div>
          ) : error ? (
            <div className="p-16 text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
              <p className="text-slate-700 font-medium">{error}</p>
              <button 
                onClick={fetchData}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition"
              >
                Coba Lagi
              </button>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-slate-600 font-semibold text-lg">Tidak ada data ditemukan</p>
              <p className="text-slate-400 text-sm">Coba sesuaikan filter atau tambahkan data fitur baru.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
                      <th className="py-4 px-4 w-10 text-center">
                        <input 
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) setSelectedRowIds(paginatedRecords.map(r => r.id));
                            else setSelectedRowIds([]);
                          }}
                          checked={paginatedRecords.length > 0 && paginatedRecords.every(r => selectedRowIds.includes(r.id))}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                      </th>
                      <th className="py-4 px-4">Kecamatan</th>
                      <th className="py-4 px-4">Periode</th>
                      {feature_order.slice(0, 5).map((featKey) => (
                        <th key={featKey} className="py-4 px-4 text-right capitalize">{featKey.replace(/_/g, ' ')}</th>
                      ))}
                      <th className="py-4 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {paginatedRecords.map((item) => {
                      const f = item.features || {};
                      const isSelected = selectedRowIds.includes(item.id);

                      return (
                        <tr key={item.id} className={`hover:bg-emerald-50/40 transition ${isSelected ? 'bg-emerald-50/70' : ''}`}>
                          <td className="py-3 px-4 text-center">
                            <input 
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedRowIds(prev => [...prev, item.id]);
                                else setSelectedRowIds(prev => prev.filter(id => id !== item.id));
                              }}
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            {getNamaKecamatan(item.kode)}
                            <span className="block text-[11px] font-normal text-slate-400 font-mono">{item.kode}</span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-medium text-slate-700">{MONTH_NAMES[(item.bulan || 1) - 1]} {item.tahun}</span>
                          </td>
                          {feature_order.slice(0, 5).map((featKey) => {
                            const val = featKey === 'luas tanam' ? (f['luas tanam'] ?? f.luas_tanam ?? 0) :
                                        featKey === 'luas panen bersih' ? (f['luas panen bersih'] ?? f.luas_panen_bersih ?? 0) :
                                        (f[featKey] ?? 0);
                            return (
                              <td key={featKey} className="py-3 px-4 text-right font-mono text-slate-700">
                                {typeof val === 'number' ? val.toLocaleString(undefined, { maximumFractionDigits: 2 }) : val}
                              </td>
                            );
                          })}
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleOpenEditModal(item)}
                                title="Edit Data"
                                className="p-1.5 bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-700 rounded-lg transition"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenDeleteModal(item)}
                                title="Hapus Data"
                                className="p-1.5 bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 rounded-lg transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION FOOTER */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-slate-500 font-medium">
                  Menampilkan {Math.min((currentPage - 1) * itemsPerPage + 1, filteredRecords.length)} - {Math.min(currentPage * itemsPerPage, filteredRecords.length)} dari {filteredRecords.length} data
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-semibold px-3 py-1 bg-white border border-slate-300 rounded-xl text-slate-700">
                    Hal {currentPage} / {totalPages || 1}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="p-2 rounded-xl border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* --- ADD / EDIT MODAL --- */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-2050 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="px-6 py-5 bg-emerald-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-700 p-2 rounded-xl">
                  {isEditMode ? <Edit3 className="w-5 h-5 text-emerald-200" /> : <Plus className="w-5 h-5 text-emerald-200" />}
                </div>
                <div>
                  <h2 className="text-lg font-bold">{isEditMode ? "Edit Data Fitur Kecamatan" : "Tambah Data Fitur Kecamatan"}</h2>
                  <p className="text-xs text-emerald-200">Input parameter bulanan untuk pemodelan LSTM SiPanen Jember</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddEditModalOpen(false)}
                className="p-2 text-emerald-200 hover:text-white rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
              
              <div className="bg-emerald-50/70 border border-emerald-200 p-5 rounded-2xl space-y-4">
                <h3 className="text-sm font-bold text-emerald-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-700" /> Lokasi & Periode Waktu
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-3">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Kecamatan <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.kode}
                      onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
                      className={`w-full bg-white border ${formErrors.kode ? 'border-rose-500 ring-rose-200' : 'border-slate-300'} rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                    >
                      <option value="">-- Pilih Kecamatan dari Daftar --</option>
                      {kecamatanOptions.map(opt => (
                        <option key={opt.kode} value={opt.kode}>{opt.nama} (Kode: {opt.kode})</option>
                      ))}
                    </select>
                    {formErrors.kode && <p className="text-xs text-rose-500 mt-1">{formErrors.kode}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tahun <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.tahun}
                      onChange={(e) => setFormData({ ...formData, tahun: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="2026"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Bulan <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.bulan}
                      onChange={(e) => setFormData({ ...formData, bulan: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {MONTH_NAMES.map((name, idx) => (
                        <option key={idx + 1} value={idx + 1}>{idx + 1} - {name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
                  <Activity className="w-4 h-4 text-emerald-600" /> Parameter Fitur LSTM (Urutan Sesuai Model)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {feature_order.map((featKey) => (
                    <div key={featKey}>
                      <label className="block text-xs font-semibold text-slate-600 mb-1 capitalize">
                        {featKey.replace(/_/g, ' ')}
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={formData[featKey] ?? 0}
                        onChange={(e) => setFormData({ ...formData, [featKey]: Number(e.target.value) })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold transition shadow-md"
                >
                  {isEditMode ? "Simpan Perubahan" : "Tambah Data"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {isDeleteModalOpen && recordToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-slate-900">Konfirmasi Hapus Data</h3>
              <p className="text-sm text-slate-600">
                Yakin ingin menghapus data untuk <span className="font-semibold text-slate-800">{getNamaKecamatan(recordToDelete.kode)}</span> ({MONTH_NAMES[recordToDelete.bulan - 1]} {recordToDelete.tahun})? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition w-full"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition shadow-md w-full"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- IMPORT MODAL --- */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            
            <div className="px-6 py-5 bg-emerald-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-700 p-2 rounded-xl">
                  <Upload className="w-5 h-5 text-emerald-200" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Import Data Massal (Excel / CSV)</h2>
                  <p className="text-xs text-emerald-200">Unggah file template untuk menambahkan banyak data fitur sekaligus</p>
                </div>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="p-2 text-emerald-200 hover:text-white rounded-full transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">1. Unduh Template Excel</h4>
                  <p className="text-xs text-slate-500">Gunakan format kolom yang sesuai dengan urutan model LSTM.</p>
                </div>
                <button
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl transition shadow-sm"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Download Template .xlsx
                </button>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">2. Unggah File Terisi</label>
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-emerald-500 transition bg-slate-50/50">
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileChange}
                    className="hidden"
                    id="excel-file-upload"
                  />
                  <label htmlFor="excel-file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                    <div className="p-3 bg-emerald-100 text-emerald-700 rounded-full">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-semibold text-slate-700">
                      {importFile ? importFile.name : "Klik untuk memilih file atau seret file ke sini"}
                    </span>
                    <span className="text-xs text-slate-400">Format .xlsx atau .csv</span>
                  </label>
                </div>
              </div>

              {importPreviewData.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-800">3. Pratinjau Validasi Data ({importPreviewData.length} baris)</h4>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg">
                      Valid: {importPreviewData.filter(r => r.isValid).length} | Tidak Valid: {importPreviewData.filter(r => !r.isValid).length}
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 sticky top-0 font-bold">
                        <tr>
                          <th className="p-3">Status</th>
                          <th className="p-3">Baris</th>
                          <th className="p-3">Kode / Kecamatan</th>
                          <th className="p-3">Tahun/Bulan</th>
                          <th className="p-3">Keterangan Error</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {importPreviewData.map((row, idx) => (
                          <tr key={idx} className={row.isValid ? 'bg-emerald-50/30' : 'bg-rose-50/30'}>
                            <td className="p-3">
                              {row.isValid ? (
                                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold"><Check className="w-3.5 h-3.5" /> Valid</span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-rose-700 font-semibold"><AlertCircle className="w-3.5 h-3.5" /> Invalid</span>
                              )}
                            </td>
                            <td className="p-3 font-mono">{row.rowNumber}</td>
                            <td className="p-3 font-semibold">{row.namaKecamatan} <span className="text-slate-400 font-mono font-normal">({row.kode})</span></td>
                            <td className="p-3 font-mono">{row.bulan}/{row.tahun}</td>
                            <td className="p-3 text-rose-600 font-medium">{row.errorMsg || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {isImporting && importProgress && (
                <div className="space-y-2 bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
                  <div className="flex justify-between text-xs font-bold text-emerald-900">
                    <span>Mengimpor data... ({importProgress.current}/{importProgress.total})</span>
                    <span>{Math.round((importProgress.current / importProgress.total) * 100)}%</span>
                  </div>
                  <div className="w-full bg-emerald-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-emerald-600 h-full transition-all duration-300"
                      style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition"
              >
                Tutup
              </button>
              <button
                onClick={handleExecuteImport}
                disabled={isImporting || importPreviewData.filter(r => r.isValid).length === 0}
                className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-sm font-semibold transition shadow-md"
              >
                {isImporting ? "Mengimpor..." : `Import ${importPreviewData.filter(r => r.isValid).length} Data Valid`}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- EXPORT MODAL --- */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-700 mx-auto">
              <Download className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-slate-900">Export Data Fitur Kecamatan</h3>
              <p className="text-sm text-slate-600">Pilih cakupan data yang ingin diexport ke format Excel (.xlsx).</p>
            </div>
            
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input 
                  type="radio" 
                  name="exportMode" 
                  checked={exportMode === 'filtered'} 
                  onChange={() => setExportMode('filtered')}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <p className="text-sm font-bold text-slate-800">Export Sesuai Filter ({filteredRecords.length} data)</p>
                  <p className="text-xs text-slate-500">Hanya data yang sedang tampil pada tabel saat ini.</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input 
                  type="radio" 
                  name="exportMode" 
                  checked={exportMode === 'all'} 
                  onChange={() => setExportMode('all')}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <p className="text-sm font-bold text-slate-800">Export Seluruh Data ({records.length} data)</p>
                  <p className="text-xs text-slate-500">Semua data rekam fitur di database.</p>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition w-full"
              >
                Batal
              </button>
              <button
                onClick={handleExportData}
                className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold transition shadow-md w-full"
              >
                Download Excel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}