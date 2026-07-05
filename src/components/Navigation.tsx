import { MapPin, Menu, X } from "lucide-react";
import { useState } from "react";

interface NavigationProps {
  currentPage: "home" | "peta" | "admin" | "guest";
  onNavigate: (page: "home" | "peta" | "admin" | "guest") => void;
  isAuthenticated: boolean;
  onAuthModalOpen: () => void;
  onLogout: () => void;
}

export function Navigation({
  currentPage,
  onNavigate,
  isAuthenticated,
  onAuthModalOpen,
  onLogout,
}: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (page: string) => currentPage === page;

  return (
    <header className="sticky top-0 z-[900] backdrop-blur bg-white/90 border-b border-emerald-100/50 shadow-sm">
      <div className="max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-10 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => onNavigate("home")}
          >
            <div className="relative w-12 h-12 shrink-0">
              <div
                className="absolute inset-0 rounded-[14px] bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg rotate-[-4deg]"
              />
              <div
                className="absolute inset-0 rounded-[14px] flex items-center justify-center text-white font-bold text-lg"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                SJ
              </div>
            </div>
            <div>
              <div
                className="text-lg sm:text-xl font-bold text-emerald-700 tracking-tight"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                SiPanen <span className="text-amber-500">·</span> Jember
              </div>
              <div className="text-xs text-slate-500">Harvest AI</div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => onNavigate("home")}
              className={`text-sm font-medium transition-colors ${
                isActive("home")
                  ? "text-emerald-700"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Home
            </button>
            <button
              onClick={() => onNavigate("peta")}
              className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${
                isActive("peta")
                  ? "text-emerald-700"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <MapPin className="w-4 h-4" />
              Peta
            </button>

            <div className="w-px h-5 bg-slate-200" />

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate("admin")}
                  className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-all shadow-sm"
                >
                  Admin
                </button>
                <button
                  onClick={() => {
                    onLogout();
                    onNavigate("home");
                  }}
                  className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold transition-all"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={onAuthModalOpen}
                className="px-4 py-2 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-sm font-semibold transition-all border border-emerald-300"
              >
                Login
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-3 border-t border-slate-200 pt-4">
            <button
              onClick={() => {
                onNavigate("home");
                setIsMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-2 rounded-lg font-medium transition-colors ${
                isActive("home")
                  ? "bg-emerald-100 text-emerald-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Home
            </button>
            <button
              onClick={() => {
                onNavigate("peta");
                setIsMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                isActive("peta")
                  ? "bg-emerald-100 text-emerald-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <MapPin className="w-4 h-4" />
              Peta
            </button>
            <div className="border-t border-slate-200 pt-3 mt-3">
              {isAuthenticated ? (
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      onNavigate("admin");
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-all"
                  >
                    Admin Dashboard
                  </button>
                  <button
                    onClick={() => {
                      onLogout();
                      onNavigate("home");
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold transition-all"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    onAuthModalOpen();
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-sm font-semibold transition-all border border-emerald-300"
                >
                  Login Admin
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
