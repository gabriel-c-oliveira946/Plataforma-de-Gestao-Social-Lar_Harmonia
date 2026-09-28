/**
 * Utilitários para Lógica de Cálculo de 4 Meses (120 dias) e Avaliação de Acompanhamento FLH.
 */

export interface AssistidoParaAvaliacao {
  id?: string;
  data_ingresso?: string | null;
  created_at?: string | null;
  status_curso?: string | null;
  expectativa_curso?: string | null;
  servicos_acompanhamento?: string[] | null;
  avaliacao_4_meses?: any;
}

/**
 * Verifica se o status do assistido corresponde a "Ativo" / "Em Acompanhamento".
 */
export function isStatusAtivo(status?: string | null): boolean {
  if (!status) return true; // padrão no sistema é Ativo / Em Acompanhamento
  const s = status.toLowerCase().trim();
  if (
    s.includes('desist') ||
    s.includes('evas') ||
    s.includes('conclu') ||
    s.includes('formad') ||
    s.includes('trancad') ||
    s.includes('pausad') ||
    s.includes('desligad')
  ) {
    return false;
  }
  return s.includes('ativo') || s.includes('acompanhamento');
}

/**
 * Calcula a quantidade de dias corridos desde a data de ingresso (ou created_at) até hoje.
 */
export function getDiasIngresso(dataIngresso?: string | null, createdAt?: string | null): number | null {
  const dataStr = dataIngresso || createdAt;
  if (!dataStr) return null;

  const dateOnly = dataStr.includes('T') ? dataStr.split('T')[0] : dataStr;
  const parts = dateOnly.split('-');
  let entryDate: Date;

  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    entryDate = new Date(year, month, day);
  } else {
    entryDate = new Date(dataStr);
  }

  if (isNaN(entryDate.getTime())) return null;

  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const entryMidnight = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate());

  const diffTime = todayMidnight.getTime() - entryMidnight.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Verifica se a Avaliação de 4 Meses já foi registrada para o assistido.
 */
export function hasAvaliacao4Meses(item: AssistidoParaAvaliacao): boolean {
  if (item.avaliacao_4_meses != null && item.avaliacao_4_meses !== '' && item.avaliacao_4_meses !== false) {
    return true;
  }

  if (
    item.expectativa_curso?.toLowerCase().includes('avaliação 4 meses') ||
    item.expectativa_curso?.toLowerCase().includes('avaliacao 4 meses')
  ) {
    return true;
  }

  if (
    Array.isArray(item.servicos_acompanhamento) &&
    item.servicos_acompanhamento.some((s) => {
      const lower = s.toLowerCase();
      return (
        lower.includes('avaliação de 4 meses') ||
        lower.includes('avaliacao de 4 meses') ||
        lower.includes('avaliação 4 meses') ||
        lower.includes('avaliacao 4 meses')
      );
    })
  ) {
    return true;
  }

  return false;
}

/**
 * Um assistido é considerado "Pendente de Avaliação de 4 Meses" se:
 * 1. (Data Atual - data_ingresso) >= 120 dias (ou 4 meses)
 * 2. O 'status' atual do assistido for 'Ativo'
 * 3. O campo/registro de 'avaliacao_4_meses' ainda não foi preenchido.
 */
export function isPendenteAvaliacao4Meses(item: AssistidoParaAvaliacao): boolean {
  if (!isStatusAtivo(item.status_curso)) {
    return false;
  }

  if (hasAvaliacao4Meses(item)) {
    return false;
  }

  const dias = getDiasIngresso(item.data_ingresso, item.created_at);
  if (dias === null) {
    return false;
  }

  return dias >= 120;
}

/**
 * Opções para o filtro dedicado "Avaliação de 4 Meses".
 */
export const FILTRO_AVALIACAO_4_MESES = [
  'Todos',
  '⚠️ Pendentes de Avaliação (>= 4 Meses)',
  '⏳ Em Acompanhamento (< 4 Meses)',
  '✅ Avaliação Concluída'
] as const;

export type TipoFiltroAvaliacao4Meses = (typeof FILTRO_AVALIACAO_4_MESES)[number];
