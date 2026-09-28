import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard,
  LogOut,
  Shield,
  UserCheck,
  User,
  Users,
  Sun,
  Moon,
  Menu,
  X,
  Plus
} from 'lucide-react';
import { getRoleBadgeClasses } from '../types/auth';
import EquipeModal from './EquipeModal';
import LarHarmoniaLogo from './LarHarmoniaLogo';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, displayName, roleShortLabel } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [isEquipeOpen, setIsEquipeOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    setIsMobileMenuOpen(false);
    await supabase.auth.signOut();
    navigate('/login');
  };

  const isDashboardActive =
    location.pathname === '/dashboard' || location.pathname === '/';
  const isCadastrarActive = location.pathname === '/cadastrar';

  const badgeStyle = getRoleBadgeClasses(role) || {
    badge: 'bg-sky-100 text-sky-900 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
    dot: 'bg-sky-600 dark:bg-sky-400',
    border: 'border-sky-300 dark:border-sky-700'
  };

  const renderRoleIcon = () => {
    switch (role) {
      case 'admin':
        return <Shield className="w-3.5 h-3.5 text-purple-700 dark:text-purple-400" />;
      case 'servico_social':
        return <UserCheck className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />;
      case 'recepcao':
      default:
        return <User className="w-3.5 h-3.5 text-sky-700 dark:text-sky-400" />;
    }
  };

  return (
    <>
      <header className="no-print sticky top-0 z-40 bg-white dark:bg-slate-800/95 backdrop-blur-md border-b border-gray-200 dark:border-slate-700 shadow-xs transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Lado Esquerdo: Logotipo / Nome e Menu de Navegação Desktop */}
            <div className="flex items-center gap-4 sm:gap-8">
              <Link
                to="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2.5 text-gray-900 dark:text-slate-100 group"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-700 dark:to-slate-800 border border-emerald-100 dark:border-slate-700 flex items-center justify-center shadow-xs group-hover:border-emerald-300 dark:group-hover:border-emerald-500 transition-colors p-1">
                  <LarHarmoniaLogo size={26} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm sm:text-lg leading-tight text-gray-900 dark:text-slate-100">
                    Lar Harmonia
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold tracking-wide uppercase">
                    Gestão Social
                  </span>
                </div>
              </Link>

              {/* Menu de Navegação Principal Desktop */}
              <nav className="hidden md:flex items-center gap-2">
                <Link
                  to="/dashboard"
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isDashboardActive
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 shadow-xs font-semibold border border-emerald-100/60 dark:border-emerald-800/50'
                      : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700/60'
                  }`}
                >
                  <LayoutDashboard
                    className={`w-4 h-4 ${
                      isDashboardActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-slate-400'
                    }`}
                  />
                  Início / Dashboard
                </Link>

                <Link
                  to="/cadastrar"
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isCadastrarActive
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 shadow-xs font-semibold border border-emerald-100/60 dark:border-emerald-800/50'
                      : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700/60'
                  }`}
                >
                  <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Novo Cadastro</span>
                </Link>

                {/* Botão Equipe */}
                <button
                  type="button"
                  onClick={() => setIsEquipeOpen(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700/60 transition-all cursor-pointer"
                  title="Visualizar equipe e papéis de acesso"
                >
                  <Users className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                  <span>Equipe</span>
                </button>
              </nav>
            </div>

            {/* Lado Direito Desktop: Alternância de Tema, Perfil do Operador e Logout */}
            <div className="hidden md:flex items-center gap-2 sm:gap-3">
              {/* Botão de Alternância de Modo Escuro / Claro */}
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-gray-600 dark:text-amber-400 hover:bg-emerald-50 dark:hover:bg-slate-700/80 hover:text-emerald-700 dark:hover:text-amber-300 border border-gray-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs"
                title={isDark ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
                aria-label={isDark ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
              >
                {isDark ? (
                  <Sun className="w-5 h-5 text-amber-400 animate-in zoom-in-75 duration-200" />
                ) : (
                  <Moon className="w-5 h-5 text-blue-600 animate-in zoom-in-75 duration-200" />
                )}
              </button>

              {user && (
                <>
                  {/* Badge Colorida do Operador: Nome • Cargo/Perfil */}
                  <div
                    onClick={() => setIsEquipeOpen(true)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer hover:shadow-xs ${badgeStyle?.badge || 'bg-sky-100 text-sky-900 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800'}`}
                    title="Clique para ver os detalhes da equipe e perfis de acesso"
                  >
                    {renderRoleIcon()}
                    <span className="truncate max-w-[140px] sm:max-w-[240px]">
                      {displayName} • {roleShortLabel}
                    </span>
                  </div>

                  {/* Botão Logout (Sair) */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-600 dark:text-slate-300 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800/50 cursor-pointer"
                    title="Encerrar sessão"
                  >
                    <LogOut className="w-4 h-4 text-gray-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400" />
                    <span className="hidden sm:inline">Sair</span>
                  </button>
                </>
              )}
            </div>

            {/* Lado Direito Mobile: Botão de Tema Rápido + Botão Hambúrguer */}
            <div className="flex md:hidden items-center gap-1.5">
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-gray-600 dark:text-amber-400 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 transition cursor-pointer"
                title={isDark ? 'Modo Claro' : 'Modo Escuro'}
                aria-label={isDark ? 'Modo Claro' : 'Modo Escuro'}
              >
                {isDark ? (
                  <Sun className="w-4.5 h-4.5 text-amber-400" />
                ) : (
                  <Moon className="w-4.5 h-4.5 text-blue-600" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 transition cursor-pointer"
                aria-label={isMobileMenuOpen ? 'Fechar menu' : 'Abrir menu de navegação'}
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 text-gray-800 dark:text-white" />
                ) : (
                  <Menu className="w-5 h-5 text-gray-800 dark:text-white" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Menu Retrátil Mobile (< md:) */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-slate-700 bg-white/98 dark:bg-slate-800/98 backdrop-blur-md px-4 pt-3 pb-5 space-y-3 shadow-lg animate-in slide-in-from-top-2 duration-200">
            {/* Card do Operador Logado no Mobile */}
            {user && (
              <div
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsEquipeOpen(true);
                }}
                className="p-3 bg-gray-50 dark:bg-slate-700/60 rounded-xl border border-gray-200 dark:border-slate-600 flex items-center justify-between cursor-pointer hover:bg-emerald-50/50 dark:hover:bg-slate-700 transition"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                      {displayName}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-slate-300 flex items-center gap-1">
                      {renderRoleIcon()}
                      <span>{roleShortLabel}</span>
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                  Ver Perfil
                </span>
              </div>
            )}

            {/* Links de Navegação Mobile */}
            <div className="space-y-1">
              <Link
                to="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                  isDashboardActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Início / Painel Geral</span>
              </Link>

              <Link
                to="/cadastrar"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                  isCadastrarActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
              >
                <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Cadastrar Novo Assistido</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsEquipeOpen(true);
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition text-left cursor-pointer"
              >
                <Users className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                <span>Equipe & Níveis de Acesso</span>
              </button>
            </div>

            {/* Alternância de Tema e Logout no Mobile */}
            <div className="pt-2 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 dark:bg-slate-700/80 rounded-xl text-xs font-semibold text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-600 transition"
              >
                {isDark ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span>Modo Claro</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-blue-600" />
                    <span>Modo Escuro</span>
                  </>
                )}
              </button>

              {user && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-700 dark:text-red-400 rounded-xl text-xs font-bold border border-red-200 dark:border-red-900/60 transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sair</span>
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Modal de Gestão da Equipe */}
      <EquipeModal isOpen={isEquipeOpen} onClose={() => setIsEquipeOpen(false)} />
    </>
  );
}
