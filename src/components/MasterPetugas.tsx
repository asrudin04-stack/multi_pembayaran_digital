/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { 
  Users, 
  Plus, 
  Edit3, 
  Trash2, 
  X, 
  Check, 
  Lock, 
  MapPin, 
  User, 
  Key, 
  Eye, 
  EyeOff,
  Search,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { Pelanggan, Petugas } from "../types";

interface MasterPetugasProps {
  petugasList: Petugas[];
  pelangganList: Pelanggan[];
  onAddPetugas: (p: Petugas) => Promise<void>;
  onUpdatePetugas: (p: Petugas) => Promise<void>;
  onDeletePetugas: (id: string) => Promise<void>;
}

export default function MasterPetugas({
  petugasList,
  pelangganList,
  onAddPetugas,
  onUpdatePetugas,
  onDeletePetugas
}: MasterPetugasProps) {
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPetugas, setEditingPetugas] = useState<Petugas | null>(null);

  // Form input fields
  const [nama, setNama] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedDesa, setSelectedDesa] = useState("");
  const [customDesa, setCustomDesa] = useState("");
  const [isCustomDesaMode, setIsCustomDesaMode] = useState(false);

  const [showPasswordMap, setShowPasswordMap] = useState<{ [id: string]: boolean }>({});
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Parse and extract unique villages/desas from pelanggan list addresses
  const uniqueDesaList = useMemo(() => {
    const set = new Set<string>();
    
    // Seed some defaults from the initials
    set.add("Desa Makmur");
    set.add("Bogor");
    set.add("Depok");
    set.add("Jakarta");
    set.add("Bekasi");
    set.add("Tangerang");

    pelangganList.forEach(p => {
      if (p.wilayahDesa) {
        set.add(p.wilayahDesa.trim());
        return;
      }
      if (!p.alamat) return;
      
      // Split by common separators (comma, semicolon)
      const parts = p.alamat.split(/[,;]/);
      parts.forEach(part => {
        const trimmed = part.trim();
        
        // Exclude specific street names or exact numbers to get clean village/area tags
        if (
          trimmed && 
          !trimmed.match(/\bNo\.\s*\d+/i) && 
          !trimmed.match(/\bRT\s*\d+/i) && 
          !trimmed.match(/\bRW\s*\d+/i) &&
          !trimmed.match(/^\d+$/) &&
          trimmed.length > 2 && 
          trimmed.length < 35
        ) {
          // Format text (Title Case)
          const formatted = trimmed.replace(/\b\w/g, c => c.toUpperCase());
          set.add(formatted);
        }
      });

      // If the address itself is very short (e.g. just a village name), add it
      if (p.alamat.length < 25) {
        set.add(p.alamat.trim());
      }
    });

    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [pelangganList]);

  const handleOpenCreate = () => {
    setEditingPetugas(null);
    setNama("");
    setUsername("");
    setPassword("");
    
    // Default to the first village in the list or "Desa Makmur"
    const defaultDesa = uniqueDesaList[0] || "Desa Makmur";
    setSelectedDesa(defaultDesa);
    setCustomDesa("");
    setIsCustomDesaMode(false);
    setErrors({});
    setShowFormPassword(false);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (p: Petugas) => {
    setEditingPetugas(p);
    setNama(p.nama);
    setUsername(p.username);
    setPassword(p.password);
    
    // Check if the officer's village matches any in our extracted list
    const isExtracted = uniqueDesaList.includes(p.wilayahDesa);
    if (isExtracted) {
      setSelectedDesa(p.wilayahDesa);
      setCustomDesa("");
      setIsCustomDesaMode(false);
    } else {
      setSelectedDesa("MANUAL_INPUT");
      setCustomDesa(p.wilayahDesa);
      setIsCustomDesaMode(true);
    }
    
    setErrors({});
    setShowFormPassword(false);
    setIsFormOpen(true);
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPasswordMap(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const validateForm = () => {
    const tempErrors: { [key: string]: string } = {};
    if (!nama.trim()) tempErrors.nama = "Nama lengkap petugas wajib diisi";
    
    const trimmedUsername = username.trim().toLowerCase();
    if (!trimmedUsername) {
      tempErrors.username = "Username login wajib diisi";
    } else if (trimmedUsername.length < 4) {
      tempErrors.username = "Username minimal harus 4 karakter";
    } else if (
      petugasList.some(
        p => p.username.toLowerCase() === trimmedUsername && p.id !== editingPetugas?.id
      ) || 
      trimmedUsername === "admin"
    ) {
      tempErrors.username = "Username sudah digunakan oleh petugas lain atau dilarang";
    }

    if (!password) {
      tempErrors.password = "Password login wajib diisi";
    } else if (password.length < 4) {
      tempErrors.password = "Password minimal harus 4 karakter";
    }

    if (isCustomDesaMode && !customDesa.trim()) {
      tempErrors.customDesa = "Nama wilayah/desa manual wajib diisi";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const finalWilayah = isCustomDesaMode ? customDesa.trim() : selectedDesa;

    const data: Petugas = {
      id: editingPetugas ? editingPetugas.id : `PTG-${Math.floor(100 + Math.random() * 900)}`,
      nama: nama.trim(),
      username: username.trim().toLowerCase(),
      password: password,
      wilayahDesa: finalWilayah
    };

    try {
      if (editingPetugas) {
        await onUpdatePetugas(data);
      } else {
        await onAddPetugas(data);
      }
      setIsFormOpen(false);
    } catch (err) {
      console.error("Failed to save petugas:", err);
      setErrors({ global: "Gagal menyimpan data ke database cloud." });
    }
  };

  const handleDeleteClick = async (id: string, namaPetugas: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus petugas "${namaPetugas}"? Akses login petugas ini akan langsung dicabut.`)) {
      try {
        await onDeletePetugas(id);
      } catch (err) {
        console.error("Failed to delete petugas:", err);
        alert("Gagal menghapus data petugas.");
      }
    }
  };

  const filteredPetugasList = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return petugasList;
    return petugasList.filter(
      p => 
        p.nama.toLowerCase().includes(q) || 
        p.username.toLowerCase().includes(q) || 
        p.wilayahDesa.toLowerCase().includes(q)
    );
  }, [petugasList, searchTerm]);

  return (
    <div className="space-y-6" id="master-petugas-canvas">
      
      {/* Header Panel */}
      <div className="bg-slate-900 rounded-2xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-10 pointer-events-none">
          <Users size={220} className="text-slate-200" />
        </div>
        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-indigo-500/15 border border-indigo-500/30 px-3 py-1 rounded-full text-indigo-300 text-xs font-bold">
            <Lock size={13} />
            HAK AKSES ADMINISTRATOR
          </div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight">Master Data Petugas & Loket Kasir</h1>
          <p className="text-slate-300 text-xs leading-relaxed font-medium">
            Kelola data akun kasir lokal dan batasi ruang lingkup kerja (alamat wilayah/desa) masing-masing petugas.
            Kasir hanya akan dapat melihat, mencari, dan memproses pembayaran tagihan pelanggan yang berada di dalam wilayah tugasnya.
          </p>
        </div>
      </div>

      {/* Main Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left/Main Column: Officers List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
            
            {/* Action Bar */}
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Cari petugas berdasarkan Nama, Username, atau Wilayah..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-1.5 w-full bg-slate-50 text-xs border border-slate-250 rounded-lg focus:outline-hidden focus:border-indigo-600 text-slate-700"
                />
              </div>
              <button
                onClick={handleOpenCreate}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md shadow-indigo-600/10 shrink-0"
              >
                <Plus size={15} />
                Tambah Petugas Baru
              </button>
            </div>

            {/* List Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Nama Petugas</th>
                    <th className="py-3 px-4">Username Login</th>
                    <th className="py-3 px-4">Password</th>
                    <th className="py-3 px-4">Cakupan Wilayah / Desa</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredPetugasList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                        Tidak ada data petugas yang cocok dengan pencarian Anda.
                      </td>
                    </tr>
                  ) : (
                    filteredPetugasList.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200 uppercase">
                              {p.nama.substring(0, 2)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-850">{p.nama}</p>
                              <p className="text-[10px] text-slate-400 font-mono">ID: {p.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                          {p.username}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 font-mono">
                            <span className="text-slate-600">
                              {showPasswordMap[p.id] ? p.password : "••••••••"}
                            </span>
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(p.id)}
                              className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
                              title="Tampilkan / Sembunyikan Password"
                            >
                              {showPasswordMap[p.id] ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg border border-amber-200">
                            <MapPin size={11} className="text-amber-500" />
                            {p.wilayahDesa}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-lg transition cursor-pointer"
                              title="Edit Profil/Akses Petugas"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(p.id, p.nama)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50/50 rounded-lg transition cursor-pointer"
                              title="Hapus / Cabut Akses Petugas"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-50/50 border-t border-slate-100 text-center text-[11px] text-slate-500 font-medium">
              Menampilkan {filteredPetugasList.length} dari total {petugasList.length} petugas kasir terdaftar.
            </div>
          </div>
        </div>

        {/* Right Column: Form Panel (Add / Edit) or Helper Card */}
        <div className="lg:col-span-4">
          {isFormOpen ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-5 space-y-4 relative">
              <button
                onClick={() => setIsFormOpen(false)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                <X size={15} />
              </button>

              <div className="space-y-1 pr-6">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                    <Users size={14} />
                  </span>
                  {editingPetugas ? "Ubah Data Akses Petugas" : "Tambah Petugas Kasir Baru"}
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">
                  {editingPetugas ? "Sesuaikan nama, password, atau wilayah kerja petugas" : "Buat kredensial kasir loket baru untuk wilayah kerja spesifik"}
                </p>
              </div>

              {errors.global && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-800 text-[11px] font-bold flex items-center gap-2">
                  <AlertCircle size={14} className="text-rose-500 shrink-0" />
                  <span>{errors.global}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                {/* Field: Full Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-500 font-bold block">Nama Lengkap</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <User size={13} />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Ahmad Subagja"
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                      className={`w-full text-xs pl-9 pr-3 py-1.5 bg-slate-50 border rounded-lg focus:outline-hidden text-slate-800 font-medium ${
                        errors.nama ? "border-rose-300 focus:border-rose-500" : "border-slate-250 focus:border-indigo-600"
                      }`}
                    />
                  </div>
                  {errors.nama && <p className="text-[10px] text-rose-600 font-semibold">{errors.nama}</p>}
                </div>

                {/* Field: Username */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-500 font-bold block">Username Login</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 font-mono font-bold text-[11px]">
                      @
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: ahmadkasir"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                      className={`w-full text-xs pl-9 pr-3 py-1.5 bg-slate-50 border rounded-lg focus:outline-hidden text-slate-800 font-mono font-bold ${
                        errors.username ? "border-rose-300 focus:border-rose-500" : "border-slate-250 focus:border-indigo-600"
                      }`}
                    />
                  </div>
                  {errors.username && <p className="text-[10px] text-rose-600 font-semibold">{errors.username}</p>}
                </div>

                {/* Field: Password */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-500 font-bold block">Password Login</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Key size={13} />
                    </span>
                    <input
                      type={showFormPassword ? "text" : "password"}
                      required
                      placeholder="Masukkan password akun"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full text-xs pl-9 pr-9 py-1.5 bg-slate-50 border rounded-lg focus:outline-hidden text-slate-800 font-mono ${
                        errors.password ? "border-rose-300 focus:border-rose-500" : "border-slate-250 focus:border-indigo-600"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowFormPassword(!showFormPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showFormPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-[10px] text-rose-600 font-semibold">{errors.password}</p>}
                </div>

                {/* Field: Wilayah Kerja (Village/Region) - Dynamic Extracted Dropdown */}
                <div className="space-y-1.5 p-3.5 bg-slate-50/70 border border-slate-100 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-mono uppercase text-slate-500 font-extrabold flex items-center gap-1">
                      <MapPin size={11} className="text-indigo-500" />
                      Cakupan Wilayah Kerja
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomDesaMode(!isCustomDesaMode);
                        setCustomDesa("");
                      }}
                      className="text-[10px] text-indigo-600 hover:underline font-bold"
                    >
                      {isCustomDesaMode ? "Gunakan Dropdown" : "Tulis Manual"}
                    </button>
                  </div>

                  {!isCustomDesaMode ? (
                    <div>
                      <select
                        value={selectedDesa}
                        onChange={(e) => {
                          if (e.target.value === "MANUAL_INPUT") {
                            setIsCustomDesaMode(true);
                          } else {
                            setSelectedDesa(e.target.value);
                          }
                        }}
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-250 rounded-lg focus:outline-hidden focus:border-indigo-600 text-slate-800 font-semibold"
                      >
                        {uniqueDesaList.map((desa) => (
                          <option key={desa} value={desa}>
                            {desa} (Ditemukan di Data Pelanggan)
                          </option>
                        ))}
                        <option value="MANUAL_INPUT" className="text-indigo-600 font-bold">
                          + Tulis Wilayah Baru Manual...
                        </option>
                      </select>
                      <p className="text-[9px] text-slate-400 mt-1 font-medium">
                        Dropdown ini ditarik real-time dari data alamat seluruh pelanggan terdaftar.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        placeholder="Contoh: Desa Sejahtera"
                        value={customDesa}
                        onChange={(e) => setCustomDesa(e.target.value)}
                        className={`w-full text-xs px-2.5 py-1.5 bg-white border rounded-lg focus:outline-hidden text-slate-800 font-semibold uppercase ${
                          errors.customDesa ? "border-rose-300 focus:border-rose-500" : "border-slate-250 focus:border-indigo-600"
                        }`}
                      />
                      {errors.customDesa && <p className="text-[10px] text-rose-600 font-semibold">{errors.customDesa}</p>}
                      <p className="text-[9px] text-indigo-600 font-medium">
                        Ketik wilayah/desa khusus secara manual jika tidak ada dalam daftar pelanggan di atas.
                      </p>
                    </div>
                  )}
                </div>

                {/* Form Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="flex-1 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition cursor-pointer text-center"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition cursor-pointer text-center shadow-md shadow-indigo-600/10 flex items-center justify-center gap-1"
                  >
                    <Check size={14} />
                    {editingPetugas ? "Simpan" : "Daftarkan"}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <MapPin size={20} />
              </div>
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Batasan Wilayah Kerja Kasir</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                  Setiap petugas kasir diikat pada satu wilayah tugas (Desa/Kelurahan/Kota).
                </p>
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-start gap-2 text-[11px] font-medium text-slate-600">
                    <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>Kasir hanya bisa menerima pembayaran tagihan pelanggan yang memiliki kesamaan kata wilayah tugas pada kolom alamat pelanggan.</span>
                  </div>
                  <div className="flex items-start gap-2 text-[11px] font-medium text-slate-600">
                    <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>Laporan transaksi, tunggakan pelanggan, dan saring pencarian kasir dikunci secara otomatis.</span>
                  </div>
                  <div className="flex items-start gap-2 text-[11px] font-medium text-slate-600">
                    <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>Sistem ini memfasilitasi operasional loket cabang multi-wilayah secara aman, tertib, dan terkendali.</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <button
                  onClick={handleOpenCreate}
                  className="w-full py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-250 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Plus size={14} className="text-indigo-600" />
                  Tambah Petugas Sekarang
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
