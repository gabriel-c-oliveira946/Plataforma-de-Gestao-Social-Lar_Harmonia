import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Shield,
  UserCheck,
  User,
  Search,
  RotateCcw,
  Loader2,
  Lock,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  X,
  MessageSquare
} from 'lucide-react';
import { supabase } from '../lib/supabase/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  UserProfile,
  UserRole,
  getRoleBadgeClasses,
  getRoleCargo,
  mapCargoToEnumRole,
  mapRoleToCargoFormatado
} from '../types/auth';
import {
  getEquipeList,
  cadastrarNovoMembroSupabase,
  atualizarCargoMembro,
  desativarMembroEquipe,
  reativarMembroEquipe,
  limparCacheBloqueioLocal
} from '../utils/equipe';

export default function GerenciarEquipe() {
  const navigate = useNavigate();
  const { user, role: currentRole } = useAuth();
  const toast = useToast();

  const [equipe, setEquipe] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativos' | 'inativos'>('todos');
  const [roleFilter, setRoleFilter] = useState<string>('todos');

  // Estados de ações
  const [reactivatingId, setReactivatingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal de Novo Membro
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoEmail, setNovoEmail] = useState('');
  const [novoSenha, setNovoSenha] = useState('');
  const [novoRole, setNovoRole] = useState<UserRole>('servico_social');
  const [submittingNovo, setSubmittingNovo] = useState(false);

  // Modal de Alteração de Cargo
  const [editingMembro, setEditingMembro] = useState<UserProfile | null>(null);
  const [selectedRoleToEdit, setSelectedRoleToEdit] = useState<UserRole>('servico_social');
  const [savingCargo, setSavingCargo] = useState(false);

  // Modal de Desativação
  const [deactivatingMembro, setDeactivatingMembro] = useState<UserProfile | null>(null);
  const [mensagemDesativacao, setMensagemDesativacao] = useState('');
  const [deactivatingLoading, setDeactivatingLoading] = useState(false);

  const isAdmin = currentRole === 'admin';

  const loadEquipe = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      // Consulta tabela profiles do Supabase
      const { data: profiles, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .order('nome', { ascending: true });

      if (!profileErr && profiles && profiles.length > 0) {
        const mapped: UserProfile[] = profiles.map((p) => {
          const isInactive =
            p.status === 'inativo' || p.ativo === false || p.cargo === 'Inativo';
          const r: UserRole =
            p.role === 'admin'
              ? 'admin'
              : p.role === 'recepcao'
              ? 'recepcao'
              : p.role === 'servico_social'
              ? 'servico_social'
              : p.cargo?.toLowerCase().includes('admin') || p.cargo?.toLowerCase().includes('diretor')
              ? 'admin'
              : p.cargo?.toLowerCase().includes('recep')
              ? 'recepcao'
              : 'servico_social';

          return {
            id: p.id,
            nome: p.nome || 'Operador Social',
            email: p.email || '',
            role: r,
            cargo:
              p.cargo && p.cargo !== 'Inativo'
                ? p.cargo
                : r === 'admin'
                ? 'Admin'
                : getRoleCargo(r),
            status: isInactive ? 'inativo' : 'ativo',
            ativo: !isInactive,
            mensagem_desativacao: p.mensagem_desativacao || undefined
          };
        });

        // Garante usuário da sessão atual se não estiver listado
        if (
          user &&
          !mapped.some(
            (m) =>
              m.id === user.id ||
              (m.email && user.email && m.email.toLowerCase() === user.email.toLowerCase())
          )
        ) {
          const uRole = currentRole || 'admin';
          mapped.unshift({
            id: user.id,
            email: user.email || '',
            nome: user.user_metadata?.nome || user.email?.split('@')[0] || 'Você (Sessão Atual)',
            role: uRole,
            cargo: getRoleCargo(uRole),
            status: 'ativo',
            ativo: true
          });
        }

        setEquipe(mapped);
      } else {
        const fallback = await getEquipeList(user, true);
        setEquipe(fallback);
      }
    } catch (err: any) {
      console.warn('Erro ao carregar equipe, usando fallback:', err);
      const fallback = await getEquipeList(user, true);
      setEquipe(fallback);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEquipe();
  }, []);

  /**
   * REATIVAÇÃO DE USUÁRIOS DESATIVADOS:
   * a) Ao clicar em "Reativar Acesso", execute o UPDATE na tabela profiles no Supabase
   *    definindo status = 'ativo', ativo = true e mensagem_desativacao = NULL.
   * b) LIMPEZA DO LOCALSTORAGE: Remova obrigatoriamente o e-mail, ID e username do usuário
   *    de TODAS as chaves de cache/bloqueio local (ex: membros_inativos, desativados, etc.).
   * c) Atualize imediatamente o estado visual da lista na tela para que o status mude para
   *    'Ativo' (com o selo verde) sem precisar dar F5 na página.
   */
  const handleReativar = async (membro: UserProfile) => {
    if (!isAdmin) {
      setErrorMsg('Apenas o perfil Administrador pode reativar membros da equipe.');
      return;
    }

    setReactivatingId(membro.id);
    setErrorMsg(null);

    const chaveEnumRestaurada = mapCargoToEnumRole(membro.role);
    const restoredCargo = mapRoleToCargoFormatado(membro.role || membro.cargo);

    // c) Atualização IMEDIATA do estado visual da lista na tela para 'Ativo' (selo verde)
    setEquipe((prev) =>
      prev.map((item) =>
        item.id === membro.id ||
        (membro.email && item.email?.toLowerCase() === membro.email.toLowerCase())
          ? {
              ...item,
              status: 'ativo' as const,
              ativo: true,
              role: chaveEnumRestaurada,
              cargo: restoredCargo,
              mensagem_desativacao: undefined,
              data_desativacao: undefined
            }
          : item
      )
    );

    try {
      // b) LIMPEZA DO LOCALSTORAGE: Remove obrigatoriamente das chaves de cache/bloqueio
      limparCacheBloqueioLocal(membro.id, membro.email, membro.nome);

      // a) UPDATE na tabela profiles no Supabase definindo:
      // status = 'ativo', ativo = true e mensagem_desativacao = NULL
      let { error: profileError } = await supabase
        .from('profiles')
        .update({
          status: 'ativo',
          ativo: true,
          mensagem_desativacao: null,
          cargo: restoredCargo,
          role: chaveEnumRestaurada
        })
        .eq('id', membro.id);

      // Tratamentos resilientes de compatibilidade com variações de colunas
      if (
        profileError &&
        (profileError.message?.includes('mensagem_desativacao') ||
          profileError.message?.includes('column'))
      ) {
        const retry1 = await supabase
          .from('profiles')
          .update({
            status: 'ativo',
            ativo: true,
            cargo: restoredCargo,
            role: chaveEnumRestaurada
          })
          .eq('id', membro.id);
        profileError = retry1.error;
      }

      if (profileError && profileError.message?.includes('ativo')) {
        const retry2 = await supabase
          .from('profiles')
          .update({
            status: 'ativo',
            cargo: restoredCargo,
            role: chaveEnumRestaurada
          })
          .eq('id', membro.id);
        profileError = retry2.error;
      }

      if (profileError && profileError.message?.includes('status')) {
        await supabase
          .from('profiles')
          .update({
            cargo: restoredCargo,
            role: chaveEnumRestaurada
          })
          .eq('id', membro.id);
      }

      if (membro.email) {
        try {
          await supabase
            .from('profiles')
            .update({
              status: 'ativo',
              ativo: true,
              mensagem_desativacao: null,
              cargo: restoredCargo,
              role: chaveEnumRestaurada
            })
            .ilike('email', membro.email);
        } catch {}
      }

      const res = await reativarMembroEquipe(membro.id, membro.email, membro.nome);
      if (!res.success && profileError) {
        setErrorMsg(res.error || 'Não foi possível reativar o acesso do operador.');
        return;
      }

      const successText = `Acesso de ${membro.nome} reativado com sucesso! Usuário agora está Ativo.`;
      setSuccessMsg(successText);
      toast.success('Acesso Reativado', successText);

      // Sincronização em background para manter consistência sem perda do estado visual
      await loadEquipe();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      const msg = err?.message || 'Falha ao reativar o membro da equipe.';
      setErrorMsg(msg);
      toast.error('Erro ao reativar', msg);
    } finally {
      setReactivatingId(null);
    }
  };

  // Cadastrar Novo Membro
  const handleCadastrarMembro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setErrorMsg('Apenas administradores podem cadastrar novos membros.');
      return;
    }

    const trimmedNome = novoNome.trim();
    const trimmedEmail = novoEmail.trim();
    const trimmedSenha = novoSenha.trim();

    if (!trimmedNome || !trimmedEmail || !trimmedSenha) {
      setErrorMsg('Preencha Nome, E-mail e Senha Inicial.');
      return;
    }

    if (trimmedSenha.length < 6) {
      setErrorMsg('A senha inicial deve possuir no mínimo 6 caracteres.');
      return;
    }

    setSubmittingNovo(true);
    setErrorMsg(null);

    const cargoFmt =
      novoRole === 'admin'
        ? 'Admin'
        : novoRole === 'servico_social'
        ? 'Serviço Social'
        : 'Recepção';

    try {
      const res = await cadastrarNovoMembroSupabase({
        nome: trimmedNome,
        email: trimmedEmail,
        password: trimmedSenha,
        cargo: cargoFmt,
        role: novoRole
      });

      if (res.error) {
        setErrorMsg(res.error);
        return;
      }

      try {
        await supabase.from('profiles').upsert([
          {
            id: res.user?.id || `user-${Date.now()}`,
            nome: trimmedNome,
            email: trimmedEmail,
            role: novoRole,
            cargo: cargoFmt,
            status: 'ativo',
            ativo: true
          }
        ]);
      } catch {}

      toast.success('Membro cadastrado', `${trimmedNome} foi adicionado à equipe.`);
      setSuccessMsg(`Membro ${trimmedNome} cadastrado com sucesso!`);
      setNovoNome('');
      setNovoEmail('');
      setNovoSenha('');
      setIsAddModalOpen(false);
      await loadEquipe();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao cadastrar operador.');
    } finally {
      setSubmittingNovo(false);
    }
  };

  // Alterar Cargo
  const handleSalvarCargo = async () => {
    if (!editingMembro || !isAdmin) return;
    setSavingCargo(true);
    setErrorMsg(null);

    try {
      const cargoFmt =
        selectedRoleToEdit === 'admin'
          ? 'Admin'
          : selectedRoleToEdit === 'servico_social'
          ? 'Serviço Social'
          : 'Recepção';

      const res = await atualizarCargoMembro({
        id: editingMembro.id,
        email: editingMembro.email,
        role: selectedRoleToEdit,
        cargo: cargoFmt
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Não foi possível atualizar o cargo.');
        return;
      }

      toast.success('Cargo atualizado', `Cargo de ${editingMembro.nome} alterado para ${cargoFmt}.`);
      setEditingMembro(null);
      await loadEquipe();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao salvar novo cargo.');
    } finally {
      setSavingCargo(false);
    }
  };

  // Desativar Membro
  const handleConfirmDesativar = async () => {
    if (!deactivatingMembro || !isAdmin) return;
    setDeactivatingLoading(true);
    setErrorMsg(null);

    try {
      const res = await desativarMembroEquipe(
        deactivatingMembro.id,
        deactivatingMembro.email,
        mensagemDesativacao.trim()
      );

      if (!res.success) {
        setErrorMsg(res.error || 'Falha ao desativar membro.');
        return;
      }

      toast.success('Acesso desativado', `O acesso de ${deactivatingMembro.nome} foi desativado.`);
      setDeactivatingMembro(null);
      setMensagemDesativacao('');
      await loadEquipe();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao desativar acesso.');
    } finally {
      setDeactivatingLoading(false);
    }
  };

  // Filtragem
  const filteredEquipe = equipe.filter((m) => {
    const isInactive = m.status === 'inativo' || m.ativo === false;
    if (statusFilter === 'ativos' && isInactive) return false;
    if (statusFilter === 'inativos' && !isInactive) return false;

    if (roleFilter !== 'todos' && m.role !== roleFilter) return false;

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      const matchNome = m.nome?.toLowerCase().includes(search);
      const matchEmail = m.email?.toLowerCase().includes(search);
      const matchCargo = m.cargo?.toLowerCase().includes(search);
      if (!matchNome && !matchEmail && !matchCargo) return false;
    }

    return true;
  });

  const totalAtivos = equipe.filter((m) => m.status !== 'inativo' && m.ativo !== false).length;
  const totalInativos = equipe.filter((m) => m.status === 'inativo' || m.ativo === false).length;
  const totalAdmins = equipe.filter((m) => m.role === 'admin').length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors pb-12">
      {/* Barra de Topo / Breadcrumb */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition cursor-pointer"
                title="Voltar ao Painel Geral"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center shadow-xs">
                    <Users className="w-4 h-4" />
                  </div>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-heading">
                    Gestão da Equipe & Níveis de Acesso
                  </h1>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Administração de operadores, papéis e status de acesso no sistema Lar Harmonia
                </p>
              </div>
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer self-start sm:self-auto"
              >
                <UserPlus className="w-4 h-4" />
                <span>Novo Operador</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Mensagens de Feedback */}
        {errorMsg && (
          <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-bold text-red-900 dark:text-red-200">{errorMsg}</p>
            </div>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="text-red-600 hover:text-red-800 dark:text-red-400 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-start gap-3 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">{successMsg}</p>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMsg(null)}
              className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Cards de Resumo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Total Membros
            </span>
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-heading mt-1 block">
              {equipe.length}
            </span>
          </div>

          <div className="p-4 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-900/60 rounded-xl shadow-2xs">
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
              Operadores Ativos
            </span>
            <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 font-heading mt-1 block">
              {totalAtivos}
            </span>
          </div>

          <div className="p-4 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/60 rounded-xl shadow-2xs">
            <span className="text-[11px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider block">
              Contas Inativas
            </span>
            <span className="text-2xl font-bold text-red-600 dark:text-red-400 font-heading mt-1 block">
              {totalInativos}
            </span>
          </div>

          <div className="p-4 bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-900/60 rounded-xl shadow-2xs">
            <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wider block">
              Administradores
            </span>
            <span className="text-2xl font-bold text-purple-700 dark:text-purple-400 font-heading mt-1 block">
              {totalAdmins}
            </span>
          </div>
        </div>

        {/* Barra de Filtros e Busca */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Campo de Busca */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, e-mail ou cargo..."
              className="w-full py-2 pl-9 pr-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition"
            />
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* Abas de Status e Filtro de Cargo */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-900 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setStatusFilter('todos')}
                className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                  statusFilter === 'todos'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Todos ({equipe.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('ativos')}
                className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                  statusFilter === 'ativos'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
                }`}
              >
                Ativos ({totalAtivos})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('inativos')}
                className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                  statusFilter === 'inativos'
                    ? 'bg-red-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-red-600'
                }`}
              >
                Inativos ({totalInativos})
              </button>
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="py-1.5 px-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value="todos">Todos os Cargos</option>
              <option value="admin">Administrador</option>
              <option value="servico_social">Serviço Social</option>
              <option value="recepcao">Recepção</option>
            </select>
          </div>
        </div>

        {/* Lista de Membros */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-700 dark:text-emerald-400 mx-auto mb-3" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Carregando membros da equipe...
              </p>
            </div>
          ) : filteredEquipe.length === 0 ? (
            <div className="py-16 text-center px-4">
              <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                Nenhum membro encontrado
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tente ajustar a busca ou os filtros de status e cargo.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {filteredEquipe.map((membro) => {
                const isInactive = membro.status === 'inativo' || membro.ativo === false;
                const isCurrentUser = user && (membro.id === user.id || membro.email === user.email);
                const isAnotherAdmin = !isCurrentUser && membro.role === 'admin';
                const badge = getRoleBadgeClasses(membro.role);

                return (
                  <div
                    key={membro.id}
                    className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                      isInactive
                        ? 'bg-red-50/30 dark:bg-red-950/20'
                        : 'hover:bg-slate-50/80 dark:hover:bg-slate-700/30'
                    }`}
                  >
                    {/* Dados do Membro */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border shadow-2xs ${
                          isInactive
                            ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800'
                            : membro.role === 'admin'
                            ? 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800'
                            : membro.role === 'servico_social'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                            : 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800'
                        }`}
                      >
                        {membro.role === 'admin' ? (
                          <Shield className="w-5 h-5" />
                        ) : membro.role === 'servico_social' ? (
                          <UserCheck className="w-5 h-5" />
                        ) : (
                          <User className="w-5 h-5" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
                            {membro.nome}
                          </h4>
                          {isCurrentUser && (
                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                              Você (Sessão Atual)
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {membro.email || 'Sem e-mail cadastrado'} • Papel:{' '}
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {membro.cargo}
                          </span>
                        </p>

                        {isInactive && membro.mensagem_desativacao && (
                          <p className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-md px-2 py-0.5 mt-1 inline-block">
                            <span className="font-semibold">Recado da Diretoria:</span> "{membro.mensagem_desativacao}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Selos de Status & Botões de Ação */}
                    <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                      {/* Selo Visual de Status: Verde Vibrante para Ativo e Vermelho para Inativo */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                          isInactive
                            ? 'bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700'
                            : 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 shadow-2xs'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isInactive
                              ? 'bg-red-500 dark:bg-red-400'
                              : 'bg-emerald-500 dark:bg-emerald-400 animate-pulse'
                          }`}
                        />
                        <span>{isInactive ? 'Inativo' : 'Ativo'}</span>
                      </span>

                      {/* Selo do Cargo */}
                      {!isInactive && (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            badge?.badge ||
                            'bg-sky-100 text-sky-900 border-sky-200 dark:bg-sky-900/50 dark:text-sky-200 dark:border-sky-500'
                          }`}
                        >
                          <span>{membro.cargo}</span>
                        </span>
                      )}

                      {/* Ações de Controle */}
                      {isAdmin && (
                        <div className="flex items-center gap-1.5 ml-1">
                          {isInactive ? (
                            /* Botão "Reativar Acesso" */
                            <button
                              type="button"
                              onClick={() => handleReativar(membro)}
                              disabled={reactivatingId === membro.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 active:bg-emerald-200 rounded-lg border border-emerald-300 dark:border-emerald-700 transition shadow-2xs cursor-pointer disabled:opacity-50"
                              title={`Reativar acesso de ${membro.nome}`}
                            >
                              {reactivatingId === membro.id ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 dark:text-emerald-400" />
                                  <span>Reativando...</span>
                                </>
                              ) : (
                                <>
                                  <RotateCcw className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                  <span>Reativar Acesso</span>
                                </>
                              )}
                            </button>
                          ) : isAnotherAdmin ? (
                            <span
                              className="inline-flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700"
                              title="Proteção de Administrador"
                            >
                              <Lock className="w-3 h-3" />
                              <span>Admin Protegido</span>
                            </span>
                          ) : isCurrentUser ? (
                            <span
                              className="inline-flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700"
                              title="Sua própria conta"
                            >
                              <Lock className="w-3 h-3" />
                              <span>Sessão Ativa</span>
                            </span>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingMembro(membro);
                                  setSelectedRoleToEdit(membro.role);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg transition cursor-pointer"
                                title="Alterar Cargo / Nível de Acesso"
                              >
                                <Edit2 className="w-3 h-3 text-slate-500" />
                                <span>Cargo</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setDeactivatingMembro(membro);
                                  setMensagemDesativacao(membro.mensagem_desativacao || '');
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800 rounded-lg transition cursor-pointer"
                                title="Desativar Acesso do Operador"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Desativar</span>
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Cadastrar Novo Operador */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-700 text-white flex items-center justify-center shadow-xs">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-heading">
                    Cadastrar Novo Operador
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Insira as credenciais iniciais de acesso
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCadastrarMembro} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  placeholder="Ex: Maria Silva"
                  required
                  className="w-full py-2 px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  E-mail de Acesso
                </label>
                <input
                  type="email"
                  value={novoEmail}
                  onChange={(e) => setNovoEmail(e.target.value)}
                  placeholder="Ex: maria.silva@larharmonia.org"
                  required
                  className="w-full py-2 px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Senha Inicial
                </label>
                <input
                  type="password"
                  value={novoSenha}
                  onChange={(e) => setNovoSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  className="w-full py-2 px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Nível de Acesso (Cargo)
                </label>
                <select
                  value={novoRole}
                  onChange={(e) => setNovoRole(e.target.value as UserRole)}
                  className="w-full py-2 px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs text-slate-900 dark:text-slate-100 outline-none cursor-pointer"
                >
                  <option value="servico_social">Serviço Social (Acesso Padrão)</option>
                  <option value="recepcao">Recepção / Triagem</option>
                  <option value="admin">Administrador Geral</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingNovo}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submittingNovo ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Cadastrando...</span>
                    </>
                  ) : (
                    <span>Confirmar Cadastro</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Alterar Cargo */}
      {editingMembro && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-heading">
                Alterar Cargo do Operador
              </h3>
              <button
                type="button"
                onClick={() => setEditingMembro(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Selecione o novo papel de acesso para <strong>{editingMembro.nome}</strong>:
              </p>
              <div className="mt-3 space-y-2">
                {[
                  {
                    r: 'servico_social',
                    label: 'Serviço Social',
                    desc: 'Acesso completo a fichas, relatórios e atendimentos'
                  },
                  {
                    r: 'recepcao',
                    label: 'Recepção',
                    desc: 'Acolhimento inicial e triagem de assistidos'
                  },
                  {
                    r: 'admin',
                    label: 'Administrador',
                    desc: 'Gestão de equipe, parâmetros e controle irrestrito'
                  }
                ].map((item) => (
                  <label
                    key={item.r}
                    className={`block p-3 rounded-xl border cursor-pointer transition ${
                      selectedRoleToEdit === item.r
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="roleEdit"
                        value={item.r}
                        checked={selectedRoleToEdit === item.r}
                        onChange={() => setSelectedRoleToEdit(item.r as UserRole)}
                        className="text-emerald-700 focus:ring-emerald-700"
                      />
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {item.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-5 mt-0.5">
                      {item.desc}
                    </p>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingMembro(null)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSalvarCargo}
                disabled={savingCargo}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {savingCargo ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <span>Salvar Alteração</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Desativar Operador */}
      {deactivatingMembro && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-heading">
                  Desativar Acesso do Operador
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Bloquear login de {deactivatingMembro.nome}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              O operador será marcado como inativo e não conseguirá mais acessar o sistema. Você poderá
              reativar o acesso a qualquer momento através do botão <strong>"Reativar Acesso"</strong>.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                <span>Mensagem Personalizada ao Operador (Opcional):</span>
              </label>
              <textarea
                value={mensagemDesativacao}
                onChange={(e) => setMensagemDesativacao(e.target.value)}
                rows={3}
                placeholder="Ex: Seu período de estágio foi concluído. Entre em contato com a diretoria..."
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeactivatingMembro(null)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDesativar}
                disabled={deactivatingLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {deactivatingLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Desativando...</span>
                  </>
                ) : (
                  <span>Confirmar Desativação</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
