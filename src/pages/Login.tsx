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
import logoLarHarmonia from '../assets/images/regenerated_image_1790687724025.png';

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

      // Verificação prévia na tabela 'profiles' do Supabase buscando pelo e-mail antes do login
      try {
        const { data: preProfile } = await supabase
          .from('profiles')
          .select('id, email, status, ativo, cargo, mensagem_desativacao')
          .ilike('email', targetEmail)
          .maybeSingle();

        if (
          preProfile &&
          (preProfile.status === 'inativo' ||
            preProfile.ativo === false ||
            preProfile.cargo === 'Inativo')
        ) {
          await supabase.auth.signOut();
          setError('Sua conta foi desativada pela administração. Entre em contato com a diretoria.');
          const customMsg =
            preProfile.mensagem_desativacao ||
            getMensagemDesativacao(targetEmail) ||
            getMensagemDesativacao(cleanInput);
          if (customMsg && customMsg.trim()) {
            setDetalhesMensagem(customMsg.trim());
          }
          setLoading(false);
          return;
        }
      } catch (preErr) {
        console.warn('Verificação prévia de profiles em Login:', preErr);
      }

      // Verificação prévia de conta desativada (se constar na lista persistente)
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
        // Antes de retornar erro genérico de credenciais, checar se a conta está desativada no Supabase
        try {
          const { data: checkProf } = await supabase
            .from('profiles')
            .select('id, email, status, ativo, cargo, mensagem_desativacao')
            .ilike('email', targetEmail)
            .maybeSingle();

          if (
            checkProf &&
            (checkProf.status === 'inativo' ||
              checkProf.ativo === false ||
              checkProf.cargo === 'Inativo')
          ) {
            await supabase.auth.signOut();
            setError('Sua conta foi desativada pela administração. Entre em contato com a diretoria.');
            const msg =
              checkProf.mensagem_desativacao ||
              getMensagemDesativacao(targetEmail) ||
              getMensagemDesativacao(cleanInput);
            if (msg && msg.trim()) {
              setDetalhesMensagem(msg.trim());
            }
            setLoading(false);
            return;
          }
        } catch {}

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
        setLoading(false);
        return;
      }

      // 3. LEITURA OBRIGATÓRIA NO LOGIN:
      // Consulta a tabela 'profiles' no Supabase buscando pelo e-mail ou ID do usuário
      const { data: authData } = await supabase.auth.getUser();
      const authenticatedUser = authData?.user;

      if (!authenticatedUser) {
        setError('Não foi possível carregar a sessão autenticada.');
        setLoading(false);
        return;
      }

      let profileData: any = null;
      try {
        // Busca direta pelo ID na tabela 'profiles'
        const { data: byId, error: errById } = await supabase
          .from('profiles')
          .select('id, email, status, ativo, cargo, role, nome, mensagem_desativacao')
          .eq('id', authenticatedUser.id)
          .maybeSingle();

        if (!errById && byId) {
          profileData = byId;
        } else if (authenticatedUser.email) {
          // Busca secundária por e-mail na tabela 'profiles'
          const { data: byEmail } = await supabase
            .from('profiles')
            .select('id, email, status, ativo, cargo, role, nome, mensagem_desativacao')
            .ilike('email', authenticatedUser.email)
            .maybeSingle();
          profileData = byEmail;
        }
      } catch (queryErr) {
        console.warn('Erro ao consultar tabela profiles no login:', queryErr);
      }

      // Se o perfil no Supabase retornar status === 'inativo' ou ativo === false
      const isAccountInactive =
        profileData?.status === 'inativo' ||
        profileData?.ativo === false ||
        profileData?.cargo === 'Inativo' ||
        isUsuarioInativo(authenticatedUser) ||
        isUsuarioInativo(targetEmail) ||
        isUsuarioInativo(cleanInput);

      if (isAccountInactive) {
        // a) Realize o logout imediato:
        await supabase.auth.signOut();

        // b) Exiba a mensagem genérica em destaque vermelho na tela de Login:
        setError('Sua conta foi desativada pela administração. Entre em contato com a diretoria.');

        // c) Se houver uma mensagem_desativacao cadastrada na tabela 'profiles', exiba essa mensagem personalizada:
        const customMsg =
          profileData?.mensagem_desativacao ||
          (authenticatedUser ? getMensagemDesativacao(authenticatedUser.id) : null) ||
          (authenticatedUser ? getMensagemDesativacao(authenticatedUser.email) : null) ||
          getMensagemDesativacao(targetEmail) ||
          getMensagemDesativacao(cleanInput) ||
          (authenticatedUser?.user_metadata?.mensagem_desativacao as string | undefined) ||
          null;

        if (customMsg && customMsg.trim()) {
          setDetalhesMensagem(customMsg.trim());
        }

        // d) Não limpe os avisos da tela nem ignore a mensagem.
        setLoading(false);
        return;
      }

      // 4. Registro do operador ativo para acelerar consultas futuras por username
      try {
        saveMembroLocal({
          id: authenticatedUser.id,
          email: authenticatedUser.email,
          nome: profileData?.nome || getUserDisplayName(authenticatedUser),
          role: profileData?.role || parseUserRole(authenticatedUser),
          cargo: profileData?.cargo || getRoleCargo(parseUserRole(authenticatedUser)),
          status: 'ativo',
          ativo: true
        });
      } catch {
        // Ignora falhas de cache local
      }

      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Ocorreu um erro inesperado ao realizar o login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 relative transition-colors">
      {/* Botão de Alternância de Tema Flutuante no Topo Direito */}
      <div className="fixed top-4 right-4 z-30">
        <button
          type="button"
          onClick={toggleTheme}
          className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs text-slate-700 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
          title={isDark ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
          aria-label={isDark ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400 animate-in zoom-in-75 duration-200" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700 animate-in zoom-in-75 duration-200" />
          )}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 p-8 shadow-xl border border-slate-200/80 dark:border-slate-700/80 rounded-2xl w-full max-w-[440px] animate-in fade-in zoom-in-95 relative z-10 transition-colors">
        <div className="text-center mb-6">
          {/* Imagem Oficial da Fundação Lar Harmonia */}
          <div className="flex justify-center items-center mb-2">
            <img
              src={logoLarHarmonia}
              alt="Fundação Lar Harmonia"
              className="w-[300px] h-[160px] object-contain transition-transform duration-200 hover:scale-102 dark:brightness-110 dark:contrast-110"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.includes('logo_inicio-removebg-preview.png')) {
                  target.src = '/logo_inicio-removebg-preview.png';
                }
              }}
              referrerPolicy="no-referrer"
            />
          </div>
          <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 tracking-wide font-heading uppercase text-center -mt-6">
            Acesso ao Sistema de Acompanhamento Social
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Campo Flexível: E-mail OU Nome de Usuário */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
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
                className="w-full py-2 pl-9 pr-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 disabled:bg-slate-100 dark:disabled:bg-slate-800 transition"
                required
              />
              <User className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Campo: Senha com botão de Mostrar Senha */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">Senha</label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                disabled={loading}
                className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition disabled:opacity-50"
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
                className="w-full py-2 pl-9 pr-10 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 disabled:bg-slate-100 dark:disabled:bg-slate-800 transition"
                required
              />
              <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition cursor-pointer"
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

          {/* Mensagem de Erro / Alerta em Destaque Vermelho com Recado Personalizado no Card */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950/50 border-2 border-red-300 dark:border-red-800 rounded-xl space-y-3 animate-in fade-in shadow-xs">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-bold text-red-900 dark:text-red-200 leading-snug">
                    {error}
                  </p>
                </div>
              </div>

              {/* Card de Mensagem Personalizada de Desativação */}
              {detalhesMensagem && (
                <div className="p-3 bg-white dark:bg-slate-900/90 border border-red-200 dark:border-red-800 rounded-lg space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-red-700 dark:text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
                      <span>Mensagem da Administração / Diretoria:</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowDetalhesModal(true)}
                      className="text-[10px] text-red-600 dark:text-red-400 hover:underline font-bold cursor-pointer"
                      title="Ver comunicado completo"
                    >
                      Expandir
                    </button>
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium whitespace-pre-wrap pl-0.5">
                    "{detalhesMensagem}"
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Botão Entrar */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-600 disabled:bg-emerald-400 text-white py-2.5 px-4 rounded-lg text-sm font-semibold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer mt-6"
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
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 animate-in zoom-in-95 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shadow-inner">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight font-heading">
                    Comunicado da Administração
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Fundação Lar Harmonia • Diretoria
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDetalhesModal(false)}
                className="w-7 h-7 rounded-lg text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition cursor-pointer"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-700/60 border border-slate-200/80 dark:border-slate-600 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950/70 px-2 py-0.5 rounded-md border border-red-200 dark:border-red-800">
                  Conta Desativada
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-400">Recado da Diretoria</span>
              </div>
              <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap pt-1 font-medium">
                {detalhesMensagem}
              </p>
            </div>

            <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800 rounded-lg text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed space-y-1">
              <p className="font-semibold text-emerald-950 dark:text-emerald-300 flex items-center gap-1 font-heading">
                <Info className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
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
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-lg text-xs font-semibold transition shadow-xs cursor-pointer"
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

