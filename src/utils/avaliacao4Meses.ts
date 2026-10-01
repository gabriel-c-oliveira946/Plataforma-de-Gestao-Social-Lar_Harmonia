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
  'Pendentes de Avaliação (>= 4 Meses)',
  'Em Acompanhamento (< 4 Meses)',
  'Avaliação Concluída'
] as const;

export interface Avaliacao4MesesParsed {
  data_avaliacao: string;
  status_final_curso: 'Concluiu Oficina' | 'Desistiu (Evasão)' | 'Continua em Acompanhamento';
  motivo_evasao?: string;
  impacto_gerado:
    | 'Conseguiu Emprego'
    | 'Abriu Pequeno Negócio'
    | 'Aumentou Renda em Casa'
    | 'Sem Alteração Renda'
    | 'Outro';
  mudanca_autonomia_qualidade_vida: string;
}

/**
 * Helper para extrair Data de Saída registrada na expectativa_curso
 */
export function getAssistidoDataSaida(item: { expectativa_curso?: string | null }): string | null {
  if (item?.expectativa_curso?.includes('Data de Saída:')) {
    const match = item.expectativa_curso.match(/Data de Saída:\s*([^|]+)/);
    if (match && match[1]?.trim()) {
      return match[1].trim();
    }
  }
  return null;
}

/**
 * Helper robusto para extrair avaliação de 4 meses registrada com motivo de evasão
 */
export function getAvaliacao4Meses(item: { expectativa_curso?: string | null }): Avaliacao4MesesParsed | null {
  if (!item?.expectativa_curso) return null;
  const match = item.expectativa_curso.match(
    /\[Avaliação 4 Meses\s*-\s*([^\]]+)\]\s*([\s\S]*?)(?:$|\|(?:\s*\[|\s*Data de Saída|\s*Oficina|$))/i
  );
  if (!match) return null;

  const dataAvaliacao = match[1].trim();
  const blocoConteudo = match[2];

  let statusFinalCurso: 'Concluiu Oficina' | 'Desistiu (Evasão)' | 'Continua em Acompanhamento' = 'Concluiu Oficina';
  let motivoEvasao = '';
  let impactoGerado: Avaliacao4MesesParsed['impacto_gerado'] = 'Aumentou Renda em Casa';
  let depoimento = '';

  // 1. Extrair Status e Motivo dentro do bloco
  const statusMatch = blocoConteudo.match(/Status:\s*([^|]+)/i);
  if (statusMatch) {
    const statusRaw = statusMatch[1].trim();
    const lower = statusRaw.toLowerCase();

    if (lower.includes('desist') || lower.includes('evas')) {
      statusFinalCurso = 'Desistiu (Evasão)';

      // Extrai motivo que venha após "Desistiu (Evasão)"
      // Suporta:
      // - "Desistiu (Evasão) (Mudança de endereço)"
      // - "Desistiu (Evasão) - Mudança de endereço"
      // - "Desistiu (Evasão): Mudança de endereço"
      const doubleParen = statusRaw.match(/Desistiu\s*\((?:Evasão|Evasao)\)\s*\(([^)]+)\)/i);
      if (
        doubleParen &&
        doubleParen[1].trim() &&
        !doubleParen[1].toLowerCase().includes('evas')
      ) {
        motivoEvasao = doubleParen[1].trim();
      } else {
        const hyphenOrColon = statusRaw.match(
          /Desistiu\s*\((?:Evasão|Evasao)\)\s*[-:]\s*(.+)$/i
        );
        if (hyphenOrColon && hyphenOrColon[1].trim()) {
          motivoEvasao = hyphenOrColon[1].trim();
        } else {
          // Pega parêntese que NÃO seja "(Evasão)"
          const parens = Array.from(statusRaw.matchAll(/\(([^)]+)\)/g))
            .map((p) => p[1].trim())
            .filter((p) => !p.toLowerCase().includes('evas'));
          if (parens.length > 0) {
            motivoEvasao = parens[parens.length - 1];
          }
        }
      }
    } else if (lower.includes('continua') || lower.includes('acompanh')) {
      statusFinalCurso = 'Continua em Acompanhamento';
    } else {
      statusFinalCurso = 'Concluiu Oficina';
    }
  }

  // 2. Extrair Motivo se estiver em tag dedicada "| Motivo da Evasão: ... |" ou similar
  const tagMotivo = blocoConteudo.match(
    /(?:Motivo\s*(?:da|de)?\s*(?:Evas[ãa]o|Desist[êe]ncia)|Motivo\s*Evas[ãa]o\s*\/?\s*Desist[êe]ncia|Motivo):\s*([^|]+)/i
  );
  if (tagMotivo && tagMotivo[1]?.trim()) {
    motivoEvasao = tagMotivo[1].trim();
  }

  // Limpar prefixo "Motivo:" se duplicado e aspas
  if (motivoEvasao) {
    motivoEvasao = motivoEvasao.replace(/^Motivo:\s*/i, '').trim();
    motivoEvasao = motivoEvasao.replace(/^["']|["']$/g, '').trim();
  }

  // 3. Extrair Impacto
  const impactoMatch = blocoConteudo.match(/Impacto:\s*([^|]+)/i);
  if (impactoMatch && impactoMatch[1]?.trim()) {
    impactoGerado = impactoMatch[1].trim() as any;
  }

  // 4. Extrair Depoimento / Observações
  const depoimentoMatch = blocoConteudo.match(/Depoimento:\s*([\s\S]*?)(?:\||$)/i);
  if (depoimentoMatch && depoimentoMatch[1]?.trim()) {
    depoimento = depoimentoMatch[1].trim();
  }

  return {
    data_avaliacao: dataAvaliacao,
    status_final_curso: statusFinalCurso,
    motivo_evasao: motivoEvasao || undefined,
    impacto_gerado: impactoGerado,
    mudanca_autonomia_qualidade_vida: depoimento
  };
}

/**
 * Helper para extrair Motivo da Evasão geral do assistido (seja da Avaliação 4M, tags na ficha ou status)
 */
export function getAssistidoMotivoEvasao(item?: { expectativa_curso?: string | null; status_curso?: string | null; [key: string]: any } | null): string | null {
  if (!item) return null;

  // 0. Propriedade direta no objeto (se houver)
  if (typeof (item as any).motivo_evasao === 'string' && (item as any).motivo_evasao.trim()) {
    return (item as any).motivo_evasao.trim();
  }

  // 1. Tentar extrair de tags diretas na expectativa_curso (ex: "Motivo da Evasão: Mudança de endereço")
  if (item.expectativa_curso) {
    const matchTag = item.expectativa_curso.match(
      /(?:Motivo\s*(?:da|de)?\s*(?:Evas[ãa]o|Desist[êe]ncia)|Motivo\s*Evas[ãa]o\s*\/?\s*Desist[êe]ncia):\s*([^|]+)/i
    );
    if (matchTag && matchTag[1]?.trim()) {
      const clean = matchTag[1].trim().replace(/^["']|["']$/g, '').trim();
      if (clean) return clean;
    }
  }

  // 2. Tentar extrair da Avaliação de 4 Meses
  const av = getAvaliacao4Meses(item);
  if (av?.motivo_evasao && av.motivo_evasao.trim()) {
    return av.motivo_evasao.trim();
  }

  // 3. Tentar extrair do status_curso se contiver parênteses com motivo específico
  if (item.status_curso) {
    // Ex: "Desistiu (Evasão) (Mudança de endereço)"
    const doubleParen = item.status_curso.match(/Desist[^\(]*\((?:Evas[ãa]o|Evasao)\)\s*\(([^)]+)\)/i);
    if (
      doubleParen &&
      doubleParen[1]?.trim() &&
      !doubleParen[1].toLowerCase().includes('evas')
    ) {
      return doubleParen[1].trim();
    }

    // Ex: "Desistente / Evasão - Mudança de endereço" ou "Desistiu: Mudança"
    const hyphenOrColon = item.status_curso.match(/Desist[^\-:]*[-:]\s*(.+)$/i);
    if (
      hyphenOrColon &&
      hyphenOrColon[1]?.trim() &&
      !hyphenOrColon[1].toLowerCase().includes('evas')
    ) {
      return hyphenOrColon[1].trim();
    }

    if (item.status_curso.includes('(')) {
      const parens = Array.from(item.status_curso.matchAll(/\(([^)]+)\)/g))
        .map((p) => p[1].trim())
        .filter((p) => !p.toLowerCase().includes('evas'));
      if (parens.length > 0) {
        return parens[parens.length - 1];
      }
    }
  }

  return null;
}

export type TipoFiltroAvaliacao4Meses = (typeof FILTRO_AVALIACAO_4_MESES)[number];
