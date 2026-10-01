import {
  UserProfile,
  UserRole,
  parseUserRole,
  getUserDisplayName,
  getRoleCargo,
  mapCargoToEnumRole,
  mapRoleToCargoFormatado
} from '../types/auth';
import { supabase } from '../lib/supabase/client';
import { createClient } from '@supabase/supabase-js';

const STORAGE_KEY_EQUIPE = 'lar_harmonia_equipe_custom';
const STORAGE_KEY_INATIVOS = 'lar_harmonia_inativos';
const STORAGE_KEY_INATIVOS_MENSAGENS = 'lar_harmonia_inativos_mensagens';

/**
 * Normaliza strings removendo acentos e convertendo para minúsculas
 */
export function normalizeText(str?: string | null): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Limpa obrigatoriamente o e-mail, ID e username do usuário de TODAS as chaves de cache e bloqueio local
 * (ex: membros_inativos, desativados, inativos, contas_inativas, bloqueados, etc.)
 */
export function limparCacheBloqueioLocal(
  id?: string | null,
  email?: string | null,
  usernameOrNome?: string | null
): void {
  const targets = [id, email, usernameOrNome]
    .filter(Boolean)
    .map((s) => s!.toLowerCase().trim());

  if (targets.length === 0) return;

  const normalizedTargets = targets.map((t) => normalizeText(t));

  // 1. Chaves conhecidas de listas de identificadores inativos
  const knownListKeys = [
    'lar_harmonia_inativos',
    'membros_inativos',
    'desativados',
    'usuarios_desativados',
    'inativos',
    'contas_inativas',
    'bloqueados',
    'membros_bloqueados',
    'lar_harmonia_desativados',
    'equipe_inativos'
  ];

  for (const key of knownListKeys) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((item: any) => {
            if (typeof item === 'string') {
              const itemClean = item.toLowerCase().trim();
              const itemNorm = normalizeText(item);
              return (
                !targets.includes(itemClean) &&
                !normalizedTargets.includes(itemNorm)
              );
            }
            if (typeof item === 'object' && item !== null) {
              const itemEmail = item.email?.toLowerCase().trim();
              const itemId = item.id?.toLowerCase().trim();
              const itemUsername = item.username?.toLowerCase().trim();
              const itemNome = item.nome ? normalizeText(item.nome) : '';
              return !(
                (itemEmail && targets.includes(itemEmail)) ||
                (itemId && targets.includes(itemId)) ||
                (itemUsername && targets.includes(itemUsername)) ||
                (itemNome && normalizedTargets.includes(itemNome))
              );
            }
            return true;
          });
          localStorage.setItem(key, JSON.stringify(filtered));
        }
      }
    } catch {}
  }

  // 2. Chaves conhecidas de mapas de mensagens personalizadas
  const knownMapKeys = [
    'lar_harmonia_inativos_mensagens',
    'inativos_mensagens',
    'mensagens_desativacao',
    'desativados_mensagens',
    'recados_desativacao'
  ];

  for (const key of knownMapKeys) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const map = JSON.parse(raw);
        if (typeof map === 'object' && map !== null) {
          let changed = false;
          for (const t of targets) {
            if (t in map) {
              delete map[t];
              changed = true;
            }
          }
          if (changed) {
            localStorage.setItem(key, JSON.stringify(map));
          }
        }
      }
    } catch {}
  }

  // 3. Varrer dinamicamente qualquer outra chave que possa ter sido criada com termos de inatividade
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      const lowerK = k.toLowerCase();
      if (
        lowerK.includes('inativ') ||
        lowerK.includes('desativ') ||
        lowerK.includes('bloque')
      ) {
        const val = localStorage.getItem(k);
        if (!val) continue;
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed)) {
            const filtered = parsed.filter((item: any) => {
              if (typeof item === 'string') {
                const itemClean = item.toLowerCase().trim();
                return !targets.includes(itemClean);
              }
              if (typeof item === 'object' && item !== null) {
                const itemEmail = item.email?.toLowerCase().trim();
                const itemId = item.id?.toLowerCase().trim();
                return !(
                  (itemEmail && targets.includes(itemEmail)) ||
                  (itemId && targets.includes(itemId))
                );
              }
              return true;
            });
            localStorage.setItem(k, JSON.stringify(filtered));
          } else if (typeof parsed === 'object' && parsed !== null) {
            let mod = false;
            for (const t of targets) {
              if (t in parsed) {
                delete parsed[t];
                mod = true;
              }
            }
            if (mod) localStorage.setItem(k, JSON.stringify(parsed));
          }
        } catch {
          if (targets.includes(val.toLowerCase().trim())) {
            localStorage.removeItem(k);
          }
        }
      }
    }
  } catch {}

  // 4. Sincronizar o status 'ativo' no cache principal da equipe (STORAGE_KEY_EQUIPE)
  try {
    const equipeRaw = localStorage.getItem(STORAGE_KEY_EQUIPE);
    if (equipeRaw) {
      const membros: UserProfile[] = JSON.parse(equipeRaw);
      if (Array.isArray(membros)) {
        const updated = membros.map((m) => {
          const isMatch =
            (m.id && targets.includes(m.id.toLowerCase().trim())) ||
            (m.email && targets.includes(m.email.toLowerCase().trim())) ||
            (m.nome && normalizedTargets.includes(normalizeText(m.nome)));

          if (isMatch) {
            const restoredRole =
              m.role && m.role !== ('inativo' as any) ? m.role : 'servico_social';
            const restoredCargo =
              m.cargo && m.cargo !== 'Inativo'
                ? m.cargo
                : restoredRole === 'admin'
                ? 'Admin'
                : getRoleCargo(restoredRole);
            return {
              ...m,
              status: 'ativo' as const,
              ativo: true,
              role: restoredRole,
              cargo: restoredCargo,
              mensagem_desativacao: undefined,
              data_desativacao: undefined
            };
          }
          return m;
        });
        localStorage.setItem(STORAGE_KEY_EQUIPE, JSON.stringify(updated));
      }
    }
  } catch {}
}

const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  'https://placeholder-larharmonia.supabase.co';
const supabaseAnonKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  'placeholder-anon-key';

/**
 * Mapa de mensagens personalizadas enviadas pela administração aos membros desativados
 */
export function getInativosMensagensMap(): Record<string, { mensagem: string; data: string }> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_INATIVOS_MENSAGENS);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Retorna a mensagem personalizada de desativação deixada pelo administrador para o operador
 */
export function getMensagemDesativacao(idOrEmail?: string | null): string | null {
  if (!idOrEmail) return null;
  const clean = idOrEmail.toLowerCase().trim();

  // 1. Consulta mapa persistente de mensagens de desativação
  const map = getInativosMensagensMap();
  if (map[clean]?.mensagem) {
    return map[clean].mensagem;
  }

  // 2. Consulta membros cadastrados localmente
  const locais = getMembrosLocais();
  const found = locais.find(
    (m) =>
      m.id === clean ||
      (m.email && m.email.toLowerCase() === clean)
  );
  if (found?.mensagem_desativacao) {
    return found.mensagem_desativacao;
  }

  return null;
}

/**
 * Registra a mensagem personalizada de desativação associada a um operador
 */
export function saveMensagemDesativacao(idOrEmail: string, mensagem: string): void {
  try {
    const map = getInativosMensagensMap();
    const clean = idOrEmail.toLowerCase().trim();
    map[clean] = {
      mensagem: mensagem.trim(),
      data: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY_INATIVOS_MENSAGENS, JSON.stringify(map));
  } catch {}
}

/**
 * Remove a mensagem personalizada de desativação caso a conta seja reativada
 */
export function removeMensagemDesativacao(idOrEmail: string): void {
  try {
    const map = getInativosMensagensMap();
    const clean = idOrEmail.toLowerCase().trim();
    if (map[clean]) {
      delete map[clean];
      localStorage.setItem(STORAGE_KEY_INATIVOS_MENSAGENS, JSON.stringify(map));
    }
  } catch {}
}

/**
 * Retorna a lista de IDs e e-mails de operadores com acesso desativado
 */
export function getInativosList(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_INATIVOS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Registra um ID ou e-mail na lista de contas inativas
 */
export function saveInativo(idOrEmail: string): void {
  try {
    const list = getInativosList();
    const clean = idOrEmail.toLowerCase().trim();
    if (!list.includes(clean)) {
      list.push(clean);
      localStorage.setItem(STORAGE_KEY_INATIVOS, JSON.stringify(list));
    }
  } catch {}
}

/**
 * Remove um ID ou e-mail da lista de contas inativas
 */
export function removeInativo(idOrEmail: string): void {
  try {
    const list = getInativosList();
    const clean = idOrEmail.toLowerCase().trim();
    const filtered = list.filter((item) => item.toLowerCase() !== clean);
    localStorage.setItem(STORAGE_KEY_INATIVOS, JSON.stringify(filtered));
  } catch {}
}

/**
 * Verifica se um e-mail ou ID pertence a uma conta desativada
 */
export function isEmailOrIdInativo(val?: string | null): boolean {
  if (!val) return false;
  const clean = val.toLowerCase().trim();
  const norm = normalizeText(clean);

  // 1. Checa primeiro os membros locais registrados
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EQUIPE);
    if (raw) {
      const membros: UserProfile[] = JSON.parse(raw);
      const found = membros.find(
        (m) =>
          m.id?.toLowerCase() === clean ||
          (m.email && m.email.toLowerCase() === clean) ||
          (m.nome && normalizeText(m.nome) === norm)
      );
      if (found) {
        if (found.status === 'inativo' || found.ativo === false) return true;
        if (found.status === 'ativo' || found.ativo === true) return false;
      }
    }
  } catch {}

  // 2. Checa lista persistente de inativos
  const inativos = getInativosList();
  if (
    inativos.some(
      (item) => item.toLowerCase().trim() === clean || normalizeText(item) === norm
    )
  ) {
    return true;
  }

  // 3. Checa chaves adicionais de bloqueio
  const additionalKeys = [
    'membros_inativos',
    'desativados',
    'usuarios_desativados',
    'inativos',
    'bloqueados'
  ];
  for (const k of additionalKeys) {
    try {
      const raw = localStorage.getItem(k);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          if (
            parsed.some(
              (x: any) =>
                typeof x === 'string' &&
                (x.toLowerCase().trim() === clean || normalizeText(x) === norm)
            )
          ) {
            return true;
          }
        }
      }
    } catch {}
  }

  return false;
}

/**
 * Verifica se o usuário autenticado ou perfil está marcado como inativo
 */
export function isUsuarioInativo(userOrEmailOrId: any): boolean {
  if (!userOrEmailOrId) return false;

  // Objeto User do Supabase
  if (typeof userOrEmailOrId === 'object') {
    const user = userOrEmailOrId;
    if (user.user_metadata?.status === 'inativo') return true;
    if (user.user_metadata?.ativo === false) return true;
    if (user.app_metadata?.status === 'inativo') return true;
    if (user.app_metadata?.ativo === false) return true;

    if (user.email && isEmailOrIdInativo(user.email)) return true;
    if (user.id && isEmailOrIdInativo(user.id)) return true;
    return false;
  }

  // String (email ou id)
  if (typeof userOrEmailOrId === 'string') {
    return isEmailOrIdInativo(userOrEmailOrId);
  }

  return false;
}

/**
 * Cliente isolado para criação de novos usuários no Supabase Auth.
 * `persistSession: false` garante que a sessão do admin logado não seja substituída ao executar signUp.
 */
export const authIsolatedClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

/**
 * Retorna os membros cadastrados localmente
 */
export function getMembrosLocais(): UserProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EQUIPE);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Salva um membro cadastrado no armazenamento persistente da aplicação
 */
export function saveMembroLocal(membro: UserProfile): void {
  try {
    const list = getMembrosLocais();
    const filtered = list.filter(
      (m) =>
        m.id !== membro.id &&
        (!membro.email || !m.email || m.email.toLowerCase() !== membro.email.toLowerCase())
    );
    filtered.push(membro);
    localStorage.setItem(STORAGE_KEY_EQUIPE, JSON.stringify(filtered));
  } catch {
    // Ignora erros de storage
  }
}

/**
 * Adiciona um membro diretamente na lista de membros locais da equipe
 */
export function addMembroEquipe(membro: Omit<UserProfile, 'id'> & { id?: string }): UserProfile {
  const newMember: UserProfile = {
    id: membro.id || `user-${Date.now()}`,
    ...membro,
    ativo: membro.ativo !== false
  };
  saveMembroLocal(newMember);
  return newMember;
}

/**
 * Cadastra um novo membro / operador diretamente no Supabase Auth:
 * - Chama `supabase.auth.signUp` com o e-mail, senha e `user_metadata: { nome, cargo }`.
 * - Não desloga nem substitui a sessão do administrador atual.
 */
export async function cadastrarNovoMembroSupabase({
  nome,
  email,
  password,
  cargo,
  role
}: {
  nome: string;
  email: string;
  password: string;
  cargo: string;
  role: UserRole;
}): Promise<{ user?: any; error?: string }> {
  try {
    if (email) removeInativo(email);

    // 1. Chamar Supabase Auth SignUp passando os dados no user_metadata
    const { data, error } = await authIsolatedClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          nome,
          cargo,
          role,
          status: 'ativo',
          ativo: true
        }
      }
    });

    if (error) {
      return { error: error.message };
    }

    const newId = data.user?.id || `user-${Date.now()}`;
    const newMember: UserProfile = {
      id: newId,
      email,
      nome,
      role,
      cargo,
      status: 'ativo',
      ativo: true
    };

    // 2. Persistir na lista da equipe para consulta imediata
    saveMembroLocal(newMember);

    // 3. Tentar registrar na tabela profiles se acessível
    try {
      await supabase.from('profiles').insert([
        {
          id: newId,
          nome,
          role: mapCargoToEnumRole(role),
          cargo: mapRoleToCargoFormatado(cargo || role)
        }
      ]);
    } catch {
      // Ignora erro de inserção direta se tabela tiver RLS
    }

    return { user: data.user || newMember };
  } catch (err: any) {
    return { error: err?.message || 'Erro inesperado ao cadastrar operador no Supabase.' };
  }
}

/**
 * Retorna a lista de membros da equipe:
 * - Inclui o usuário atualmente autenticado
 * - Inclui operadores cadastrados e registros no Supabase profiles
 * - Por padrão inclui ativos e inativos com suas flags `status` e `ativo` definidas
 */
export async function getEquipeList(
  currentUser?: any,
  includeInactives: boolean = true
): Promise<UserProfile[]> {
  const uniqueList: UserProfile[] = [];
  const seenIds = new Set<string>();
  const seenEmails = new Set<string>();

  // 1. Usuário atual logado na sessão ativa
  if (currentUser) {
    const isInactive = isUsuarioInativo(currentUser);
    if (!isInactive || includeInactives) {
      const currentRole = parseUserRole(currentUser);
      const currentName = getUserDisplayName(currentUser);
      const currentCargo = getRoleCargo(currentRole);
      const currentProfile: UserProfile = {
        id: currentUser.id,
        email: currentUser.email,
        nome: currentName,
        role: currentRole,
        cargo: currentCargo,
        status: isInactive ? 'inativo' : 'ativo',
        ativo: !isInactive
      };
      uniqueList.push(currentProfile);
      seenIds.add(currentProfile.id);
      if (currentProfile.email) {
        seenEmails.add(currentProfile.email.toLowerCase());
      }
    }
  }

  // 2. Membros cadastrados através do armazenamento persistente
  const locais = getMembrosLocais();
  for (const m of locais) {
    const isInactive =
      m.status === 'inativo' ||
      m.ativo === false ||
      isUsuarioInativo(m.id) ||
      (m.email && isUsuarioInativo(m.email));

    if (isInactive && !includeInactives) {
      continue;
    }

    const emailKey = m.email?.toLowerCase();
    if (!seenIds.has(m.id) && (!emailKey || !seenEmails.has(emailKey))) {
      uniqueList.push({
        ...m,
        status: isInactive ? 'inativo' : 'ativo',
        ativo: !isInactive,
        cargo:
          isInactive && m.cargo === 'Inativo'
            ? m.role === 'admin'
              ? 'Admin'
              : getRoleCargo(m.role)
            : m.cargo
      });
      seenIds.add(m.id);
      if (emailKey) seenEmails.add(emailKey);
    }
  }

  // 3. Membros da tabela `profiles` do Supabase se existirem
  try {
    const { data } = await supabase.from('profiles').select('*').limit(50);
    if (data && data.length > 0) {
      for (const row of data) {
        const isInactive =
          row.cargo === 'Inativo' ||
          row.status === 'inativo' ||
          row.role === 'inativo' ||
          isUsuarioInativo(row.id) ||
          (row.email && isUsuarioInativo(row.email));

        if (isInactive && !includeInactives) {
          continue;
        }

        const emailKey = row.email?.toLowerCase();
        if (!seenIds.has(row.id) && (!emailKey || !seenEmails.has(emailKey))) {
          const role: UserRole =
            row.role === 'admin'
              ? 'admin'
              : row.role === 'recepcao'
              ? 'recepcao'
              : row.role === 'servico_social'
              ? 'servico_social'
              : row.cargo?.toLowerCase().includes('admin') || row.cargo?.toLowerCase().includes('diretor')
              ? 'admin'
              : row.cargo?.toLowerCase().includes('recep')
              ? 'recepcao'
              : 'servico_social';

          const prof: UserProfile = {
            id: row.id,
            email: row.email,
            nome: row.nome || 'Operador Social',
            role,
            cargo:
              row.cargo && row.cargo !== 'Inativo'
                ? row.cargo
                : role === 'admin'
                ? 'Admin'
                : getRoleCargo(role),
            status: isInactive ? 'inativo' : 'ativo',
            ativo: !isInactive
          };
          uniqueList.push(prof);
          seenIds.add(row.id);
          if (emailKey) seenEmails.add(emailKey);
        }
      }
    }
  } catch {
    // Ignora se profiles estiver vazia ou com RLS
  }

  return uniqueList;
}

/**
 * Resolve o nome legível e cargo de quem realizou o cadastro ou alteração
 */
export function getOperadorInfo(
  userIdOrString?: string | null,
  currentUser?: any
): { nome: string; cargo: string } {
  if (!userIdOrString) {
    return {
      nome: 'Equipe Lar Harmonia',
      cargo: 'Serviço Social'
    };
  }

  const str = userIdOrString.trim();

  // 1. Se for o usuário atualmente logado (por ID ou E-mail)
  if (
    currentUser &&
    (str === currentUser.id ||
      str.toLowerCase() === (currentUser.email || '').toLowerCase())
  ) {
    const role = parseUserRole(currentUser);
    return {
      nome: getUserDisplayName(currentUser),
      cargo: getRoleCargo(role)
    };
  }

  // 2. Se for uma string já formatada como "Nome (Cargo)"
  if (str.includes('(') && str.includes(')')) {
    const match = str.match(/^([^(]+)\(([^)]+)\)/);
    if (match) {
      return { nome: match[1].trim(), cargo: match[2].trim() };
    }
  }

  // 3. Buscar nos membros cadastrados da equipe
  const locais = getMembrosLocais();
  const found = locais.find(
    (m) =>
      m.id === str ||
      m.email?.toLowerCase() === str.toLowerCase() ||
      m.nome.toLowerCase() === str.toLowerCase()
  );
  if (found) {
    return { nome: found.nome, cargo: found.cargo };
  }

  // 4. Se for e-mail
  if (str.includes('@')) {
    const prefix = str.split('@')[0];
    const words = prefix.split(/[._-]/).filter((w) => isNaN(Number(w)));
    const formattedName =
      words.length > 0
        ? words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        : prefix;
    return {
      nome: formattedName,
      cargo: str.includes('admin') ? 'Diretoria' : 'Serviço Social'
    };
  }

  // 5. Se for UUID de operador não mapeado
  if (str.length === 36 && str.includes('-')) {
    return {
      nome: 'Assistente Social Responsável',
      cargo: 'Serviço Social'
    };
  }

  // 6. Texto puro
  return {
    nome: str,
    cargo: 'Operador Social'
  };
}

/**
 * Localiza o e-mail atrelado a um nome de usuário, nome completo ou identificador:
 * - Se contiver '@', retorna diretamente o e-mail informado.
 * - Permite buscar por primeiro nome ou nome completo (ex: "visitante", "Visitante", "Maria", "Maria Silva").
 * - Executa busca insensível a maiúsculas/minúsculas (ilike) na tabela `profiles` do Supabase nos campos `nome` e `email`.
 * - Caso o usuário digite um nome como "visitante", garante que encontre "visitante@larharmonia.org" mesmo com espaços ou acentos.
 */
export async function resolveEmailFromUsername(input: string): Promise<string | null> {
  const trimmed = (input || '').trim();
  if (!trimmed) return null;
  if (trimmed.includes('@')) return trimmed.toLowerCase();

  const norm = normalizeText(trimmed);
  const noSpaces = norm.replace(/\s+/g, '');
  const withDots = norm.replace(/\s+/g, '.');
  const words = norm.split(/\s+/).filter(Boolean);
  const firstWord = words[0] || '';

  // 1. Caso especial: "visitante" (com acentos, espaços ou maiúsculas/minúsculas)
  // Garante a resolução imediata para visitante@larharmonia.org
  if (noSpaces === 'visitante' || firstWord === 'visitante') {
    return 'visitante@larharmonia.org';
  }

  // 2. Busca insensível a maiúsculas/minúsculas (ilike) na tabela 'profiles' do Supabase
  // nos campos 'nome' e 'email'
  try {
    const cleanSearch = trimmed.replace(/[%_,]/g, '');

    // Busca ampla com ilike em 'nome' OU 'email'
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, nome, email, cargo, role, status, ativo')
      .or(`nome.ilike.%${cleanSearch}%,email.ilike.%${cleanSearch}%`)
      .limit(30);

    if (!error && profiles && profiles.length > 0) {
      // a) Prefixo exato do e-mail (ex: "ana" para "ana@larharmonia.org")
      const byEmailPrefix = profiles.find((p) => {
        if (!p.email) return false;
        const prefix = normalizeText(p.email.split('@')[0]);
        return prefix === norm || prefix === noSpaces || prefix === withDots;
      });
      if (byEmailPrefix?.email) return byEmailPrefix.email.toLowerCase();

      // b) Nome completo exato normalizado (ex: "Maria Silva" ou "maria silva")
      const byFullName = profiles.find((p) => {
        if (!p.nome) return false;
        const pNorm = normalizeText(p.nome);
        return (
          pNorm === norm ||
          pNorm.replace(/\s+/g, '') === noSpaces ||
          pNorm.replace(/\s+/g, '.') === withDots
        );
      });
      if (byFullName?.email) return byFullName.email.toLowerCase();

      // c) Primeiro nome (ex: "Maria" para perfil com nome "Maria Silva")
      const byFirstName = profiles.find((p) => {
        if (!p.nome) return false;
        const pFirst = normalizeText(p.nome).split(/\s+/)[0];
        return pFirst === firstWord || pFirst === norm;
      });
      if (byFirstName?.email) return byFirstName.email.toLowerCase();

      // d) Substring no nome ou e-mail
      const bySubstring = profiles.find((p) => {
        const pNome = p.nome ? normalizeText(p.nome) : '';
        const pEmail = p.email ? normalizeText(p.email) : '';
        return (
          pNome.includes(norm) ||
          pEmail.includes(norm) ||
          (firstWord.length >= 3 && pNome.includes(firstWord))
        );
      });
      if (bySubstring?.email) return bySubstring.email.toLowerCase();

      // e) Se algum perfil encontrado possui e-mail cadastrado
      for (const p of profiles) {
        if (p.email) return p.email.toLowerCase();
      }
    }

    // Se o usuário digitou nome composto ou sobrenome e a consulta inicial não encontrou,
    // tenta busca específica no campo 'nome' pelo primeiro nome
    if (firstWord && firstWord !== norm && firstWord.length >= 3) {
      const { data: firstProfiles } = await supabase
        .from('profiles')
        .select('id, nome, email, cargo, role, status, ativo')
        .ilike('nome', `%${firstWord}%`)
        .limit(10);

      if (firstProfiles && firstProfiles.length > 0) {
        const match = firstProfiles.find((p) => {
          if (!p.nome) return false;
          const pFirst = normalizeText(p.nome).split(/\s+/)[0];
          return pFirst === firstWord;
        });
        if (match?.email) return match.email.toLowerCase();
        if (firstProfiles[0]?.email) return firstProfiles[0].email.toLowerCase();
      }
    }
  } catch (err) {
    console.warn('Erro ao consultar profiles via ilike no Supabase:', err);
  }

  // 3. Consultar lista e diretório de membros da equipe no armazenamento local/memória
  try {
    const equipe = await getEquipeList(undefined, true);

    // a. Prefixo exato do e-mail
    const byPrefix = equipe.find((m) => {
      if (!m.email) return false;
      const prefix = normalizeText(m.email.split('@')[0]);
      return prefix === norm || prefix === noSpaces;
    });
    if (byPrefix?.email) return byPrefix.email.toLowerCase();

    // b. Correspondência de nome completo (com ou sem acentos)
    const byExactName = equipe.find(
      (m) => m.nome && normalizeText(m.nome) === norm
    );
    if (byExactName?.email) return byExactName.email.toLowerCase();

    // c. Correspondência sem espaços
    const byNormalizedName = equipe.find((m) => {
      if (!m.nome) return false;
      const clean = normalizeText(m.nome).replace(/\s+/g, '');
      return clean === noSpaces || clean === norm;
    });
    if (byNormalizedName?.email) return byNormalizedName.email.toLowerCase();

    // d. Primeiro nome (ex: "Maria", "Visitante")
    const byFirstName = equipe.find((m) => {
      if (!m.nome) return false;
      const pFirst = normalizeText(m.nome).split(/\s+/)[0];
      return pFirst === firstWord || pFirst === norm;
    });
    if (byFirstName?.email) return byFirstName.email.toLowerCase();

    // e. Substring no nome
    const bySubstring = equipe.find(
      (m) => m.nome && normalizeText(m.nome).includes(norm)
    );
    if (bySubstring?.email) return bySubstring.email.toLowerCase();
  } catch {
    // Continua para próxima tentativa se equipe falhar
  }

  // 4. Identificadores de administração comuns
  if (
    ['admin', 'administrador', 'diretoria', 'diretor', 'gabriel'].includes(noSpaces) ||
    ['admin', 'administrador'].includes(firstWord)
  ) {
    const admin = getMembrosLocais().find((m) => m.role === 'admin' && m.email);
    if (admin?.email) return admin.email.toLowerCase();
    return 'gabriel.costaoliveira77@gmail.com';
  }

  // 5. Se for um handle simples (ex: "recepcao", "ana", "social"), tentar no domínio institucional
  if (/^[a-zA-Z0-9._-]+$/.test(withDots)) {
    return `${withDots}@larharmonia.org`;
  }

  return null;
}

/**
 * Atualiza o cargo e papel de um membro da equipe (Admin, Serviço Social ou Recepção).
 * Sincroniza o armazenamento persistente local, o user_metadata no Supabase e a tabela profiles.
 */
export async function atualizarCargoMembro({
  id,
  email,
  role,
  cargo
}: {
  id: string;
  email?: string;
  role: UserRole;
  cargo?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const finalCargo = cargo || (role === 'admin' ? 'Admin' : getRoleCargo(role));

    // 1. Atualizar no armazenamento local persistente (incluindo user_metadata)
    const locais = getMembrosLocais();
    let found = false;
    const updated = locais.map((m) => {
      if (m.id === id || (email && m.email && m.email.toLowerCase() === email.toLowerCase())) {
        found = true;
        return {
          ...m,
          role,
          cargo: finalCargo,
          user_metadata: {
            ...((m as any).user_metadata || {}),
            role,
            cargo: finalCargo
          }
        };
      }
      return m;
    });

    if (!found) {
      updated.push({
        id,
        email,
        nome: 'Operador Social',
        role,
        cargo: finalCargo,
        ativo: true,
        user_metadata: {
          role,
          cargo: finalCargo
        }
      } as any);
    }

    localStorage.setItem(STORAGE_KEY_EQUIPE, JSON.stringify(updated));

    // 2. Atualizar user_metadata no Supabase Auth
    try {
      // 2.1 Se o usuário for a sessão ativa
      const { data: authUser } = await supabase.auth.getUser();
      if (authUser?.user && authUser.user.id === id) {
        await supabase.auth.updateUser({
          data: {
            role,
            cargo: finalCargo
          }
        });
      }

      // 2.2 Tentar via Supabase Admin API se disponível no client
      if ((supabase.auth as any)?.admin?.updateUserById) {
        await (supabase.auth as any).admin.updateUserById(id, {
          user_metadata: {
            role,
            cargo: finalCargo
          }
        });
      }

      // 2.3 Tentar via RPC personalizada no Supabase caso exista no banco
      try {
        await supabase.rpc('update_user_metadata', {
          target_user_id: id,
          new_role: role,
          new_cargo: finalCargo
        });
      } catch {}
    } catch (authErr) {
      console.warn('Tentativa de sincronizar user_metadata no Supabase:', authErr);
    }

    // 3. Atualizar na tabela profiles do Supabase
    try {
      const enumRole = mapCargoToEnumRole(role || finalCargo);
      const { error: profErr } = await supabase
        .from('profiles')
        .update({
          cargo: finalCargo,
          role: enumRole
        })
        .eq('id', id);

      if (profErr) {
        console.error('Erro ao atualizar cargo e role em profiles:', profErr);
      }
    } catch (e) {
      console.error('Não foi possível atualizar profiles no Supabase:', e);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erro ao atualizar cargo do operador.' };
  }
}

/**
 * Desativa o acesso de um membro da equipe (ao invés de tentar exclusão destrutiva no auth.users).
 * - Registra status = 'inativo' e ativo = false na lista de inativos e no perfil.
 * - Sincroniza o armazenamento persistente local e a tabela profiles.
 */
export async function desativarMembroEquipe(
  id: string,
  email?: string,
  mensagem?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Registrar na lista de identificadores inativos persistentes
    if (id) saveInativo(id);
    if (email) saveInativo(email);

    // Se houver mensagem personalizada fornecida pelo administrador, salvar
    const trimmedMsg = mensagem?.trim();
    if (trimmedMsg) {
      if (id) saveMensagemDesativacao(id, trimmedMsg);
      if (email) saveMensagemDesativacao(email, trimmedMsg);
    } else {
      // Se não houver mensagem, remover mensagens antigas se houver
      if (id) removeMensagemDesativacao(id);
      if (email) removeMensagemDesativacao(email);
    }

    // 2. Marcar no armazenamento local como status: 'inativo', ativo: false, com mensagem se houver
    const locais = getMembrosLocais();
    let found = false;
    const updated = locais.map((m) => {
      if (m.id === id || (email && m.email && m.email.toLowerCase() === email.toLowerCase())) {
        found = true;
        return {
          ...m,
          status: 'inativo' as const,
          ativo: false,
          mensagem_desativacao: trimmedMsg || undefined,
          data_desativacao: new Date().toISOString()
        };
      }
      return m;
    });

    if (!found) {
      updated.push({
        id,
        email,
        nome: email ? email.split('@')[0] : 'Operador Social',
        role: 'recepcao',
        cargo: 'Inativo',
        status: 'inativo',
        ativo: false,
        mensagem_desativacao: trimmedMsg || undefined,
        data_desativacao: new Date().toISOString()
      });
    }

    localStorage.setItem(STORAGE_KEY_EQUIPE, JSON.stringify(updated));

    // 3. Atualizar na tabela profiles do Supabase como inativo
    try {
      let { error: profErr } = await supabase
        .from('profiles')
        .update({
          cargo: 'Inativo',
          status: 'inativo',
          ativo: false,
          mensagem_desativacao: trimmedMsg || null
        })
        .eq('id', id);

      if (profErr && (profErr.message?.includes('mensagem_desativacao') || profErr.message?.includes('column'))) {
        const retry1 = await supabase
          .from('profiles')
          .update({
            cargo: 'Inativo',
            status: 'inativo',
            ativo: false
          })
          .eq('id', id);
        profErr = retry1.error;
      }

      if (profErr && profErr.message?.includes('ativo')) {
        const retry2 = await supabase
          .from('profiles')
          .update({
            cargo: 'Inativo',
            status: 'inativo'
          })
          .eq('id', id);
        profErr = retry2.error;
      }

      if (profErr && profErr.message?.includes('status')) {
        await supabase
          .from('profiles')
          .update({
            cargo: 'Inativo'
          })
          .eq('id', id);
      }
    } catch (e) {
      console.warn('Não foi possível atualizar status em profiles no Supabase:', e);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erro ao desativar acesso do operador.' };
  }
}

/**
 * Reativa o acesso de um membro da equipe que estava desativado/inativo:
 * - Remove o ID e e-mail da lista persistente de inativos e mensagens associadas.
 * - Atualiza status = 'ativo' e ativo = true no armazenamento persistente local e Supabase.
 * - Restaura o cargo e papel adequados do operador.
 */
export async function reativarMembroEquipe(
  id: string,
  email?: string,
  usernameOrNome?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. LIMPEZA DO LOCALSTORAGE: Remova obrigatoriamente o e-mail, ID e username do usuário
    // de TODAS as chaves de cache/bloqueio local (ex: membros_inativos, desativados, etc.)
    limparCacheBloqueioLocal(id, email, usernameOrNome);

    if (id) {
      removeInativo(id);
      removeMensagemDesativacao(id);
    }
    if (email) {
      removeInativo(email);
      removeMensagemDesativacao(email);
    }
    if (usernameOrNome) {
      removeInativo(usernameOrNome);
      removeMensagemDesativacao(usernameOrNome);
    }

    // 2. Atualizar no armazenamento local persistente
    const locais = getMembrosLocais();
    let restoredRole: UserRole = 'servico_social';
    let restoredCargo = 'Serviço Social';
    let found = false;

    const updated = locais.map((m) => {
      if (
        m.id === id ||
        (email && m.email && m.email.toLowerCase() === email.toLowerCase()) ||
        (usernameOrNome && m.nome && normalizeText(m.nome) === normalizeText(usernameOrNome))
      ) {
        found = true;
        restoredRole = m.role && m.role !== ('inativo' as any) ? m.role : 'servico_social';
        restoredCargo =
          m.cargo && m.cargo !== 'Inativo'
            ? m.cargo
            : restoredRole === 'admin'
            ? 'Admin'
            : getRoleCargo(restoredRole);

        return {
          ...m,
          role: restoredRole,
          cargo: restoredCargo,
          status: 'ativo' as const,
          ativo: true,
          mensagem_desativacao: undefined,
          data_desativacao: undefined,
          user_metadata: {
            ...((m as any).user_metadata || {}),
            status: 'ativo',
            ativo: true,
            role: restoredRole,
            cargo: restoredCargo
          }
        };
      }
      return m;
    });

    if (!found) {
      updated.push({
        id,
        email,
        nome: usernameOrNome || (email ? email.split('@')[0] : 'Operador Social'),
        role: restoredRole,
        cargo: restoredCargo,
        status: 'ativo',
        ativo: true,
        user_metadata: {
          status: 'ativo',
          ativo: true,
          role: restoredRole,
          cargo: restoredCargo
        }
      });
    }

    localStorage.setItem(STORAGE_KEY_EQUIPE, JSON.stringify(updated));

    // 3. Atualizar no Supabase Auth se for a sessão ativa ou via admin/rpc
    try {
      const { data: authUser } = await supabase.auth.getUser();
      if (authUser?.user && authUser.user.id === id) {
        await supabase.auth.updateUser({
          data: {
            status: 'ativo',
            ativo: true,
            cargo: restoredCargo,
            role: restoredRole
          }
        });
      }

      if ((supabase.auth as any)?.admin?.updateUserById) {
        await (supabase.auth as any).admin.updateUserById(id, {
          user_metadata: {
            status: 'ativo',
            ativo: true,
            cargo: restoredCargo,
            role: restoredRole
          }
        });
      }

      try {
        await supabase.rpc('update_user_status', {
          target_user_id: id,
          new_status: 'ativo'
        });
      } catch {}
    } catch (authErr) {
      console.warn('Tentativa de sincronizar reativação no Supabase Auth:', authErr);
    }

    // 4. ATUALIZAÇÃO NO SUPABASE:
    // Execute o UPDATE na tabela `profiles` no Supabase definindo:
    // status = 'ativo', ativo = true e mensagem_desativacao = NULL
    try {
      const enumRole = mapCargoToEnumRole(restoredRole);
      const cargoFmt = mapRoleToCargoFormatado(restoredCargo || restoredRole);

      let { error: profErr } = await supabase
        .from('profiles')
        .update({
          status: 'ativo',
          ativo: true,
          mensagem_desativacao: null,
          cargo: cargoFmt,
          role: enumRole
        })
        .eq('id', id);

      // Tratamento resiliente caso colunas específicas de versão variem no banco
      if (
        profErr &&
        (profErr.message?.includes('mensagem_desativacao') ||
          profErr.message?.includes('column'))
      ) {
        const retry1 = await supabase
          .from('profiles')
          .update({
            status: 'ativo',
            ativo: true,
            cargo: cargoFmt,
            role: enumRole
          })
          .eq('id', id);
        profErr = retry1.error;
      }

      if (profErr && profErr.message?.includes('ativo')) {
        const retry2 = await supabase
          .from('profiles')
          .update({
            status: 'ativo',
            cargo: cargoFmt,
            role: enumRole
          })
          .eq('id', id);
        profErr = retry2.error;
      }

      if (profErr && profErr.message?.includes('status')) {
        await supabase
          .from('profiles')
          .update({
            cargo: cargoFmt,
            role: enumRole
          })
          .eq('id', id);
      }

      // Se houver e-mail associado, garante atualização também por e-mail caso o ID difira
      if (email) {
        try {
          await supabase
            .from('profiles')
            .update({
              status: 'ativo',
              ativo: true,
              mensagem_desativacao: null,
              cargo: cargoFmt,
              role: enumRole
            })
            .ilike('email', email);
        } catch {}
      }
    } catch (e) {
      console.warn('Não foi possível atualizar status em profiles no Supabase:', e);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erro ao reativar operador da equipe.' };
  }
}

/**
 * Alias mantido para compatibilidade
 */
export const removerMembroEquipe = desativarMembroEquipe;

/**
 * Consulta assíncrona do nome e cargo na tabela 'profiles' usando o ID do operador
 */
export async function getOperadorProfileById(
  operadorId?: string | null
): Promise<{ nome: string; cargo: string } | null> {
  if (!operadorId || !operadorId.trim()) return null;
  const cleanId = operadorId.trim();

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nome, cargo, role, email')
      .eq('id', cleanId)
      .maybeSingle();

    if (!error && data) {
      const cargoFmt =
        data.cargo && data.cargo !== 'Inativo'
          ? data.cargo
          : data.role === 'admin'
          ? 'Diretoria / Administrador'
          : data.role === 'recepcao'
          ? 'Recepção'
          : 'Serviço Social';

      return {
        nome: data.nome || 'Operador Social',
        cargo: cargoFmt
      };
    }
  } catch (err) {
    console.warn('Erro ao consultar profile por id:', err);
  }

  return null;
}


