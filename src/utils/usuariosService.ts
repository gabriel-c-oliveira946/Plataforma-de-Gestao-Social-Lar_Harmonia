import { supabase } from '../lib/supabase/client';
import { UserRole, mapCargoToEnumRole, mapRoleToCargoFormatado } from '../types/auth';
import { atualizarCargoMembro, getEquipeList, saveMembroLocal } from './equipe';

export interface UpdateCargoParams {
  membroId: string;
  novoCargo: string;
  role?: UserRole;
  email?: string;
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
 * Atualiza o cargo de um membro da equipe no Supabase respeitando o enum 'user_role':
 * - .update({ cargo: novoCargoFormatado, role: chaveEnumMapeada }).eq('id', membroId)
 * - Tratamento de erro visível (alert e console.error)
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

    // 1. Gravação no Supabase: 'cargo' recebe texto legível e 'role' recebe o valor exato do ENUM Postgres
    const { error } = await supabase
      .from('profiles')
      .update({
        cargo: novoCargoFormatado,
        role: chaveEnumMapeada
      })
      .eq('id', membroId);

    if (error) {
      console.error('Erro ao atualizar cargo no Supabase:', error);
      if (showAlert && typeof window !== 'undefined') {
        window.alert(`Erro ao atualizar cargo no Supabase: ${error.message}`);
      }
      return { success: false, error: error.message };
    }

    // 2. Sincroniza no armazenamento local e helper de equipe
    await atualizarCargoMembro({
      id: membroId,
      email,
      role: chaveEnumMapeada,
      cargo: novoCargoFormatado
    });

    // 3. Alerta de sucesso
    if (showAlert && typeof window !== 'undefined') {
      window.alert('Cargo atualizado com sucesso!');
    }

    return { success: true };
  } catch (err: any) {
    const errorMsg = err?.message || 'Erro inesperado ao atualizar cargo no Supabase.';
    console.error('Erro inesperado em atualizarCargoUsuario:', err);
    if (showAlert && typeof window !== 'undefined') {
      window.alert(`Erro: ${errorMsg}`);
    }
    return { success: false, error: errorMsg };
  }
}

export const usuariosService = {
  atualizarCargo: atualizarCargoUsuario,
  mapearCargoParaEnum,
  formatarNomeCargo,
  getEquipeList,
  saveMembroLocal
};

export default usuariosService;

