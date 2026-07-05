import React, { useState } from "react";

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
};

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "admin@padi.com" && password === "hello@Padi123") {
      setError("");
      onLoginSuccess();
      onClose();
    } else {
      setError("Username atau password salah!");
    }
  };

  return (
    <div className="fixed inset-0 z-1000 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-[420px] rounded-3xl border border-emerald-900/10 bg-white p-6 shadow-xl relative animate-scale-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100"
        >
          ✕
        </button>

        <div className="mb-6 flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-green-700 text-white flex items-center justify-center font-black mb-3 shadow shadow-emerald-700/25">
            SJ
          </div>
          <h2 className="text-xl font-bold text-slate-800">Login Administrator</h2>
          <p className="text-[12.5px] text-slate-500 text-center mt-1">
            Silakan masuk untuk melakukan sinkronisasi data cuaca BMKG dan mengupdate fitur model.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
              Username
            </label>
            <input
              type="email"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin@padi.com"
              className="w-full text-[13.5px] border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 bg-white transition-all text-slate-800"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-[13.5px] border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 bg-white transition-all text-slate-800"
            />
          </div>

          {error && (
            <div className="text-[12.5px] text-rose-600 bg-rose-50 border border-rose-100 px-3 py-2 rounded-xl text-center font-medium animate-pulse">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-[13.5px] font-semibold shadow-sm hover:shadow transition-all mt-6"
          >
            Masuk
          </button>
        </form>
      </div>
    </div>
  );
};
