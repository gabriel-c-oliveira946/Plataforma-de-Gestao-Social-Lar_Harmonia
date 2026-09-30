import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  Shield,
  UserCheck,
  User,
  Plus,
  CheckCircle2,
  Lock,
  Info,
  AlertCircle,
  Loader2,
  KeyRound,
  Eye,
  EyeOff,
  Edit3,
  Trash2,
  AlertTriangle,
  UserX,
  MessageSquare,
  MessageSquarePlus,
  Search,
  RotateCcw
} from 'lucide-react';
import {
  UserProfile,
  UserRole,
  getRoleBadgeClasses,
  getRoleCargo,
  mapCargoToEnumRole,
  mapRoleToCargoFormatado
} from '../types/auth';
import { supabase } from '../lib/supabase/client';
import {
  getEquipeList,
  cadastrarNovoMembroSupabase,
  atualizarCargoMembro,
  desativarMembroEquipe,
  reativarMembroEquipe,
  removerMembroEquipe
} from '../utils/equipe';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface EquipeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EquipeModal({ isOpen, onClose }: EquipeModalProps) {
  const { user, role: currentRole, canManageTeam } = useAuth();
  const toast = useToast();
  const [equipe, setEquipe] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de Controle de Busca e Filtro de Status
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ativos' | 'inativos'>('ativos');
  const [reactivatingId, setReactivatingId] = useState<string | null>(null);

  // Formulário de Cadastro de Novo Membro (Exclusivo para Admin)
  const [showAddForm, setShowAddForm] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoEmail, setNovoEmail] = useState('');
  const [novoSenha, setNovoSenha] = useState('');
  const [showNovoSenha, setShowNovoSenha] = useState(false);
  const [novoRole, setNovoRole] = useState<UserRole>('servico_social');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Estados de Controle: Editar Cargo do Membro
  const [editingMembro, setEditingMembro] = useState<UserProfile | null>(null);
  const [roleToEdit, setRoleToEdit] = useState<UserRole>('servico_social');
  const [savingEditRole, setSavingEditRole] = useState(false);

  // Estados de Controle: Confirmar Remoção / Desativação de Acesso
  const [membroToDelete, setMembroToDelete] = useState<UserProfile | null>(null);
  const [deletingMembro, setDeletingMembro] = useState(false);
  const [habilitarMensagem, setHabilitarMensagem] = useState(false);
  const [mensagemDesativacao, setMensagemDesativacao] = useState('');

  const isAdmin = currentRole === 'admin' || canManageTeam;

  useEffect(() => {
    if (isOpen) {
      loadEquipe();
      setErrorMsg(null);
      setSuccessMsg(null);
      setSearchTerm('');
    }
  }, [isOpen, user]);

  // Leitura direta na tabela 'public.profiles' do Supabase (Requisito 1)
  const loadEquipe = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('profiles').select('*');

      if (!error && Array.isArray(data) && data.length > 0) {
        const mappedList: UserProfile[] = data.map((item: any) => {
          let parsedRole: UserRole = 'servico_social';
          const r = (item.role || '').toLowerCase().trim();
          const c = (item.cargo || '').toLowerCase().trim();

          if (
            r === 'admin' ||
            r.includes('diretor') ||
            r.includes('administrador') ||
            c === 'admin' ||
            c.includes('administrador') ||
            c.includes('diretor')
          ) {
            parsedRole = 'admin';
          } else if (
            r === 'recepcao' ||
            r === 'recepção' ||
            r.includes('recep') ||
            r.includes('volunt') ||
            c.includes('recep') ||
            c.includes('volunt')
          ) {
            parsedRole = 'recepcao';
          } else {
            parsedRole = 'servico_social';
          }

          const isInactive =
            item.status === 'inativo' ||
            item.ativo === false ||
            item.cargo === 'Inativo';

          return {
            id: item.id,
            email: item.email || '',
            nome: item.nome || 'Operador Social',
            role: parsedRole,
            cargo:
              item.cargo && item.cargo !== 'Inativo'
                ? item.cargo
                : parsedRole === 'admin'
                ? 'Admin'
                : getRoleCargo(parsedRole),
            status: isInactive ? ('inativo' as const) : ('ativo' as const),
            ativo: !isInactive,
            mensagem_desativacao: item.mensagem_desativacao
          };
        });

        // Garante que o usuário da sessão ativa apareça caso ainda não conste em 'profiles'
        if (
          user &&
          !mappedList.some(
            (m) =>
              m.id === user.id ||
              (m.email && user.email && m.email.toLowerCase() === user.email.toLowerCase())
          )
        ) {
          const uRole = currentRole || 'admin';
          mappedList.unshift({
            id: user.id,
            email: user.email || '',
            nome: user.user_metadata?.nome || user.email?.split('@')[0] || 'Você (Sessão Atual)',
            role: uRole,
            cargo: getRoleCargo(uRole),
            status: 'ativo',
            ativo: true
          });
        }

        setEquipe(mappedList);
      } else {
        // Fallback caso a tabela 'profiles' esteja vazia ou retorne erro
        const fallbackList = await getEquipeList(user, true);
        setEquipe(fallbackList);
      }
    } catch (err) {
      console.warn('Erro ao carregar equipe da tabela profiles, usando fallback:', err);
      const fallbackList = await getEquipeList(user, true);
      setEquipe(fallbackList);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setErrorMsg('Apenas o perfil Administrador pode cadastrar novos membros da equipe.');
      return;
    }

    const trimmedNome = novoNome.trim();
    const trimmedEmail = novoEmail.trim();
    const trimmedSenha = novoSenha.trim();

    if (!trimmedNome || !trimmedEmail || !trimmedSenha) {
      setErrorMsg('Preencha todos os campos obrigatórios (Nome, E-mail e Senha Inicial).');
      return;
    }

    if (trimmedSenha.length < 6) {
      setErrorMsg('A senha inicial deve conter pelo menos 6 caracteres.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const cargoFormatado =
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
        cargo: cargoFormatado,
        role: novoRole
      });

      if (res.error) {
        setErrorMsg(res.error);
        return;
      }

      // Persistência direta na tabela 'profiles' do Supabase
      try {
        await supabase.from('profiles').upsert([
          {
            id: res.user?.id || `user-${Date.now()}`,
            nome: trimmedNome,
            email: trimmedEmail,
            role: novoRole,
            cargo: cargoFormatado,
            status: 'ativo'
          }
        ]);
      } catch (upsertErr) {
        console.warn('Erro ao atualizar profiles após cadastro:', upsertErr);
      }

      setSuccessMsg(`Membro ${trimmedNome} cadastrado com sucesso!`);
      setNovoNome('');
      setNovoEmail('');
      setNovoSenha('');
      setShowNovoSenha(false);
      setNovoRole('servico_social');
      setShowAddForm(false);
      await loadEquipe();

      setTimeout(() => {
        setSuccessMsg(null);
      }, 4500);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Falha ao cadastrar o novo operador.');
    } finally {
      setSubmitting(false);
    }
  };

  // Abrir modal de edição de cargo
  const handleOpenEditRole = (membro: UserProfile) => {
    // Trava de segurança: Bloqueia a edição de cargo da própria conta do Admin logado na sessão ativa
    const isCurrent =
      user &&
      (membro.id === user.id ||
        (membro.email && user.email && membro.email.toLowerCase() === user.email.toLowerCase()));

    if (isCurrent) {
      setErrorMsg('Trava de Segurança: você não pode alterar o cargo da sua própria conta de administrador.');
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }

    // Regra de Proteção entre Administradores: Admin NÃO edita outro Admin
    const isTargetAdmin =
      membro.role === 'admin' ||
      membro.cargo?.toLowerCase() === 'admin' ||
      membro.cargo?.toLowerCase().includes('administrador') ||
      membro.cargo?.toLowerCase().includes('diretor');

    if (isTargetAdmin) {
      setErrorMsg('Regra de Proteção: Administradores não podem alterar o cargo de outro Administrador.');
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }

    setEditingMembro(membro);
    setRoleToEdit(membro.role);
    setErrorMsg(null);
  };

  // Salvar alteração de cargo (permitindo qualquer uma das 3 opções: [Admin], [Serviço Social] ou [Recepção])
  const handleSaveEditRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMembro) return;

    // Trava de segurança no envio: Bloqueia auto-alteração do usuário logado na sessão ativa
    const isCurrent =
      user &&
      (editingMembro.id === user.id ||
        (editingMembro.email &&
          user.email &&
          editingMembro.email.toLowerCase() === user.email.toLowerCase()));

    if (isCurrent) {
      setErrorMsg('Trava de Segurança: você não pode alterar o cargo da sua própria conta de administrador.');
      setEditingMembro(null);
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }

    // Regra de Proteção entre Administradores: Admin NÃO edita outro Admin
    const isTargetAdmin =
      editingMembro.role === 'admin' ||
      editingMembro.cargo?.toLowerCase() === 'admin' ||
      editingMembro.cargo?.toLowerCase().includes('administrador') ||
      editingMembro.cargo?.toLowerCase().includes('diretor');

    if (isTargetAdmin) {
      setErrorMsg('Regra de Proteção: Administradores não podem alterar o cargo de outro Administrador.');
      setEditingMembro(null);
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }

    setSavingEditRole(true);
    setErrorMsg(null);

    const chaveEnumMapeada = mapCargoToEnumRole(roleToEdit);
    const novoCargoFormatado = mapRoleToCargoFormatado(roleToEdit);

    try {
      // 1. Gravação no Supabase: 'cargo' recebe o texto formatado e 'role' recebe o valor exato do ENUM ('admin', 'servico_social', 'recepcao')
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          cargo: novoCargoFormatado,
          role: chaveEnumMapeada
        })
        .eq('id', editingMembro.id);

      if (profileError) {
        console.error('Erro ao atualizar cargo no Supabase:', profileError);
        toast.error('Erro ao atualizar cargo', profileError.message);
        setErrorMsg(`Erro no banco de dados: ${profileError.message}`);
        return;
      }

      // 2. Sincroniza os dados locais e de sessão
      await atualizarCargoMembro({
        id: editingMembro.id,
        email: editingMembro.email,
        role: chaveEnumMapeada,
        cargo: novoCargoFormatado
      });

      // 3. Recarrega a lista de membros na tela imediatamente após o sucesso
      await loadEquipe();

      // 4. Feedback visível de sucesso
      toast.success('Cargo atualizado com sucesso!', `Cargo de ${editingMembro.nome} alterado para ${novoCargoFormatado}`);
      setSuccessMsg(`Cargo de ${editingMembro.nome} alterado para ${novoCargoFormatado} com sucesso!`);
      setEditingMembro(null);
      setTimeout(() => setSuccessMsg(null), 4500);
    } catch (err: any) {
      console.error('Erro inesperado ao atualizar cargo:', err);
      const msg = err?.message || 'Falha ao atualizar cargo do operador.';
      toast.error('Erro ao atualizar cargo', msg);
      setErrorMsg(msg);
    } finally {
      setSavingEditRole(false);
    }
  };

  // Abrir modal de confirmação de desativação com reset dos estados da mensagem
  const handleOpenDesativar = (membro: UserProfile) => {
    // Regra de segurança: Bloqueia a desativação da própria conta do Admin logado
    const isCurrent =
      user &&
      (membro.id === user.id ||
        (membro.email && user.email && membro.email.toLowerCase() === user.email.toLowerCase()));

    if (isCurrent) {
      setErrorMsg('Ação bloqueada: você não pode desativar a própria conta de administrador.');
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }

    // Regra de Proteção entre Administradores: Admin NÃO desativa outro Admin
    const isTargetAdmin =
      membro.role === 'admin' ||
      membro.cargo?.toLowerCase() === 'admin' ||
      membro.cargo?.toLowerCase().includes('administrador') ||
      membro.cargo?.toLowerCase().includes('diretor');

    if (isTargetAdmin) {
      setErrorMsg('Regra de Proteção: Administradores não podem desativar outro Administrador.');
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }

    setMembroToDelete(membro);
    setHabilitarMensagem(false);
    setMensagemDesativacao('');
  };

  // Confirmar desativação de acesso de um membro
  const handleConfirmDelete = async () => {
    if (!membroToDelete) return;

    // Regra de segurança: Bloqueia a desativação da própria conta do Admin logado
    const isCurrent =
      user &&
      (membroToDelete.id === user.id ||
        (membroToDelete.email &&
          user.email &&
          membroToDelete.email.toLowerCase() === user.email.toLowerCase()));

    if (isCurrent) {
      setErrorMsg('Ação bloqueada: você não pode desativar a própria conta de administrador.');
      setMembroToDelete(null);
      return;
    }

    // Regra de Proteção entre Administradores: Admin NÃO desativa outro Admin
    const isTargetAdmin =
      membroToDelete.role === 'admin' ||
      membroToDelete.cargo?.toLowerCase() === 'admin' ||
      membroToDelete.cargo?.toLowerCase().includes('administrador') ||
      membroToDelete.cargo?.toLowerCase().includes('diretor');

    if (isTargetAdmin) {
      setErrorMsg('Regra de Proteção: Administradores não podem desativar outro Administrador.');
      setMembroToDelete(null);
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }

    setDeletingMembro(true);
    setErrorMsg(null);

    const textoMensagem = habilitarMensagem && mensagemDesativacao.trim()
      ? mensagemDesativacao.trim()
      : undefined;

    try {
      const hasUrl = typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL;
      if (hasUrl) {
        // Atualização no Supabase da tabela profiles (cargo, status, ativo e mensagem_desativacao)
        let { error: profileError } = await supabase
          .from('profiles')
          .update({
            status: 'inativo',
            ativo: false,
            cargo: 'Inativo',
            mensagem_desativacao: textoMensagem || null
          })
          .eq('id', membroToDelete.id);

        if (profileError && (profileError.message?.includes('mensagem_desativacao') || profileError.message?.includes('column'))) {
          const retry1 = await supabase
            .from('profiles')
            .update({
              status: 'inativo',
              ativo: false,
              cargo: 'Inativo'
            })
            .eq('id', membroToDelete.id);
          profileError = retry1.error;
        }

        if (profileError && profileError.message?.includes('status')) {
          const retry2 = await supabase
            .from('profiles')
            .update({
              cargo: 'Inativo'
            })
            .eq('id', membroToDelete.id);
          profileError = retry2.error;
        }

        if (profileError) {
          console.error('Erro ao desativar membro no Supabase:', profileError);
          toast.error('Erro ao desativar acesso', profileError.message);
          setErrorMsg(`Erro: ${profileError.message}`);
          return;
        }
      }

      const res = await desativarMembroEquipe(
        membroToDelete.id,
        membroToDelete.email,
        textoMensagem
      );
      if (!res.success) {
        toast.error('Erro ao desativar acesso', res.error || 'Não foi possível desativar o operador.');
        setErrorMsg(res.error || 'Não foi possível desativar o operador.');
        return;
      }

      toast.success('Acesso desativado com sucesso!', `${membroToDelete.nome} foi desativado.`);
      setSuccessMsg('Acesso desativado com sucesso!');
      setMembroToDelete(null);
      setHabilitarMensagem(false);
      setMensagemDesativacao('');
      await loadEquipe();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      const errorMsg = err?.message || 'Falha ao desativar o membro da equipe.';
      console.error('Erro em handleConfirmDelete:', err);
      toast.error('Erro ao desativar acesso', errorMsg);
      setErrorMsg(errorMsg);
    } finally {
      setDeletingMembro(false);
    }
  };

  // Reativar acesso de membro inativo
  const handleReativar = async (membro: UserProfile) => {
    if (!isAdmin) {
      setErrorMsg('Apenas o perfil Administrador pode reativar membros da equipe.');
      return;
    }

    setReactivatingId(membro.id);
    setErrorMsg(null);

    try {
      const chaveEnumRestaurada = mapCargoToEnumRole(membro.role);
      const restoredCargo = mapRoleToCargoFormatado(membro.role || membro.cargo);

      // Requisito: Atualização direta na tabela 'profiles' do Supabase com enum válido
      let { error: profileError } = await supabase
        .from('profiles')
        .update({
          cargo: restoredCargo,
          role: chaveEnumRestaurada,
          status: 'ativo'
        })
        .eq('id', membro.id);

      if (profileError && profileError.message?.includes('status')) {
        const retry = await supabase
          .from('profiles')
          .update({
            cargo: restoredCargo,
            role: chaveEnumRestaurada
          })
          .eq('id', membro.id);
        profileError = retry.error;
      }

      if (profileError) {
        console.warn('Erro ao reativar membro em profiles:', profileError);
      }

      const res = await reativarMembroEquipe(membro.id, membro.email);
      if (!res.success && profileError) {
        setErrorMsg(res.error || 'Não foi possível reativar o acesso do operador.');
        return;
      }

      setSuccessMsg(
        `Acesso de ${membro.nome} reativado com sucesso! Membro movido de volta para a lista de ativos.`
      );
      await loadEquipe();
      setTimeout(() => setSuccessMsg(null), 4500);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Falha ao reativar o membro da equipe.');
    } finally {
      setReactivatingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 overflow-hidden border border-gray-100 dark:border-slate-800">
        {/* Cabeçalho do Modal */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">
                Gestão da Equipe & Níveis de Acesso
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Operadores e permissões ativas no sistema Lar Harmonia
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notificações de Sucesso / Erro */}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-200 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-xs font-semibold text-red-800 dark:text-red-200 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="p-6 overflow-y-auto space-y-6">
          {/* Card Resumo dos 3 Níveis de Acesso Refinados */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 1. Diretoria / Admin */}
            <div className="p-3.5 rounded-xl border border-purple-200 dark:border-purple-800/80 bg-purple-50/50 dark:bg-purple-950/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-700">
                  <Shield className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                  admin
                </span>
                <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase">Acesso Total</span>
              </div>
              <h3 className="font-heading text-xs font-bold text-slate-900 dark:text-purple-100">Diretoria / Administrador</h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Acesso total: Cadastrar, Editar 5 abas, Avaliação 4 meses, Excluir fichas + <strong>EXCLUSIVIDADE para Cadastrar e Gerenciar Membros da Equipe</strong>.
              </p>
            </div>

            {/* 2. Serviço Social */}
            <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-700">
                  <UserCheck className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
                  servico_social
                </span>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">Operacional</span>
              </div>
              <h3 className="font-heading text-xs font-bold text-slate-900 dark:text-emerald-100">Serviço Social / Assistente</h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Acesso completo operacional dos assistidos: Cadastrar assistidos, Editar todas as 5 abas, Consultar e Registrar Avaliação de 4 Meses (sem criação de usuários).
              </p>
            </div>

            {/* 3. Recepção / Voluntário */}
            <div className="p-3.5 rounded-xl border border-sky-200 dark:border-sky-800/80 bg-sky-50/50 dark:bg-sky-950/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-200 border border-sky-200 dark:border-sky-700">
                  <User className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                  recepcao
                </span>
                <span className="text-[10px] font-bold text-sky-700 dark:text-sky-300 uppercase">Consulta</span>
              </div>
              <h3 className="font-heading text-xs font-bold text-slate-900 dark:text-sky-100">Recepção / Voluntário</h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Permissão para Cadastro inicial de triagem e Consulta/visualização de fichas sociais (sem permissão de edição, exclusão ou equipe).
              </p>
            </div>
          </div>

          {/* Seção da Equipe e Formulário de Cadastro Exclusivo do Admin */}
          <div className="space-y-3.5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
              <div>
                <h3 className="font-heading text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <span>Membros da Equipe</span>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 normal-case font-sans">
                    ({equipe.filter((m) => m.status !== 'inativo' && m.ativo !== false).length} ativos, {equipe.filter((m) => m.status === 'inativo' || m.ativo === false).length} inativos)
                  </span>
                </h3>
              </div>

              {/* Botão de Cadastrar Novo Membro: EXIBIDO APENAS SE FOR ADMIN */}
              {isAdmin ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(!showAddForm);
                    setErrorMsg(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 rounded-lg shadow-2xs transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {showAddForm ? 'Fechar Formulário' : 'Cadastrar Novo Membro'}
                </button>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-transparent dark:border-slate-700">
                  <Lock className="w-3 h-3 text-slate-400" />
                  Cadastro restrito à Diretoria
                </span>
              )}
            </div>

            {/* FORMULÁRIO DE CADASTRAR NOVO MEMBRO: EXIBIDO APENAS SE FOR ADMIN */}
            {isAdmin && showAddForm && (
              <form
                onSubmit={handleAddMember}
                className="p-5 bg-slate-50 dark:bg-slate-800/80 border border-emerald-200/80 dark:border-slate-700 rounded-xl space-y-4 animate-in fade-in shadow-xs"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                      <Plus className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-heading text-xs font-bold text-slate-900 dark:text-slate-100">
                        Cadastrar Novo Membro / Operador
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Cria o acesso institucional com perfil e permissões configurados
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-700">
                    Apenas Administrador
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Nome Completo */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1">
                      Nome Completo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={novoNome}
                      onChange={(e) => setNovoNome(e.target.value)}
                      placeholder="Ex: Ana Silva"
                      required
                      disabled={submitting}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 disabled:bg-slate-100 dark:disabled:bg-slate-800 transition"
                    />
                  </div>

                  {/* E-mail Institucional */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1">
                      E-mail Institucional <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={novoEmail}
                      onChange={(e) => setNovoEmail(e.target.value)}
                      placeholder="Ex: ana@larharmonia.org"
                      required
                      disabled={submitting}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 disabled:bg-slate-100 dark:disabled:bg-slate-800 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Senha Inicial */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                        <KeyRound className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                        <span>Senha Inicial</span> <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowNovoSenha(!showNovoSenha)}
                        disabled={submitting}
                        className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition disabled:opacity-50"
                        title={showNovoSenha ? 'Ocultar Senha' : 'Mostrar Senha'}
                      >
                        {showNovoSenha ? (
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
                        type={showNovoSenha ? 'text' : 'password'}
                        value={novoSenha}
                        onChange={(e) => setNovoSenha(e.target.value)}
                        placeholder="Mínimo de 6 caracteres"
                        required
                        minLength={6}
                        disabled={submitting}
                        className="w-full p-2.5 pr-10 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 disabled:bg-slate-100 dark:disabled:bg-slate-800 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNovoSenha(!showNovoSenha)}
                        disabled={submitting}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
                        title={showNovoSenha ? 'Ocultar Senha' : 'Mostrar Senha'}
                        aria-label={showNovoSenha ? 'Ocultar Senha' : 'Mostrar Senha'}
                      >
                        {showNovoSenha ? (
                          <EyeOff className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Cargo/Perfil: Seletor com as opções [Serviço Social], [Recepção] e [Admin] */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1">
                      Cargo / Perfil de Acesso <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={novoRole}
                      onChange={(e) => setNovoRole(e.target.value as UserRole)}
                      disabled={submitting}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 disabled:bg-slate-100 dark:disabled:bg-slate-800 font-medium transition cursor-pointer"
                    >
                      <option value="servico_social" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Serviço Social</option>
                      <option value="recepcao" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Recepção</option>
                      <option value="admin" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Admin (Diretoria / Administrador)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    O operador receberá as permissões de acordo com o perfil selecionado.
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      disabled={submitting}
                      className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg shadow-xs transition cursor-pointer"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Cadastrando...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Cadastrar Operador</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Controles de Filtro: Abas [Ativos] / [Inativos / Desativados] e Campo de Busca */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              {/* Abas de Alternância */}
              <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
                <button
                  type="button"
                  onClick={() => setStatusFilter('ativos')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    statusFilter === 'ativos'
                      ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                  <span>Ativos</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      statusFilter === 'ativos'
                        ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {equipe.filter((m) => m.status !== 'inativo' && m.ativo !== false).length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('inativos')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    statusFilter === 'inativos'
                      ? 'bg-white dark:bg-slate-700 text-red-800 dark:text-red-300 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <UserX className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                  <span>Inativos / Desativados</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      statusFilter === 'inativos'
                        ? 'bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-200'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {equipe.filter((m) => m.status === 'inativo' || m.ativo === false).length}
                  </span>
                </button>
              </div>

              {/* Campo de Busca / Pesquisa em Tempo Real */}
              <div className="relative flex-1 max-w-full sm:max-w-xs">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Pesquisar por nome ou e-mail..."
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white dark:focus:bg-slate-900 transition"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5 rounded-full cursor-pointer"
                    title="Limpar pesquisa"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Lista dos Membros da Equipe */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
              {loading ? (
                <div className="p-8 text-center text-xs text-gray-500 dark:text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600 dark:text-emerald-400" />
                  <span>Carregando membros da equipe...</span>
                </div>
              ) : (
                (() => {
                  const membrosAtivos = equipe.filter(
                    (m) => m.status !== 'inativo' && m.ativo !== false
                  );
                  const membrosInativos = equipe.filter(
                    (m) => m.status === 'inativo' || m.ativo === false
                  );
                  const baseList = statusFilter === 'ativos' ? membrosAtivos : membrosInativos;
                  const term = searchTerm.trim().toLowerCase();
                  const displayedList = baseList.filter((m) => {
                    if (!term) return true;
                    const nomeMatch = m.nome ? m.nome.toLowerCase().includes(term) : false;
                    const emailMatch = m.email ? m.email.toLowerCase().includes(term) : false;
                    return nomeMatch || emailMatch;
                  });

                  if (displayedList.length === 0) {
                    return (
                      <div className="p-8 text-center text-xs text-gray-500 dark:text-slate-400 space-y-2">
                        {searchTerm ? (
                          <>
                            <p>Nenhum membro encontrado para "{searchTerm}".</p>
                            <button
                              type="button"
                              onClick={() => setSearchTerm('')}
                              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 underline cursor-pointer"
                            >
                              Limpar pesquisa
                            </button>
                          </>
                        ) : statusFilter === 'inativos' ? (
                          <p>Nenhuma conta de operador desativada no momento.</p>
                        ) : (
                          <p>Nenhum operador ativo registrado no momento.</p>
                        )}
                      </div>
                    );
                  }

                  return displayedList.map((membro) => {
                    const isCurrentUser = Boolean(
                      user &&
                        (membro.id === user.id ||
                          (membro.email &&
                            user.email &&
                            membro.email.toLowerCase() === user.email.toLowerCase()))
                    );

                    // Regra de Proteção entre Administradores:
                    // Se o usuário logado for 'admin' e houver OUTRO usuário com cargo 'admin' na lista
                    const isAnotherAdmin = Boolean(
                      isAdmin &&
                        !isCurrentUser &&
                        (membro.role === 'admin' ||
                          membro.cargo?.toLowerCase() === 'admin' ||
                          membro.cargo?.toLowerCase().includes('administrador') ||
                          membro.cargo?.toLowerCase().includes('diretoria'))
                    );

                    const isInactive = membro.status === 'inativo' || membro.ativo === false;
                    const badge = getRoleBadgeClasses(membro.role) || {
                      badge: 'bg-sky-100 text-sky-900 border-sky-200 dark:bg-sky-900/50 dark:text-sky-200 dark:border-sky-500 font-semibold',
                      dot: 'bg-sky-600 dark:bg-sky-400',
                      border: 'border-sky-300 dark:border-sky-600'
                    };

                    return (
                      <div
                        key={membro.id}
                        className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/70 dark:hover:bg-slate-800/60 transition ${
                          isCurrentUser
                            ? 'bg-emerald-50/40 dark:bg-emerald-950/20'
                            : isInactive
                            ? 'bg-red-50/20 dark:bg-red-950/20'
                            : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs border ${
                              isInactive
                                ? 'bg-red-100 dark:bg-red-900/60 border-red-200 dark:border-red-700 text-red-700 dark:text-red-300'
                                : isAnotherAdmin
                                ? 'bg-purple-100 dark:bg-purple-900/60 border-purple-200 dark:border-purple-700 text-purple-800 dark:text-purple-200'
                                : isCurrentUser
                                ? 'bg-emerald-100 dark:bg-emerald-900/60 border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200'
                                : 'bg-emerald-100 dark:bg-emerald-900/60 border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200'
                            }`}
                          >
                            {membro.nome ? membro.nome.charAt(0).toUpperCase() : 'O'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-gray-900 dark:text-slate-100 truncate">
                                {membro.nome}
                              </span>

                              {/* Indicador: Você (Sessão Atual) */}
                              {isCurrentUser && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-[10px] font-bold border border-emerald-200 dark:border-emerald-700">
                                  <UserCheck className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
                                  Você (Sessão Atual)
                                </span>
                              )}

                              {/* Badge: Administrador Protegido */}
                              {isAnotherAdmin && (
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 text-[10px] font-bold border border-purple-200 dark:border-purple-700 shadow-2xs"
                                  title="Administrador Protegido: regras do sistema impedem que um administrador altere ou desative outro administrador"
                                >
                                  <Shield className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                                  Administrador Protegido
                                </span>
                              )}

                              {/* Indicador: Conta Desativada */}
                              {isInactive && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-200 text-[10px] font-bold border border-red-200 dark:border-red-700">
                                  <UserX className="w-3 h-3 text-red-600 dark:text-red-400" />
                                  Conta Desativada
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-gray-500 dark:text-slate-400 truncate mt-0.5">
                              {membro.cargo} {membro.email ? `• ${membro.email}` : ''}
                            </p>

                            {/* Mensagem de desativação personalizada se houver */}
                            {isInactive && membro.mensagem_desativacao && (
                              <p
                                className="text-[10.5px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/60 rounded-md px-2 py-0.5 mt-1 inline-block max-w-md truncate"
                                title={membro.mensagem_desativacao}
                              >
                                <span className="font-semibold">Recado:</span> {membro.mensagem_desativacao}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                              isInactive
                                ? 'bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700'
                                : (badge?.badge || 'bg-sky-100 text-sky-900 border-sky-200 dark:bg-sky-900/50 dark:text-sky-200 dark:border-sky-500 font-semibold')
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isInactive ? 'bg-red-500 dark:bg-red-400' : (badge?.dot || 'bg-sky-600 dark:bg-sky-400')
                              }`}
                            />
                            <span>{isInactive ? 'Inativo' : membro.cargo}</span>
                          </span>

                          {/* Ações de Controle de Equipe Exclusivas do Admin */}
                          {isAdmin && (
                            <div className="flex items-center gap-1.5 ml-1">
                              {isInactive ? (
                                /* Botão "Reativar Acesso" para contas desativadas */
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
                                /* Regra 3: OUTRO Admin tem os botões de Alterar Cargo e Desativar desabilitados */
                                <>
                                  <button
                                    type="button"
                                    disabled
                                    className="opacity-40 cursor-not-allowed inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700"
                                    title="Administrador Protegido: regras do sistema impedem alterar o cargo de outro administrador"
                                  >
                                    <Lock className="w-3 h-3 text-gray-400 dark:text-slate-500" />
                                    <span className="hidden sm:inline">Alterar Cargo</span>
                                  </button>
                                  <button
                                    type="button"
                                    disabled
                                    className="opacity-40 cursor-not-allowed inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700"
                                    title="Administrador Protegido: regras do sistema impedem desativar o acesso de outro administrador"
                                  >
                                    <Lock className="w-3 h-3 text-gray-400 dark:text-slate-500" />
                                    <span className="hidden sm:inline">Desativar</span>
                                  </button>
                                </>
                              ) : isCurrentUser ? (
                                /* Regra 1: Próprio Admin logado tem bloqueio de auto-alteração */
                                <>
                                  <button
                                    type="button"
                                    disabled
                                    className="opacity-40 cursor-not-allowed inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700"
                                    title="Trava de Segurança: você não pode alterar o cargo da sua própria conta na sessão ativa"
                                  >
                                    <Lock className="w-3 h-3 text-gray-400 dark:text-slate-500" />
                                    <span className="hidden sm:inline">Alterar Cargo</span>
                                  </button>
                                  <button
                                    type="button"
                                    disabled
                                    className="opacity-40 cursor-not-allowed inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700"
                                    title="Regra de Segurança: você não pode desativar sua própria conta de administrador"
                                  >
                                    <UserX className="w-3 h-3" />
                                    <span className="hidden sm:inline">Desativar</span>
                                  </button>
                                </>
                              ) : (
                                /* Membros com perfis 'servico_social' ou 'recepcao': Admin pode alterar cargo e desativar */
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditRole(membro)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-lg border border-emerald-200 dark:border-emerald-700 transition shadow-2xs cursor-pointer"
                                    title={`Alterar cargo de ${membro.nome}`}
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span className="hidden sm:inline">Alterar Cargo</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenDesativar(membro)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg border border-red-200 dark:border-red-800 transition shadow-2xs cursor-pointer"
                                    title={`Desativar acesso de ${membro.nome}`}
                                  >
                                    <UserX className="w-3 h-3" />
                                    <span className="hidden sm:inline">Desativar</span>
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()
              )}
            </div>
          </div>
        </div>

        {/* Modal de Confirmação de Desativação de Acesso com Opção de Mensagem */}
        {membroToDelete && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 dark:border-slate-800 space-y-4 animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
              <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto shadow-inner">
                <UserX className="w-6 h-6" />
              </div>
              <div className="text-center">
                <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">
                  Confirmar Desativação de Acesso
                </h3>
                <p className="text-xs text-gray-600 dark:text-slate-300 mt-1">
                  Tem certeza que deseja desativar o acesso de{' '}
                  <strong className="text-gray-900 dark:text-slate-100 font-bold">{membroToDelete.nome}</strong>?
                </p>

                <div className="mt-3 p-3 bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-left space-y-1">
                  <p className="text-gray-600 dark:text-slate-300">
                    <span className="font-semibold text-gray-700 dark:text-slate-200">Cargo:</span> {membroToDelete.cargo}
                  </p>
                  {membroToDelete.email && (
                    <p className="text-gray-600 dark:text-slate-300 truncate">
                      <span className="font-semibold text-gray-700 dark:text-slate-200">E-mail:</span> {membroToDelete.email}
                    </p>
                  )}
                  <p className="text-[11px] text-red-600 dark:text-red-400 font-medium pt-0.5">
                    O login do operador será bloqueado imediatamente pela administração.
                  </p>
                </div>
              </div>

              {/* Opção para escrever ou não uma mensagem para a pessoa (Botão para ativar / desativar) */}
              <div className="border border-gray-200 dark:border-slate-700 rounded-xl p-3.5 bg-slate-50/70 dark:bg-slate-800/50 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                        habilitarMensagem
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                          : 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-400'
                      }`}
                    >
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-800 dark:text-slate-200">
                        Enviar mensagem ao operador
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-slate-400">
                        Adicionar justificativa ou recado para exibição no login
                      </p>
                    </div>
                  </div>

                  {/* Botão de Ativar / Desativar a opção de mandar mensagem */}
                  <button
                    type="button"
                    onClick={() => {
                      const proximo = !habilitarMensagem;
                      setHabilitarMensagem(proximo);
                      if (!proximo) {
                        setMensagemDesativacao('');
                      }
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      habilitarMensagem ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-slate-600'
                    }`}
                    role="switch"
                    aria-checked={habilitarMensagem}
                    title={habilitarMensagem ? 'Desativar opção de enviar mensagem' : 'Ativar opção de enviar mensagem'}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        habilitarMensagem ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Se a opção estiver ATIVADA: Permite redigir a mensagem */}
                {habilitarMensagem ? (
                  <div className="space-y-1.5 animate-in fade-in">
                    <div className="flex items-center justify-between text-[11px]">
                      <label className="font-semibold text-gray-700 dark:text-slate-200 flex items-center gap-1">
                        <MessageSquarePlus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Mensagem da Administração / Justificativa:</span>
                      </label>
                      <span className="text-gray-400 dark:text-slate-400">
                        {mensagemDesativacao.length}/500
                      </span>
                    </div>
                    <textarea
                      value={mensagemDesativacao}
                      onChange={(e) => setMensagemDesativacao(e.target.value)}
                      placeholder="Ex: Seu acesso ao sistema Lar Harmonia foi suspenso devido à conclusão das atividades voluntárias. Agradecemos pelo apoio prestado aos nossos assistidos. Para orientações adicionais, procure a diretoria."
                      rows={3}
                      maxLength={500}
                      disabled={deletingMembro}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-slate-700 focus:border-emerald-500 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-400/20 text-gray-800 dark:text-slate-100 transition resize-none placeholder:text-gray-400 dark:placeholder:text-slate-500"
                    />
                    <p className="text-[10.5px] text-gray-500 dark:text-slate-400 leading-snug">
                      Ao tentar acessar, o operador verá a mensagem padrão acompanhada de um botão <strong>"Ver Detalhes"</strong> para ler este recado.
                    </p>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-gray-100 dark:bg-slate-800 border border-gray-200/70 dark:border-slate-700 text-[11px] text-gray-600 dark:text-slate-300 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                    <span>
                      Opção desativada. O operador verá apenas a mensagem padrão: <em>"Sua conta foi desativada pela administração. Entre em contato com a diretoria."</em>
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMembroToDelete(null);
                    setHabilitarMensagem(false);
                    setMensagemDesativacao('');
                  }}
                  disabled={deletingMembro}
                  className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={deletingMembro}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {deletingMembro ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Desativando...</span>
                    </>
                  ) : (
                    <>
                      <UserX className="w-3.5 h-3.5" />
                      <span>Sim, Desativar Acesso</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Edição de Cargo do Operador */}
        {editingMembro && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-slate-800 space-y-4 animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">
                      Editar Cargo e Permissões
                    </h3>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400">
                      {editingMembro.nome}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingMembro(null)}
                  className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEditRole} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-200 mb-1.5">
                    Selecione o Novo Cargo / Perfil:
                  </label>
                  <div className="space-y-2">
                    {/* Opção 1: [Admin] */}
                    <label
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                        roleToEdit === 'admin'
                          ? 'border-purple-500 bg-purple-50/60 dark:bg-purple-950/60 ring-1 ring-purple-500 text-purple-900 dark:text-purple-100'
                          : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <input
                        type="radio"
                        name="roleOption"
                        value="admin"
                        checked={roleToEdit === 'admin'}
                        onChange={() => setRoleToEdit('admin')}
                        className="mt-0.5 text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />
                      <div className="text-xs">
                        <div className="flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                          <span className="font-bold text-gray-900 dark:text-slate-100 block">Admin</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 rounded-sm">
                            Diretoria
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-500 dark:text-slate-400 block mt-0.5">
                          Acesso total: cadastrar assistidos, editar 5 abas, avaliação de 4 meses, exclusões e gestão da equipe.
                        </span>
                      </div>
                    </label>

                    {/* Opção 2: [Serviço Social] */}
                    <label
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                        roleToEdit === 'servico_social'
                          ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/60 ring-1 ring-emerald-500 text-emerald-900 dark:text-emerald-100'
                          : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <input
                        type="radio"
                        name="roleOption"
                        value="servico_social"
                        checked={roleToEdit === 'servico_social'}
                        onChange={() => setRoleToEdit('servico_social')}
                        className="mt-0.5 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <div className="text-xs">
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span className="font-bold text-gray-900 dark:text-slate-100 block">Serviço Social</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 rounded-sm">
                            Operacional
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-500 dark:text-slate-400 block mt-0.5">
                          Acesso operacional completo: cadastrar assistidos, editar todas as 5 abas e registrar avaliação de 4 meses.
                        </span>
                      </div>
                    </label>

                    {/* Opção 3: [Recepção] */}
                    <label
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                        roleToEdit === 'recepcao'
                          ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/60 ring-1 ring-sky-500 text-sky-900 dark:text-sky-100'
                          : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <input
                        type="radio"
                        name="roleOption"
                        value="recepcao"
                        checked={roleToEdit === 'recepcao'}
                        onChange={() => setRoleToEdit('recepcao')}
                        className="mt-0.5 text-sky-600 focus:ring-sky-500 cursor-pointer"
                      />
                      <div className="text-xs">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                          <span className="font-bold text-gray-900 dark:text-slate-100 block">Recepção</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-200 rounded-sm">
                            Consulta
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-500 dark:text-slate-400 block mt-0.5">
                          Permissão para cadastro inicial de triagem e consulta/leitura das fichas sociais.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2 border-t border-gray-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingMembro(null)}
                    disabled={savingEditRole}
                    className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingEditRole}
                    className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {savingEditRole ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Salvar Cargo</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Rodapé do Modal */}
        <div className="px-6 py-3 bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex items-center justify-end text-xs text-gray-500 dark:text-slate-400">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-800 dark:text-slate-200 font-semibold rounded-lg text-xs transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
