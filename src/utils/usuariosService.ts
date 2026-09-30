import { supabase } from '../lib/supabase/client';
import { UserRole, mapCargoToEnumRole, mapRoleToCargoFormatado } from '../types/auth';
import {
  atualizarCargoMembro,
  getEquipeList,
  saveMembroLocal,
  desativarMembroEquipe as desativarMembroEquipeLocal,
  saveInativo,
  saveMensagemDesativacao
} from './equipe';
import { notify } from '../context/ToastContext';

export interface UpdateCargoParams {
  membroId: string;
  novoCargo: string;
  role?: UserRole;
  email?: string;
  showAlert?: boolean;
}

export interface DesativarUsuarioParams {
  membroId: string;
  email?: string;
  mensagem?: string;
  showAlert?: boolean;
}

/**
 * Mapeia qualquer valor textual de cargo para as chaves exatas do ENUM postgres 'user_role':
 * - "Recepção" / "recepcao" -> "recepcao"
 * - "Serviço Social" / "servico_social" / "social" -> "servico_social"
 * - "Administrador" / "Admin" / "admin" -> "admin"
 */
export function mapearCargoParaEnum(cargoOuRole?: string | null): UserRole {
  return mapCargoToEnumRole(cargoOuRole);
}

/**
 * Retorna o texto formatado para exibição do cargo (ex: 'Admin', 'Serviço Social', 'Recepção')
 */
export function formatarNomeCargo(cargoOuRole?: string | null): string {
  return mapRoleToCargoFormatado(cargoOuRole);
}

/**
 * Desativa o acesso de um membro da equipe gravando diretamente no Supabase na tabela 'profiles':
 * .update({ status: 'inativo', ativo: false, mensagem_desativacao: mensagemDigitada })
 * .eq('id', membroId)
 */
export async function desativarMembroEquipe(
  membroId: string,
  email?: string,
  mensagem?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const mensagemDigitada = mensagem?.trim() || null;

    // 1. Gravação obrigatória e direta no Supabase na tabela 'profiles'
    const hasUrl = typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL;
    if (hasUrl && membroId) {
      let { error: profileError } = await supabase
        .from('profiles')
        .update({
          status: 'inativo',
          ativo: false,
          cargo: 'Inativo',
          mensagem_desativacao: mensagemDigitada
        })
        .eq('id', membroId);

      // Tratamento de resiliência caso alguma coluna opcional ainda não exista no schema remoto
      if (profileError && (profileError.message?.includes('mensagem_desativacao') || profileError.message?.includes('column'))) {
        console.warn('Tentando fallback sem mensagem_desativacao em profiles:', profileError.message);
        const retry1 = await supabase
          .from('profiles')
          .update({
            status: 'inativo',
            ativo: false,
            cargo: 'Inativo'
          })
          .eq('id', membroId);
        profileError = retry1.error;
      }

      if (profileError && profileError.message?.includes('ativo')) {
        const retry2 = await supabase
          .from('profiles')
          .update({
            status: 'inativo',
            cargo: 'Inativo'
          })
          .eq('id', membroId);
        profileError = retry2.error;
      }

      if (profileError && profileError.message?.includes('status')) {
        const retry3 = await supabase
          .from('profiles')
          .update({
            cargo: 'Inativo'
          })
          .eq('id', membroId);
        profileError = retry3.error;
      }

      if (profileError) {
        console.error('Erro ao gravar desativação em profiles no Supabase:', profileError);
        return { success: false, error: profileError.message };
      }
    }

    // 2. Sincroniza também no armazenamento local e nos helpers da aplicação
    if (membroId) saveInativo(membroId);
    if (email) saveInativo(email);
    if (mensagemDigitada) {
      if (membroId) saveMensagemDesativacao(membroId, mensagemDigitada);
      if (email) saveMensagemDesativacao(email, mensagemDigitada);
    }

    await desativarMembroEquipeLocal(membroId, email, mensagemDigitada || undefined);

    return { success: true };
  } catch (err: any) {
    const errorMsg = err?.message || 'Erro inesperado ao desativar membro da equipe.';
    console.error('Erro em desativarMembroEquipe:', err);
    return { success: false, error: errorMsg };
  }
}

/**
 * Alias de compatibilidade para removerMembroEquipe
 */
export const removerMembroEquipe = desativarMembroEquipe;

/**
 * Desativa o acesso de um membro da equipe com suporte a notificações na UI
 */
export async function desativarUsuario({
  membroId,
  email,
  mensagem,
  showAlert = true
}: DesativarUsuarioParams): Promise<{ success: boolean; error?: string }> {
  const result = await desativarMembroEquipe(membroId, email, mensagem);
  if (!result.success && showAlert) {
    notify.error('Erro ao desativar acesso', result.error);
  }
  return result;
}

/**
 * Atualiza o cargo de um membro da equipe no Supabase respeitando o enum 'user_role':
 * - .update({ cargo: novoCargoFormatado, role: chaveEnumMapeada }).eq('id', membroId)
 * - Sincronização local e retorno de status para recarregar a equipe
 */
export async function atualizarCargoUsuario({
  membroId,
  novoCargo,
  role,
  email,
  showAlert = true
}: UpdateCargoParams): Promise<{ success: boolean; error?: string }> {
  try {
    const chaveEnumMapeada = mapCargoToEnumRole(role || novoCargo);
    const novoCargoFormatado = mapRoleToCargoFormatado(novoCargo || role);

    try {
      const hasUrl = typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL;
      if (hasUrl) {
        await supabase
          .from('profiles')
          .update({
            cargo: novoCargoFormatado,
            role: chaveEnumMapeada
          })
          .eq('id', membroId);
      }
    } catch (supabaseErr) {
      console.warn('Supabase não acessível ao atualizar cargo, atualizando localmente:', supabaseErr);
    }

    // 2. Sincroniza no armazenamento local e helper de equipe
    await atualizarCargoMembro({
      id: membroId,
      email,
      role: chaveEnumMapeada,
      cargo: novoCargoFormatado
    });

    return { success: true };
  } catch (err: any) {
    const errorMsg = err?.message || 'Erro inesperado ao atualizar cargo no Supabase.';
    console.error('Erro inesperado em atualizarCargoUsuario:', err);
    if (showAlert) {
      notify.error('Erro ao atualizar cargo', errorMsg);
    }
    return { success: false, error: errorMsg };
  }
}

export const usuariosService = {
  atualizarCargo: atualizarCargoUsuario,
  desativarUsuario,
  desativarMembroEquipe,
  removerMembroEquipe,
  mapearCargoParaEnum,
  formatarNomeCargo,
  getEquipeList,
  saveMembroLocal
};

export default usuariosService;

