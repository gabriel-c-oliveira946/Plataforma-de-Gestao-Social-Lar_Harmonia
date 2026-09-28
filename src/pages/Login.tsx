import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  User,
  Lock,
  Loader2,
  AlertCircle,
  MessageSquare,
  FileText,
  X,
  ShieldAlert,
  Info,
  Sun,
  Moon
} from 'lucide-react';
import { supabase } from '../lib/supabase/client';
import { useTheme } from '../context/ThemeContext';
import {
  resolveEmailFromUsername,
  saveMembroLocal,
  isUsuarioInativo,
  getMensagemDesativacao
} from '../utils/equipe';
import { getUserDisplayName, parseUserRole, getRoleCargo } from '../types/auth';
import LarHarmoniaLogo from '../components/LarHarmoniaLogo';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [detalhesMensagem, setDetalhesMensagem] = useState<string | null>(null);
  const [showDetalhesModal, setShowDetalhesModal] = useState(false);
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setDetalhesMensagem(null);
    setShowDetalhesModal(false);

    const cleanInput = identifier.trim();
    if (!cleanInput) {
      setError('Informe seu e-mail ou nome de usuário.');
      return;
    }

    if (!password) {
      setError('Informe sua senha.');
      return;
    }

    setLoading(true);

    try {
      let targetEmail = cleanInput;

      // 1. Se NÃO contiver '@', consultar Supabase (perfis / registros) para localizar o e-mail
      if (!cleanInput.includes('@')) {
        const resolved = await resolveEmailFromUsername(cleanInput);
        if (!resolved) {
          setError(
            'Nome de usuário não localizado no sistema. Verifique a digitação ou utilize o e-mail completo.'
          );
          setLoading(false);
          return;
        }
        targetEmail = resolved;
      }

      // Verificação prévia de conta desativada (se já constar na lista de inativos)
      if (isUsuarioInativo(targetEmail) || isUsuarioInativo(cleanInput)) {
        const msg =
          getMensagemDesativacao(targetEmail) ||
          getMensagemDesativacao(cleanInput);

        setError('Sua conta foi desativada pela administração. Entre em contato com a diretoria.');
        if (msg && msg.trim()) {
          setDetalhesMensagem(msg.trim());
        }
        setLoading(false);
        return;
      }

      // 2. Realizar autenticação no Supabase Auth com o e-mail identificado
      let { error: signInError } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password
      });

      // Tentativa de fallback para usuário admin caso tente credencial alternativa
      if (
        signInError &&
        !cleanInput.includes('@') &&
        ['admin', 'administrador', 'diretoria'].includes(cleanInput.toLowerCase()) &&
        targetEmail !== 'admin@larharmonia.org'
      ) {
        const altAttempt = await supabase.auth.signInWithPassword({
          email: 'admin@larharmonia.org',
          password
        });
        if (!altAttempt.error) {
          signInError = null;
        }
      }

      if (signInError) {
        // Antes de retornar erro genérico de credenciais, checar se a conta está inativa
        if (isUsuarioInativo(targetEmail) || isUsuarioInativo(cleanInput)) {
          const msg =
            getMensagemDesativacao(targetEmail) ||
            getMensagemDesativacao(cleanInput);
          setError('Sua conta foi desativada pela administração. Entre em contato com a diretoria.');
          if (msg && msg.trim()) {
            setDetalhesMensagem(msg.trim());
          }
          return;
        }

        if (
          signInError.message.toLowerCase().includes('invalid login credentials') ||
          signInError.message.toLowerCase().includes('invalid')
        ) {
          setError('E-mail/usuário ou senha incorretos.');
        } else {
          setError(
            'Não foi possível autenticar no sistema. Verifique suas credenciais e tente novamente.'
          );
        }
        return;
      }

      // 3. Verificação de Segurança: Bloqueio de login para contas desativadas (status === 'inativo')
      const { data: authData } = await supabase.auth.getUser();
      const authenticatedUser = authData?.user;

      if (
        (authenticatedUser && isUsuarioInativo(authenticatedUser)) ||
        isUsuarioInativo(targetEmail) ||
        isUsuarioInativo(cleanInput)
      ) {
        await supabase.auth.signOut();
        const msg =
          (authenticatedUser ? getMensagemDesativacao(authenticatedUser.id) : null) ||
          (authenticatedUser ? getMensagemDesativacao(authenticatedUser.email) : null) ||
          getMensagemDesativacao(targetEmail) ||
          getMensagemDesativacao(cleanInput) ||
          (authenticatedUser?.user_metadata?.mensagem_desativacao as string | undefined) ||
          null;

        setError('Sua conta foi desativada pela administração. Entre em contato com a diretoria.');
        if (msg && msg.trim()) {
          setDetalhesMensagem(msg.trim());
        }
        return;
      }

      // 4. Registro do operador ativo para acelerar consultas futuras por username
      if (authenticatedUser) {
        try {
          saveMembroLocal({
            id: authenticatedUser.id,
            email: authenticatedUser.email,
            nome: getUserDisplayName(authenticatedUser),
            role: parseUserRole(authenticatedUser),
            cargo: getRoleCargo(parseUserRole(authenticatedUser)),
            status: 'ativo',
            ativo: true
          });
        } catch {
          // Ignora falhas de cache local
        }
      }

      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Ocorreu um erro inesperado ao realizar o login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-emerald-50/40 to-teal-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 relative overflow-hidden transition-colors">
      {/* Detalhes sutis decorativos de fundo no tom verde/teal */}
      <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 bg-emerald-200/20 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-80 h-80 bg-teal-200/20 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Botão de Alternância de Tema Flutuante no Topo Direito */}
      <div className="fixed top-4 right-4 z-30">
        <button
          type="button"
          onClick={toggleTheme}
          className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-sm text-slate-700 dark:text-amber-400 hover:bg-emerald-50 dark:hover:bg-slate-700 transition cursor-pointer"
          title={isDark ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
          aria-label={isDark ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-amber-400 animate-in zoom-in-75 duration-200" />
          ) : (
            <Moon className="w-5 h-5 text-blue-600 animate-in zoom-in-75 duration-200" />
          )}
        </button>
      </div>

      {/* Selo e Logo Oficial Lar Harmonia no Canto Inferior Esquerdo */}
      <div className="fixed bottom-3 left-3 sm:bottom-5 sm:left-5 z-20 flex items-center gap-2.5 sm:gap-3 px-3 py-2 sm:px-3.5 sm:py-2.5 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-emerald-100 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md transition">
        <LarHarmoniaLogo size={32} />
        <div className="flex flex-col leading-tight">
          <span className="text-xs font-bold text-gray-900 dark:text-slate-100 tracking-tight">Fundação Lar Harmonia</span>
          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Acompanhamento Social</span>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 w-full max-w-md animate-in fade-in zoom-in-95 relative z-10 transition-colors">
        <div className="text-center mb-6">
          {/* Logo do Lar Harmonia no lugar do ícone genérico */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/60 dark:from-slate-700 dark:to-slate-700/80 border border-emerald-100 dark:border-slate-600 flex items-center justify-center mx-auto mb-3 shadow-xs p-2">
            <LarHarmoniaLogo size={46} />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">
            Fundação Lar Harmonia
          </h1>
          <p className="text-xs text-emerald-700/80 dark:text-emerald-400 font-medium mt-1">
            Acesso ao Sistema de Acompanhamento Social
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Campo Flexível: E-mail OU Nome de Usuário */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-200 mb-1.5">
              E-mail ou Nome de Usuário
            </label>
            <div className="relative">
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Ex: ana ou ana@larharmonia.org"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                disabled={loading}
                className="w-full p-2.5 pl-9 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100 dark:disabled:bg-slate-800 transition"
                required
              />
              <User className="w-4 h-4 text-gray-400 dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Campo: Senha com botão de Mostrar Senha */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-slate-200">Senha</label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                disabled={loading}
                className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition disabled:opacity-50"
                title={showPassword ? 'Ocultar Senha' : 'Mostrar Senha'}
              >
                {showPassword ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Ocultar</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Mostrar Senha</span>
                  </>
                )}
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                autoComplete="current-password"
                disabled={loading}
                className="w-full p-2.5 pl-9 pr-10 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100 dark:disabled:bg-slate-800 transition"
                required
              />
              <Lock className="w-4 h-4 text-gray-400 dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200 transition cursor-pointer"
                title={showPassword ? 'Ocultar Senha' : 'Mostrar Senha'}
                aria-label={showPassword ? 'Ocultar Senha' : 'Mostrar Senha'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Mensagem de Erro / Alerta com Botão de Ver Detalhes se houver recado da administração */}
          {error && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl space-y-2.5 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-red-800 dark:text-red-300 leading-relaxed">
                    {error}
                  </p>
                </div>
              </div>

              {/* Botão de Ver Detalhes se a Administração deixou mensagem */}
              {detalhesMensagem && (
                <div className="pt-2 border-t border-red-200/80 dark:border-red-900/80 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-red-700 dark:text-red-400 font-medium flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
                    <span>Recado da diretoria disponível</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowDetalhesModal(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold rounded-lg shadow-2xs transition cursor-pointer shrink-0"
                    title="Ver detalhes da mensagem da administração"
                  >
                    <FileText className="w-3 h-3" />
                    <span>Ver Detalhes</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Botão Entrar */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 disabled:bg-emerald-400 text-white py-2.5 rounded-lg text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer shadow-emerald-600/20"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Autenticando...</span>
              </>
            ) : (
              <span>Entrar no Sistema</span>
            )}
          </button>
        </form>
      </div>

      {/* Modal de Detalhes da Mensagem da Administração */}
      {showDetalhesModal && detalhesMensagem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-slate-700 space-y-4 animate-in zoom-in-95 text-gray-900 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shadow-inner">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 leading-tight">
                    Comunicado da Administração
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400">
                    Fundação Lar Harmonia • Diretoria
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDetalhesModal(false)}
                className="w-7 h-7 rounded-lg text-gray-400 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center justify-center transition cursor-pointer"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-slate-700/60 border border-gray-200/80 dark:border-slate-600 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950/70 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-800">
                  Conta Desativada
                </span>
                <span className="text-[11px] text-gray-400 dark:text-slate-400">Recado da Diretoria</span>
              </div>
              <p className="text-xs text-gray-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap pt-1 font-medium">
                {detalhesMensagem}
              </p>
            </div>

            <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800 rounded-xl text-[11px] text-emerald-900 dark:text-emerald-200 leading-relaxed space-y-1">
              <p className="font-semibold text-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Orientações Gerais</span>
              </p>
              <p className="text-emerald-800 dark:text-emerald-300">
                Caso tenha dúvidas sobre seus acessos ou encerramento de atividades, entre em contato diretamente com a diretoria da Fundação Lar Harmonia.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowDetalhesModal(false)}
                className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Fechar Comunicado
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

