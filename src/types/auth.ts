import { User } from '@supabase/supabase-js';

/**
 * Perfis de Acesso do Lar Harmonia:
 * - 'admin': Diretoria / Administrador (Acesso total)
 * - 'servico_social': Serviço Social / Assistente Social (Cadastro, Edição e Avaliações de 4 meses)
 * - 'recepcao': Recepção / Voluntário (Apenas Cadastro inicial e Consulta de assistidos)
 */
export type UserRole = 'admin' | 'servico_social' | 'recepcao';

export interface UserProfile {
  id: string;
  email?: string;
  nome: string;
  role: UserRole;
  cargo: string;
  ativo?: boolean;
  status?: 'ativo' | 'inativo';
  mensagem_desativacao?: string;
  data_desativacao?: string;
  avatar_url?: string;
}

/**
 * Verifica se o usuário autenticado ou perfil está marcado como inativo
 */
export function isUserInativo(user: User | null): boolean {
  if (!user) return false;
  if (user.user_metadata?.status === 'inativo') return true;
  if (user.user_metadata?.ativo === false) return true;
  if (user.app_metadata?.status === 'inativo') return true;
  if (user.app_metadata?.ativo === false) return true;
  return false;
}

/**
 * Normaliza e identifica o perfil (role) do usuário a partir dos dados de sessão Supabase
 */
export function parseUserRole(user: User | null): UserRole {
  if (!user) return 'recepcao';

  // 1. user_metadata?.role ou app_metadata?.role
  const metaRole = (user.user_metadata?.role || user.app_metadata?.role || '').toLowerCase().trim();
  if (metaRole === 'admin' || metaRole.includes('diretor') || metaRole.includes('administrador')) {
    return 'admin';
  }
  if (
    metaRole === 'servico_social' ||
    metaRole === 'servico-social' ||
    metaRole.includes('social') ||
    metaRole.includes('assistente')
  ) {
    return 'servico_social';
  }
  if (
    metaRole === 'recepcao' ||
    metaRole === 'recepção' ||
    metaRole.includes('recep') ||
    metaRole.includes('voluntar')
  ) {
    return 'recepcao';
  }

  // 2. user_metadata?.cargo
  const metaCargo = (user.user_metadata?.cargo || '').toLowerCase().trim();
  if (metaCargo.includes('diretor') || metaCargo.includes('admin')) {
    return 'admin';
  }
  if (metaCargo.includes('social') || metaCargo.includes('assistente')) {
    return 'servico_social';
  }
  if (metaCargo.includes('recep') || metaCargo.includes('volunt')) {
    return 'recepcao';
  }

  // 3. Fallback baseado no e-mail
  const email = (user.email || '').toLowerCase().trim();
  if (email.includes('admin') || email.includes('diretoria') || email.includes('gabriel')) {
    return 'admin';
  }
  if (email.includes('social') || email.includes('assistente')) {
    return 'servico_social';
  }
  if (email.includes('recepcao') || email.includes('voluntario') || email.includes('triagem')) {
    return 'recepcao';
  }

  // Padrão do sistema: Diretoria / Admin se for o usuário principal
  return 'admin';
}

/**
 * Retorna o nome amigável do operador a partir dos dados do usuário
 */
export function getUserDisplayName(user: User | null): string {
  if (!user) return 'Operador';
  if (user.user_metadata?.nome?.trim()) return user.user_metadata.nome.trim();
  if (user.user_metadata?.full_name?.trim()) return user.user_metadata.full_name.trim();
  if (user.user_metadata?.name?.trim()) return user.user_metadata.name.trim();

  if (user.email) {
    const prefix = user.email.split('@')[0];
    const words = prefix.split(/[._-]/).filter((w) => isNaN(Number(w)));
    if (words.length > 0) {
      return words
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    }
    return prefix;
  }
  return 'Operador Social';
}

/**
 * Retorna o cargo textual completo de acordo com o papel
 */
export function getRoleCargo(role?: UserRole | string | null): string {
  const r = (role || '').toLowerCase().trim();
  if (r === 'admin' || r.includes('diretor') || r.includes('administrador')) {
    return 'Diretoria / Administrador';
  }
  if (
    r === 'servico_social' ||
    r === 'servico-social' ||
    r.includes('social') ||
    r.includes('assist')
  ) {
    return 'Serviço Social';
  }
  return 'Recepção / Voluntário';
}

/**
 * Retorna o rótulo curto para exibição em badges
 */
export function getRoleShortLabel(role?: UserRole | string | null): string {
  const r = (role || '').toLowerCase().trim();
  if (r === 'admin' || r.includes('diretor') || r.includes('administrador')) {
    return 'Diretoria';
  }
  if (
    r === 'servico_social' ||
    r === 'servico-social' ||
    r.includes('social') ||
    r.includes('assist')
  ) {
    return 'Serviço Social';
  }
  return 'Recepção';
}

/**
 * Classes Tailwind da badge colorida de acordo com o perfil
 */
export function getRoleBadgeClasses(role?: UserRole | string | null): {
  badge: string;
  dot: string;
  border: string;
} {
  const r = (role || '').toLowerCase().trim();
  if (r === 'admin' || r.includes('diretor') || r.includes('administrador')) {
    return {
      badge: 'bg-purple-100 text-purple-900 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
      dot: 'bg-purple-600 dark:bg-purple-400',
      border: 'border-purple-300 dark:border-purple-700'
    };
  }
  if (
    r === 'servico_social' ||
    r === 'servico-social' ||
    r.includes('social') ||
    r.includes('assist')
  ) {
    return {
      badge: 'bg-emerald-100 text-emerald-900 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
      dot: 'bg-emerald-600 dark:bg-emerald-400',
      border: 'border-emerald-300 dark:border-emerald-700'
    };
  }
  return {
    badge: 'bg-sky-100 text-sky-900 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
    dot: 'bg-sky-600 dark:bg-sky-400',
    border: 'border-sky-300 dark:border-sky-700'
  };
}

/**
 * Checagens de Permissões:
 */
export function canDeleteAssistido(role?: UserRole | string | null): boolean {
  const r = (role || '').toLowerCase().trim();
  return r === 'admin' || r.includes('diretor') || r.includes('administrador');
}

export function canEditAssistido(role?: UserRole | string | null): boolean {
  const r = (role || '').toLowerCase().trim();
  return (
    r === 'admin' ||
    r.includes('diretor') ||
    r.includes('administrador') ||
    r === 'servico_social' ||
    r.includes('social') ||
    r.includes('assist')
  );
}

export function canRegisterAvaliacao(role?: UserRole | string | null): boolean {
  const r = (role || '').toLowerCase().trim();
  return (
    r === 'admin' ||
    r.includes('diretor') ||
    r.includes('administrador') ||
    r === 'servico_social' ||
    r.includes('social') ||
    r.includes('assist')
  );
}

export function canCreateAssistido(_role?: UserRole | string | null): boolean {
  return true;
}

export function canManageTeam(role?: UserRole | string | null): boolean {
  const r = (role || '').toLowerCase().trim();
  return r === 'admin' || r.includes('diretor') || r.includes('administrador');
}
