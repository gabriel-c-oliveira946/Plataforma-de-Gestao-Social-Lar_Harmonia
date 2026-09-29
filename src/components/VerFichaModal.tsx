import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getOperadorInfo } from '../utils/equipe';
import {
  isPendenteAvaliacao4Meses,
  hasAvaliacao4Meses,
  isStatusAtivo,
  getDiasIngresso
} from '../utils/avaliacao4Meses';
export { isPendenteAvaliacao4Meses };
import {
  X,
  User,
  Phone,
  Calendar,
  Home,
  Briefcase,
  DollarSign,
  HeartPulse,
  GraduationCap,
  AlertTriangle,
  Building2,
  Users,
  Wifi,
  Trash2,
  Edit3,
  Save,
  Lock,
  CheckCircle2,
  Clock,
  Printer,
  Droplets,
  Zap,
  ShieldCheck,
  Baby,
  FileText,
  Sparkles,
  Target,
  Heart,
  Info,
  Check,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Eye,
  Award,
  Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase/client';
import { assistidosService } from '../services/assistidosService';
import { useToast } from '../context/ToastContext';
import {
  CadastroFormData,
  INITIAL_CADASTRO_FORM
} from '../types/cadastro';
import { formatCPF, formatRG } from '../utils/masks';
import { TabIdentificacao } from './cadastro/TabIdentificacao';
import { TabTrabalhoRenda } from './cadastro/TabTrabalhoRenda';
import { TabMoradiaFamilia } from './cadastro/TabMoradiaFamilia';
import { TabVulnerabilidades } from './cadastro/TabVulnerabilidades';
import { TabMotivacoes } from './cadastro/TabMotivacoes';

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

// Helper para extrair Data de Saída se houver
export function getAssistidoDataSaida(item: Assistido): string | null {
  if (item.expectativa_curso?.includes('Data de Saída:')) {
    const match = item.expectativa_curso.match(/Data de Saída:\s*([^|]+)/);
    if (match && match[1]?.trim()) {
      return match[1].trim();
    }
  }
  return null;
}

// Helper para extrair avaliação de 4 meses registrada
export function getAvaliacao4Meses(item: Assistido): Avaliacao4MesesParsed | null {
  if (!item.expectativa_curso) return null;
  const match = item.expectativa_curso.match(
    /\[Avaliação 4 Meses\s*-\s*([^\]]+)\]\s*Status:\s*([^|]+)\|\s*Impacto:\s*([^|]+)\|\s*Depoimento:\s*([\s\S]*?)(?:\||$)/
  );
  if (match) {
    let statusRaw = match[2].trim();
    let motivo = '';
    const motMatch = statusRaw.match(/^([^(]+)\s*\(([^)]+)\)/);
    if (motMatch) {
      statusRaw = motMatch[1].trim();
      motivo = motMatch[2].trim();
    }
    return {
      data_avaliacao: match[1].trim(),
      status_final_curso: (statusRaw as any) || 'Concluiu Oficina',
      motivo_evasao: motivo,
      impacto_gerado: (match[3].trim() as any) || 'Aumentou Renda em Casa',
      mudanca_autonomia_qualidade_vida: match[4].trim()
    };
  }
  return null;
}

export interface Assistido {
  id: string;
  nome_completo: string;
  rg?: string | null;
  cpf?: string | null;
  data_nascimento?: string | null;
  idade?: number | null;
  raca_cor?: string | null;
  telefone?: string | null;
  endereco?: string | null;
  bairro?: string | null;
  escolaridade?: string | null;
  estado_civil?: string | null;
  possui_cadastro_flh?: boolean | null;
  possui_cras?: boolean | null;
  bairro_cras?: string | null;
  composicao_familiar?: number | null;
  quantidade_filhos?: number | null;
  atividade_remunerada?: string | null;
  profissao?: string | null;
  acesso_internet?: string | null;
  renda_familiar_aproximada?: number | null;
  beneficios_sociais?: string[] | null;
  tipo_moradia?: string | null;
  servicos_basicos_regulares?: boolean | null;
  dificuldades_enfrentadas?: string[] | null;
  rede_apoio?: string | null;
  fatores_risco_evasao?: string[] | null;
  possui_deficiencia?: boolean | null;
  tipos_deficiencia?: string[] | null;
  doencas_cronicas_familia?: string[] | string | null;
  servicos_acompanhamento?: string[] | null;
  motivo_busca?: string | null;
  expectativa_curso?: string | null;
  objetivo_profissional_3_meses?: string | null;
  curso_pretendido?: string | null;
  cursos_anteriores?: string[] | string | null;
  status_curso?: string | null;
  data_ingresso?: string | null;
  foto_url?: string | null;
  created_at?: string | null;
  criado_por?: string | null;
  atualizado_por?: string | null;
  updated_at?: string | null;
}

interface VerFichaModalProps {
  assistido: Assistido;
  onClose: () => void;
  onDelete?: (assistido: Assistido) => void;
  isAdmin: boolean;
  onAssistidoUpdated: (updated: Assistido) => void;
}

/**
 * Converte os dados do registro do Supabase para a estrutura completa do formulário (5 Abas)
 */
export function convertAssistidoToFormData(assistido: Assistido): CadastroFormData {
  // 1. Moradia & Infraestrutura
  const rawMoradia = assistido.tipo_moradia || '';
  const moradiaParts = rawMoradia.split(' | ').map((p) => p.trim());
  const tipoMoradia = moradiaParts[0] || 'Não informado';
  let agua: 'Regular' | 'Irregular' = 'Regular';
  let energia: 'Regular' | 'Irregular' = 'Regular';
  let servicosGerais: 'Sim' | 'Parcialmente' | 'Irregular' = assistido.servicos_basicos_regulares
    ? 'Sim'
    : 'Parcialmente';
  let filhos =
    assistido.quantidade_filhos !== undefined && assistido.quantidade_filhos !== null
      ? Number(assistido.quantidade_filhos)
      : 0;
  let obsMoradia = '';
  let faixaRendaFromMoradia = '';

  moradiaParts.forEach((p) => {
    if (p.startsWith('Água:')) {
      const v = p.replace('Água:', '').trim();
      if (v.toLowerCase().includes('irreg')) agua = 'Irregular';
    } else if (p.startsWith('Energia:')) {
      const v = p.replace('Energia:', '').trim();
      if (v.toLowerCase().includes('irreg')) energia = 'Irregular';
    } else if (p.startsWith('Serviços Básicos Gerais:') || p.startsWith('Serviços Gerais:')) {
      const v = p.split(':')[1]?.trim() || '';
      if (v.toLowerCase().includes('parcial')) servicosGerais = 'Parcialmente';
      else if (v.toLowerCase().includes('irreg') || v.toLowerCase().includes('não'))
        servicosGerais = 'Irregular';
      else if (v.toLowerCase().includes('sim') || v.toLowerCase().includes('regul'))
        servicosGerais = 'Sim';
    } else if (p.startsWith('Filhos:') || p.startsWith('Quantidade de Filhos:')) {
      const fVal = Number(p.split(':')[1]?.trim());
      if (!isNaN(fVal)) filhos = fVal;
    } else if (p.startsWith('Faixa de Renda:')) {
      faixaRendaFromMoradia = p.replace('Faixa de Renda:', '').trim();
    } else if (p.startsWith('Obs:')) {
      obsMoradia = p.replace('Obs:', '').trim();
    }
  });

  // 2. Faixa de Renda
  let faixaRenda = faixaRendaFromMoradia;
  if (!faixaRenda && assistido.profissao?.includes('Renda Familiar:')) {
    const match = assistido.profissao.match(/Renda Familiar:\s*([^|]+)/);
    if (match && match[1]?.trim()) {
      faixaRenda = match[1].trim();
    }
  }
  if (!faixaRenda) {
    const val = Number(assistido.renda_familiar_aproximada);
    if (isNaN(val) || val === 0) faixaRenda = 'Sem Renda (R$ 0)';
    else if (val <= 600) faixaRenda = 'Até R$ 600';
    else if (val <= 1200) faixaRenda = 'De R$ 601 a R$ 1.200';
    else if (val <= 2000) faixaRenda = 'De R$ 1.201 a R$ 2.000';
    else if (val <= 3500) faixaRenda = 'De R$ 2.001 a R$ 3.500';
    else if (val <= 5000) faixaRenda = 'De R$ 3.501 a R$ 5.000';
    else faixaRenda = 'Acima de R$ 5.000';
  }

  // 3. Trabalho & Ocupação
  const rawProf = assistido.profissao || '';
  const isRemunerada = assistido.atividade_remunerada === 'Sim';
  let ocupacao = '';
  let diasSemanaArr: string[] = [];
  let turno = 'Manhã';
  let desempregoCircunstancia = '';
  let trabalhouAntes: 'Sim' | 'Não' = 'Sim';
  let areaAnterior = '';

  const profParts = rawProf.split(' | ').map((p) => p.trim());
  profParts.forEach((p) => {
    if (p.startsWith('Ocupação:')) {
      ocupacao = p.replace('Ocupação:', '').trim();
    } else if (p.startsWith('Dias:')) {
      const diasStr = p.replace('Dias:', '').trim();
      const allDias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
      diasSemanaArr = allDias.filter((d) => diasStr.includes(d));
    } else if (p.startsWith('Turno:')) {
      turno = p.replace('Turno:', '').trim() || 'Manhã';
    } else if (
      p.startsWith('Causa/Justificativa:') ||
      p.startsWith('Justificativa/Ações:') ||
      p.startsWith('Motivo/Ações:')
    ) {
      desempregoCircunstancia = p.split(':')[1]?.trim() || '';
    } else if (p.startsWith('Já trabalhou anteriormente:')) {
      const val = p.replace('Já trabalhou anteriormente:', '').trim();
      trabalhouAntes = val.toLowerCase().includes('não') ? 'Não' : 'Sim';
      const areaMatch = val.match(/\(([^)]+)\)/);
      if (areaMatch) areaAnterior = areaMatch[1].trim();
    } else if (p.startsWith('Trabalho anterior:')) {
      areaAnterior = p.replace('Trabalho anterior:', '').trim();
    } else if (p.includes('(Dias:') && p.includes('Turno:')) {
      const match = p.match(/^([^(]+)\s*\(Dias:\s*([^|]+)\|\s*Turno:\s*([^)]+)\)/);
      if (match) {
        ocupacao = match[1]?.trim() || '';
        const dStr = match[2]?.trim() || '';
        const allDias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
        diasSemanaArr = allDias.filter((d) => dStr.includes(d));
        turno = match[3]?.trim() || 'Manhã';
      }
    }
  });
  if (isRemunerada && !ocupacao && rawProf && !rawProf.includes('|')) {
    ocupacao = rawProf;
  }

  // 4. Programas Sociais
  const rawProgs = Array.isArray(assistido.beneficios_sociais) ? assistido.beneficios_sociais : [];
  let outroProg = '';
  const progs = rawProgs.map((p) => {
    if (p.startsWith('Outro:')) {
      outroProg = p.replace('Outro:', '').trim();
      return 'Outro';
    }
    return p;
  });

  // 5. Saúde da Família (Seção 11)
  const rawSaude = Array.isArray(assistido.doencas_cronicas_familia)
    ? assistido.doencas_cronicas_familia
    : typeof assistido.doencas_cronicas_familia === 'string'
    ? [assistido.doencas_cronicas_familia]
    : [];

  let saudeCronica = false;
  let saudeCronicaPar = '';
  let saudeCronicaMed = '';

  let saudeDep = false;
  let saudeDepPar = '';
  let saudeDepMed = '';

  let saudeMental = false;
  let saudeMentalPar = '';
  let saudeMentalMed = '';

  let saudeDef = Boolean(assistido.possui_deficiencia);
  let saudeDefPar = '';
  let saudeDefMed = '';

  let saudeOutra = false;
  let saudeOutraPar = '';
  let saudeOutraMed = '';

  rawSaude.forEach((item) => {
    if (item.startsWith('Doença Crônica:')) {
      saudeCronica = true;
      const content = item.replace('Doença Crônica:', '').trim();
      const match = content.match(/^([^(]+)\s*\(([^)]+)\)/);
      if (match) {
        saudeCronicaPar = match[1].trim();
        saudeCronicaMed = match[2].replace('Med/Tratamento:', '').replace('Tratamento:', '').trim();
      } else {
        saudeCronicaPar = content !== 'Sim' ? content : '';
      }
    } else if (item.startsWith('Dependência Química:')) {
      saudeDep = true;
      const content = item.replace('Dependência Química:', '').trim();
      const match = content.match(/^([^(]+)\s*\(([^)]+)\)/);
      if (match) {
        saudeDepPar = match[1].trim();
        saudeDepMed = match[2].trim();
      } else {
        saudeDepPar = content !== 'Sim' ? content : '';
      }
    } else if (item.startsWith('Saúde Mental:')) {
      saudeMental = true;
      const content = item.replace('Saúde Mental:', '').trim();
      const match = content.match(/^([^(]+)\s*\(([^)]+)\)/);
      if (match) {
        saudeMentalPar = match[1].trim();
        saudeMentalMed = match[2].trim();
      } else {
        saudeMentalPar = content !== 'Sim' ? content : '';
      }
    } else if (item.startsWith('Deficiência/Síndrome:') || item.startsWith('Deficiência:')) {
      saudeDef = true;
      const content = item.replace(/Deficiência(\/Síndrome)?:/, '').trim();
      const match = content.match(/^([^(]+)\s*\(([^)]+)\)/);
      if (match) {
        saudeDefPar = match[1].trim();
        saudeDefMed = match[2].trim();
      } else {
        saudeDefPar = content !== 'Sim' ? content : '';
      }
    } else if (item.startsWith('Outra Situação de Saúde:')) {
      saudeOutra = true;
      const content = item.replace('Outra Situação de Saúde:', '').trim();
      const match = content.match(/^([^(]+)\s*\(([^)]+)\)/);
      if (match) {
        saudeOutraPar = match[1].trim();
        saudeOutraMed = match[2].trim();
      } else {
        saudeOutraPar = content !== 'Sim' ? content : '';
      }
    }
  });

  // Se possuir deficiência na coluna booleana do assistido
  if (assistido.possui_deficiencia && !saudeDef) {
    saudeDef = true;
    if (Array.isArray(assistido.tipos_deficiencia) && assistido.tipos_deficiencia.length > 0) {
      saudeDefMed = assistido.tipos_deficiencia.filter((d) => d && d !== 'Nenhuma').join(', ');
    }
  }

  // 6. Expectativa & Motivações (Seção 12)
  const rawExp = assistido.expectativa_curso || '';
  let cursoPref: 'Sim' | 'Não' = 'Sim';
  let cursoPrefOutro = '';
  const oQuePretende: string[] = [];
  let oQuePretendeOutro = '';
  let representacaoFLH = '';
  const percepcaoHoje: string[] = [];
  let percepcaoOutro = '';
  let outrasOficinas = '';
  let naoTemInteresse = false;

  const expParts = rawExp.split(' | ').map((p) => p.trim());
  expParts.forEach((p) => {
    if (p.includes('Curso de preferência do assistido')) {
      cursoPref = 'Sim';
    } else if (p.startsWith('Preferência alternativa:')) {
      cursoPref = 'Não';
      cursoPrefOutro = p.replace('Preferência alternativa:', '').trim();
    } else if (p.startsWith('Pretende:')) {
      const itens = p.replace('Pretende:', '').trim().split(',').map((i) => i.trim());
      itens.forEach((it) => {
        if (it.startsWith('Outro:')) {
          oQuePretende.push('Outro');
          oQuePretendeOutro = it.replace('Outro:', '').trim();
        } else if (it) {
          oQuePretende.push(it);
        }
      });
    } else if (p.startsWith('Significado FLH:')) {
      representacaoFLH = p.replace('Significado FLH:', '').trim();
    } else if (p.startsWith('Percepção FLH:')) {
      const percs = p.replace('Percepção FLH:', '').trim().split(',').map((i) => i.trim());
      percs.forEach((it) => {
        if (it.startsWith('Outro:')) {
          percepcaoHoje.push('Outro');
          percepcaoOutro = it.replace('Outro:', '').trim();
        } else if (it) {
          percepcaoHoje.push(it);
        }
      });
    } else if (p.includes('Sem interesse em outras oficinas')) {
      naoTemInteresse = true;
    } else if (p.startsWith('Outras oficinas de interesse:')) {
      outrasOficinas = p.replace('Outras oficinas de interesse:', '').trim();
    }
  });

  // 7. Cursos anteriores
  let partCursosAntes: 'Sim' | 'Não' = 'Não';
  let cursosAntesDet = '';
  const rawCursos = assistido.cursos_anteriores;
  if (
    Array.isArray(rawCursos) &&
    rawCursos.length > 0 &&
    !rawCursos.includes('Não participou de cursos anteriores')
  ) {
    partCursosAntes = 'Sim';
    cursosAntesDet = rawCursos.join('; ');
  } else if (
    typeof rawCursos === 'string' &&
    rawCursos.trim() &&
    !rawCursos.toLowerCase().includes('não participou')
  ) {
    partCursosAntes = 'Sim';
    cursosAntesDet = rawCursos.trim();
  }

  const isRua =
    assistido.tipo_moradia?.toLowerCase().includes('rua') ||
    (assistido.endereco?.toLowerCase().includes('rua') &&
      assistido.endereco?.toLowerCase().includes('situação')) ||
    false;

  return {
    nome_completo: assistido.nome_completo || '',
    data_nascimento: assistido.data_nascimento || '',
    idade: assistido.idade ?? '',
    rg: assistido.rg || '',
    cpf: assistido.cpf || '',
    telefone: assistido.telefone || '',
    escolaridade: assistido.escolaridade || 'Não informado',
    estado_civil: assistido.estado_civil || 'Não informado',
    raca_cor: assistido.raca_cor || 'Não informado',
    endereco: assistido.endereco || '',
    bairro: assistido.bairro || '',
    em_situacao_rua: isRua,
    foto_url: assistido.foto_url || null,
    possui_cadastro_flh: Boolean(assistido.possui_cadastro_flh),
    possui_cras: Boolean(assistido.possui_cras),
    bairro_cras: assistido.bairro_cras || '',
    data_ingresso: assistido.data_ingresso
      ? assistido.data_ingresso.split('T')[0]
      : assistido.created_at
      ? assistido.created_at.split('T')[0]
      : new Date().toISOString().split('T')[0],
    status_acompanhamento: (assistido.status_curso as any) || 'Ativo / Em Acompanhamento',
    data_saida: (() => {
      const match = assistido.expectativa_curso?.match(/Data de Saída:\s*([^|]+)/);
      return match && match[1]?.trim() ? match[1].trim() : '';
    })(),

    atividade_remunerada: isRemunerada ? 'Sim' : 'Não',
    ocupacao_atual: ocupacao,
    turno_trabalho: turno,
    dias_semana_trabalho_array: diasSemanaArr,
    dias_semana_trabalho: diasSemanaArr.join(', '),
    desemprego_circunstancia: desempregoCircunstancia,
    trabalhou_anteriormente: trabalhouAntes,
    area_trabalho_anterior: areaAnterior,
    faixa_renda: faixaRenda,
    renda_aproximada_valor: assistido.renda_familiar_aproximada || 0,
    programas_sociais: progs.length > 0 ? progs : ['Nenhum'],
    outro_programa_social: outroProg,

    composicao_familiar: assistido.composicao_familiar || 1,
    mora_sozinho: assistido.composicao_familiar === 1 || isRua,
    quantidade_filhos: filhos,
    acesso_internet: assistido.acesso_internet === 'Sim' ? 'Sim' : 'Não',
    tipo_moradia: tipoMoradia,
    agua_regularidade: agua,
    energia_regularidade: energia,
    servicos_basicos_gerais: servicosGerais,
    observacoes_moradia: obsMoradia,

    dificuldades_familia:
      Array.isArray(assistido.dificuldades_enfrentadas) &&
      assistido.dificuldades_enfrentadas.length > 0
        ? assistido.dificuldades_enfrentadas
        : ['Nenhuma'],
    saude_doenca_cronica: saudeCronica,
    saude_doenca_cronica_parentesco: saudeCronicaPar,
    saude_doenca_cronica_medicamento: saudeCronicaMed,
    saude_doenca_cronica_detalhe: '',

    saude_dependencia_quimica: saudeDep,
    saude_dependencia_quimica_parentesco: saudeDepPar,
    saude_dependencia_quimica_medicamento: saudeDepMed,
    saude_dependencia_quimica_detalhe: '',

    saude_mental: saudeMental,
    saude_mental_parentesco: saudeMentalPar,
    saude_mental_medicamento: saudeMentalMed,
    saude_mental_detalhe: '',

    saude_deficiencia: saudeDef,
    saude_deficiencia_parentesco: saudeDefPar,
    saude_deficiencia_medicamento: saudeDefMed,
    saude_deficiencia_detalhe: '',

    saude_outra_situacao: saudeOutra,
    saude_outra_situacao_parentesco: saudeOutraPar,
    saude_outra_situacao_medicamento: saudeOutraMed,
    saude_outra_situacao_detalhe: '',

    rede_apoio_principal: assistido.rede_apoio || 'Não possui',
    fatores_risco_evasao:
      Array.isArray(assistido.fatores_risco_evasao) && assistido.fatores_risco_evasao.length > 0
        ? assistido.fatores_risco_evasao
        : ['Nenhum'],
    servicos_flh_utilizados:
      Array.isArray(assistido.servicos_acompanhamento) &&
      assistido.servicos_acompanhamento.length > 0
        ? assistido.servicos_acompanhamento
        : ['Nenhum / Nunca utilizou'],

    motivo_busca_momento: assistido.motivo_busca || '',
    oficina_pretendida: assistido.curso_pretendido || 'Informática',
    curso_e_preferencia: cursoPref,
    curso_preferencia_outro: cursoPrefOutro,
    o_que_pretende_fazer: oQuePretende,
    o_que_pretende_outro: oQuePretendeOutro,
    participou_cursos_anteriores: partCursosAntes,
    cursos_anteriores_concluiu: '',
    cursos_anteriores_detalhes: cursosAntesDet,
    objetivo_profissional_3_meses: assistido.objetivo_profissional_3_meses || '',
    representacao_flh_familia: representacaoFLH,
    percepcao_flh_hoje: percepcaoHoje,
    percepcao_flh_outro: percepcaoOutro,
    interesse_outras_oficinas: outrasOficinas,
    nao_tem_interesse_outras_oficinas: naoTemInteresse,
    status_atendimento: assistido.status_curso || 'Em Acompanhamento'
  };
}

export const VerFichaModal: React.FC<VerFichaModalProps> = ({
  assistido,
  onClose,
  onDelete,
  isAdmin,
  onAssistidoUpdated
}) => {
  const { user, canEdit, canEvaluate, canDelete } = useAuth();
  const toast = useToast();
  const canUserDelete = isAdmin || canDelete;
  const [showDirectConfirmModal, setShowDirectConfirmModal] = useState(false);

  // Auditoria do Operador (Requisito 3): Consulta na tabela 'profiles' usando o ID do operador
  const [operadorCadastro, setOperadorCadastro] = useState<{ nome: string; cargo: string }>(() =>
    getOperadorInfo(assistido.criado_por, user)
  );

  const [operadorAtualizacao, setOperadorAtualizacao] = useState<{ nome: string; cargo: string }>(() =>
    getOperadorInfo(assistido.atualizado_por || assistido.criado_por, user)
  );

  useEffect(() => {
    let isCancelled = false;

    async function carregarAuditoriaProfiles() {
      const fallbackCadastro = getOperadorInfo(assistido.criado_por, user);
      const fallbackAtualizacao = getOperadorInfo(
        assistido.atualizado_por || assistido.criado_por,
        user
      );

      const idCadastro = assistido.criado_por?.trim();
      const idAtualizacao = (assistido.atualizado_por || assistido.criado_por)?.trim();

      const idsToFetch = Array.from(
        new Set([idCadastro, idAtualizacao].filter((id): id is string => Boolean(id)))
      );

      if (idsToFetch.length === 0) {
        if (!isCancelled) {
          setOperadorCadastro(fallbackCadastro);
          setOperadorAtualizacao(fallbackAtualizacao);
        }
        return;
      }

      try {
        // Consulta direta na tabela 'profiles' usando o ID do operador
        const { data, error } = await supabase
          .from('profiles')
          .select('id, nome, cargo, role, email')
          .in('id', idsToFetch);

        if (!error && data && data.length > 0) {
          const map = new Map<string, { nome: string; cargo: string }>();
          data.forEach((p: any) => {
            const roleFormatted =
              p.cargo && p.cargo !== 'Inativo'
                ? p.cargo
                : p.role === 'admin'
                ? 'Diretoria / Administrador'
                : p.role === 'recepcao'
                ? 'Recepção'
                : 'Serviço Social';

            const info = {
              nome: p.nome || 'Operador Social',
              cargo: roleFormatted
            };
            if (p.id) map.set(p.id, info);
            if (p.email) map.set(p.email.toLowerCase(), info);
          });

          if (!isCancelled) {
            if (idCadastro && map.has(idCadastro)) {
              setOperadorCadastro(map.get(idCadastro)!);
            } else {
              setOperadorCadastro(fallbackCadastro);
            }

            if (idAtualizacao && map.has(idAtualizacao)) {
              setOperadorAtualizacao(map.get(idAtualizacao)!);
            } else {
              setOperadorAtualizacao(fallbackAtualizacao);
            }
          }
          return;
        }
      } catch (err) {
        console.warn('Erro ao consultar perfis de auditoria na tabela profiles:', err);
      }

      if (!isCancelled) {
        setOperadorCadastro(fallbackCadastro);
        setOperadorAtualizacao(fallbackAtualizacao);
      }
    }

    carregarAuditoriaProfiles();

    return () => {
      isCancelled = true;
    };
  }, [assistido.criado_por, assistido.atualizado_por, user]);

  // Controle de Modo: Leitura (Visualização) vs Edição Completa (5 Abas)
  const [isEditingData, setIsEditingData] = useState<boolean>(false);

  // Aba ativa na Visualização (Modo Leitura)
  const [activeTab, setActiveTab] = useState<
    'geral' | 'identificacao' | 'trabalho' | 'saude' | 'oficina' | 'avaliacao'
  >('geral');

  // Aba ativa no Modo Edição (1 a 5)
  const [editActiveTab, setEditActiveTab] = useState<number>(1);

  // Estado completo dos dados em edição (5 Abas)
  const [editFormData, setEditFormData] = useState<CadastroFormData>(() =>
    convertAssistidoToFormData(assistido)
  );

  // Estados para Avaliação de 4 Meses
  const existingAvaliacao = useMemo(
    () => getAvaliacao4Meses(assistido),
    [assistido.expectativa_curso]
  );
  const isPendente4Meses = useMemo(
    () => isPendenteAvaliacao4Meses(assistido),
    [assistido]
  );

  const [isEditingAvaliacao, setIsEditingAvaliacao] = useState<boolean>(!existingAvaliacao);
  const [dataAvaliacao, setDataAvaliacao] = useState<string>(
    () => existingAvaliacao?.data_avaliacao || new Date().toISOString().split('T')[0]
  );
  const [statusFinalCurso, setStatusFinalCurso] = useState<
    'Concluiu Oficina' | 'Desistiu (Evasão)' | 'Continua em Acompanhamento'
  >(() => existingAvaliacao?.status_final_curso || 'Concluiu Oficina');
  const [motivoEvasao, setMotivoEvasao] = useState<string>(
    () => existingAvaliacao?.motivo_evasao || ''
  );
  const [impactoGerado, setImpactoGerado] = useState<
    'Conseguiu Emprego' | 'Abriu Pequeno Negócio' | 'Aumentou Renda em Casa' | 'Sem Alteração Renda' | 'Outro'
  >(() => existingAvaliacao?.impacto_gerado || 'Aumentou Renda em Casa');
  const [mudancaAutonomia, setMudancaAutonomia] = useState<string>(
    () => existingAvaliacao?.mudanca_autonomia_qualidade_vida || ''
  );
  const [savingAvaliacao, setSavingAvaliacao] = useState<boolean>(false);
  const [avaliacaoSuccessMsg, setAvaliacaoSuccessMsg] = useState<string | null>(null);
  const [avaliacaoErrorMsg, setAvaliacaoErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const av = getAvaliacao4Meses(assistido);
    if (av) {
      setDataAvaliacao(av.data_avaliacao);
      setStatusFinalCurso(av.status_final_curso);
      setMotivoEvasao(av.motivo_evasao || '');
      setImpactoGerado(av.impacto_gerado);
      setMudancaAutonomia(av.mudanca_autonomia_qualidade_vida);
      setIsEditingAvaliacao(false);
    } else {
      setDataAvaliacao(new Date().toISOString().split('T')[0]);
      setStatusFinalCurso('Concluiu Oficina');
      setMotivoEvasao('');
      setImpactoGerado('Aumentou Renda em Casa');
      setMudancaAutonomia('');
      setIsEditingAvaliacao(true);
    }
  }, [assistido]);

  // Manipulação de Foto no Modo de Edição
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(assistido.foto_url || null);

  const [savingEdit, setSavingEdit] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  const handleStartEdit = () => {
    setEditFormData(convertAssistidoToFormData(assistido));
    setFotoPreview(assistido.foto_url || null);
    setFotoFile(null);
    setEditActiveTab(1);
    setIsEditingData(true);
    setSaveErrorMsg(null);
  };

  const handleCancelEdit = () => {
    setIsEditingData(false);
    setEditFormData(convertAssistidoToFormData(assistido));
    setFotoPreview(assistido.foto_url || null);
    setFotoFile(null);
    setSaveErrorMsg(null);
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setSaveErrorMsg('O arquivo selecionado deve ser uma imagem válida (JPG, PNG ou WEBP).');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setSaveErrorMsg('A imagem é muito grande. Escolha uma foto de até 8MB.');
      return;
    }
    setFotoFile(file);
    const previewUrl = URL.createObjectURL(file);
    setFotoPreview(previewUrl);
    setSaveErrorMsg(null);
  };

  const handleRemoveFoto = () => {
    setFotoFile(null);
    if (fotoPreview && fotoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(fotoPreview);
    }
    setFotoPreview(null);
    setEditFormData((prev) => ({ ...prev, foto_url: null }));
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const image = new Image();
        image.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDimension = 600;
          let width = image.width;
          let height = image.height;

          if (width > height) {
            if (width > maxDimension) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            }
          } else {
            if (height > maxDimension) {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(image, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
            resolve(dataUrl);
          } else {
            resolve(readerEvent.target?.result as string);
          }
        };
        image.onerror = () => {
          resolve(readerEvent.target?.result as string);
        };
        image.src = readerEvent.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Não informada';
    try {
      const parts = dateString.split('T')[0].split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return 'Não registrada';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (val?: number | null) => {
    if (val === null || val === undefined) return 'Não informada';
    return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // =========================================================================
  // SALVAMENTO DA EDIÇÃO COMPLETA NO SUPABASE
  // =========================================================================
  const handleSaveFullEdit = async () => {
    setSavingEdit(true);
    setSaveErrorMsg(null);

    try {
      if (!editFormData.nome_completo.trim()) {
        setEditActiveTab(1);
        setSaveErrorMsg('O campo "Nome Completo" é obrigatório.');
        setSavingEdit(false);
        return;
      }

      // Processar Foto se houver novo arquivo selecionado
      let finalFotoUrl = editFormData.foto_url;
      if (fotoFile) {
        finalFotoUrl = await convertFileToBase64(fotoFile);
      }

      // 1. Ocupação / Trabalho
      let profissaoFinal = '';
      if (editFormData.atividade_remunerada === 'Sim') {
        const ocup = editFormData.ocupacao_atual.trim() || 'Atividade remunerada informal';
        const diasList =
          editFormData.dias_semana_trabalho_array &&
          editFormData.dias_semana_trabalho_array.length > 0
            ? editFormData.dias_semana_trabalho_array.join(', ')
            : 'Dias flexíveis';
        const turno = editFormData.turno_trabalho || 'Manhã';
        profissaoFinal = `Ocupação: ${ocup} | Dias: ${diasList} | Turno: ${turno}`;
        if (
          editFormData.trabalhou_anteriormente === 'Sim' &&
          editFormData.area_trabalho_anterior.trim()
        ) {
          profissaoFinal += ` | Trabalho anterior: ${editFormData.area_trabalho_anterior.trim()}`;
        }
      } else {
        const partes: string[] = ['Sem ocupação formal no momento'];
        if (editFormData.desemprego_circunstancia.trim()) {
          partes.push(`Causa/Justificativa: ${editFormData.desemprego_circunstancia.trim()}`);
        }
        if (editFormData.trabalhou_anteriormente === 'Sim') {
          partes.push(
            `Já trabalhou anteriormente: Sim (${editFormData.area_trabalho_anterior.trim() || 'Área não informada'})`
          );
        } else {
          partes.push('Já trabalhou anteriormente: Não');
        }
        profissaoFinal = partes.join(' | ');
      }

      // 2. Programas Sociais
      let programasSociaisArray = editFormData.programas_sociais.filter(Boolean);
      if (
        programasSociaisArray.includes('Outro') &&
        editFormData.outro_programa_social.trim()
      ) {
        programasSociaisArray = programasSociaisArray.map((p) =>
          p === 'Outro' ? `Outro: ${editFormData.outro_programa_social.trim()}` : p
        );
      }

      // 3. Saúde da Família (Seção 11)
      const saudeFamiliaItens: string[] = [];
      if (editFormData.saude_doenca_cronica) {
        const p = editFormData.saude_doenca_cronica_parentesco.trim();
        const m = editFormData.saude_doenca_cronica_medicamento.trim();
        const info =
          p || m
            ? `${p || 'Assistido/Familiar'} (Med/Tratamento: ${m || 'Em uso'})`
            : editFormData.saude_doenca_cronica_detalhe || 'Sim';
        saudeFamiliaItens.push(`Doença Crônica: ${info}`);
      }
      if (editFormData.saude_dependencia_quimica) {
        const p = editFormData.saude_dependencia_quimica_parentesco.trim();
        const m = editFormData.saude_dependencia_quimica_medicamento.trim();
        const info =
          p || m
            ? `${p || 'Familiar'} (${m || 'Sem acompanhamento especificado'})`
            : editFormData.saude_dependencia_quimica_detalhe || 'Sim';
        saudeFamiliaItens.push(`Dependência Química: ${info}`);
      }
      if (editFormData.saude_mental) {
        const p = editFormData.saude_mental_parentesco.trim();
        const m = editFormData.saude_mental_medicamento.trim();
        const info =
          p || m
            ? `${p || 'Assistido/Familiar'} (${m || 'Acompanhamento em curso'})`
            : editFormData.saude_mental_detalhe || 'Sim';
        saudeFamiliaItens.push(`Saúde Mental: ${info}`);
      }
      if (editFormData.saude_deficiencia) {
        const p = editFormData.saude_deficiencia_parentesco.trim();
        const m = editFormData.saude_deficiencia_medicamento.trim();
        const info =
          p || m
            ? `${p || 'Assistido/Familiar'} (${m || 'PcD / Síndrome'})`
            : editFormData.saude_deficiencia_detalhe || 'Sim';
        saudeFamiliaItens.push(`Deficiência/Síndrome: ${info}`);
      }
      if (editFormData.saude_outra_situacao) {
        const p = editFormData.saude_outra_situacao_parentesco.trim();
        const m = editFormData.saude_outra_situacao_medicamento.trim();
        const info =
          p || m
            ? `${p || 'Familiar'} (${m || 'Situação relevante'})`
            : editFormData.saude_outra_situacao_detalhe || 'Sim';
        saudeFamiliaItens.push(`Outra Situação de Saúde: ${info}`);
      }
      const doencasCronicasFamiliaArray: string[] =
        saudeFamiliaItens.length > 0
          ? saudeFamiliaItens
          : ['Nenhuma condição registrada'];

      const tiposDeficienciaArray: string[] = editFormData.saude_deficiencia
        ? [
            editFormData.saude_deficiencia_medicamento.trim() ||
              editFormData.saude_deficiencia_parentesco.trim() ||
              'PcD / Síndrome familiar'
          ]
        : ['Nenhuma'];

      // 4. Cursos anteriores
      let cursosAnterioresArray: string[] = [];
      if (
        editFormData.participou_cursos_anteriores === 'Sim' &&
        editFormData.cursos_anteriores_detalhes.trim()
      ) {
        cursosAnterioresArray = [editFormData.cursos_anteriores_detalhes.trim()];
      } else {
        cursosAnterioresArray = ['Não participou de cursos anteriores'];
      }

      // 5. Expectativas de Curso e Percepção FLH (Seção 12)
      const expectativasList: string[] = [];
      if (editFormData.curso_e_preferencia === 'Sim') {
        expectativasList.push('Curso de preferência do assistido');
      } else if (editFormData.curso_preferencia_outro.trim()) {
        expectativasList.push(
          `Preferência alternativa: ${editFormData.curso_preferencia_outro.trim()}`
        );
      }

      if (editFormData.o_que_pretende_fazer.length > 0) {
        let pretencoes = [...editFormData.o_que_pretende_fazer];
        if (pretencoes.includes('Outro') && editFormData.o_que_pretende_outro.trim()) {
          pretencoes = pretencoes.map((p) =>
            p === 'Outro' ? `Outro: ${editFormData.o_que_pretende_outro.trim()}` : p
          );
        }
        expectativasList.push(`Pretende: ${pretencoes.join(', ')}`);
      }

      if (editFormData.representacao_flh_familia.trim()) {
        expectativasList.push(
          `Significado FLH: ${editFormData.representacao_flh_familia.trim()}`
        );
      }

      if (editFormData.percepcao_flh_hoje && editFormData.percepcao_flh_hoje.length > 0) {
        let percs = [...editFormData.percepcao_flh_hoje];
        if (percs.includes('Outro') && editFormData.percepcao_flh_outro.trim()) {
          percs = percs.map((p) =>
            p === 'Outro' ? `Outro: ${editFormData.percepcao_flh_outro.trim()}` : p
          );
        }
        expectativasList.push(`Percepção FLH: ${percs.join(', ')}`);
      }

      if (editFormData.nao_tem_interesse_outras_oficinas) {
        expectativasList.push('Sem interesse em outras oficinas');
      } else if (editFormData.interesse_outras_oficinas.trim()) {
        expectativasList.push(
          `Outras oficinas de interesse: ${editFormData.interesse_outras_oficinas.trim()}`
        );
      }

      if (editFormData.data_saida?.trim()) {
        expectativasList.push(`Data de Saída: ${editFormData.data_saida.trim()}`);
      }

      // Preservar registro da Avaliação de 4 Meses se já existente
      if (existingAvaliacao) {
        const blocoAvaliacao = `[Avaliação 4 Meses - ${existingAvaliacao.data_avaliacao}] Status: ${
          existingAvaliacao.status_final_curso
        }${
          existingAvaliacao.motivo_evasao ? ` (${existingAvaliacao.motivo_evasao})` : ''
        } | Impacto: ${existingAvaliacao.impacto_gerado} | Depoimento: ${
          existingAvaliacao.mudanca_autonomia_qualidade_vida
        }`;
        expectativasList.push(blocoAvaliacao);
      }

      const expectativaCursoFinal =
        expectativasList.length > 0 ? expectativasList.join(' | ') : null;

      // 6. Moradia Detalhada e Faixa de Renda Exata
      const moradiaDescPartes = [editFormData.tipo_moradia || 'Não informado'];
      moradiaDescPartes.push(`Água: ${editFormData.agua_regularidade}`);
      moradiaDescPartes.push(`Energia: ${editFormData.energia_regularidade}`);
      if (editFormData.servicos_basicos_gerais) {
        moradiaDescPartes.push(
          `Serviços Básicos Gerais: ${editFormData.servicos_basicos_gerais}`
        );
      }
      if (
        editFormData.quantidade_filhos !== '' &&
        Number(editFormData.quantidade_filhos) >= 0
      ) {
        moradiaDescPartes.push(`Filhos: ${editFormData.quantidade_filhos}`);
      }

      const faixaRendaString = editFormData.faixa_renda || 'Sem Renda (R$ 0)';
      moradiaDescPartes.push(`Faixa de Renda: ${faixaRendaString}`);

      if (editFormData.observacoes_moradia.trim()) {
        moradiaDescPartes.push(`Obs: ${editFormData.observacoes_moradia.trim()}`);
      }
      const tipoMoradiaFinal = moradiaDescPartes.join(' | ');

      // Renda Numérica segura para o banco
      let rendaNumerica = 0;
      if (faixaRendaString === 'Sem Renda (R$ 0)') rendaNumerica = 0;
      else if (faixaRendaString === 'Até R$ 600') rendaNumerica = 600;
      else if (faixaRendaString === 'De R$ 601 a R$ 1.200') rendaNumerica = 1200;
      else if (faixaRendaString === 'De R$ 1.201 a R$ 2.000') rendaNumerica = 2000;
      else if (faixaRendaString === 'De R$ 2.001 a R$ 3.500') rendaNumerica = 3500;
      else if (faixaRendaString === 'De R$ 3.501 a R$ 5.000') rendaNumerica = 5000;
      else if (faixaRendaString === 'Acima de R$ 5.000') rendaNumerica = 6000;
      else rendaNumerica = Number(editFormData.renda_aproximada_valor) || 0;

      const finalComposicaoFamiliar =
        editFormData.mora_sozinho ||
        editFormData.em_situacao_rua ||
        editFormData.composicao_familiar === ''
          ? 1
          : Math.max(1, Number(editFormData.composicao_familiar));

      const cleanCpf = editFormData.cpf.trim()
        ? formatCPF(editFormData.cpf).slice(0, 14)
        : null;
      const cleanRg = editFormData.rg.trim() ? formatRG(editFormData.rg) : null;

      const sanitizeStringArray = (val: any, defaultFallback: string[] = []): string[] => {
        if (!val) return defaultFallback;
        if (Array.isArray(val)) {
          const clean = val
            .map((item) => (typeof item === 'string' ? item.trim() : String(item).trim()))
            .filter(Boolean);
          return clean.length > 0 ? clean : defaultFallback;
        }
        if (typeof val === 'string' && val.trim()) {
          return [val.trim()];
        }
        return defaultFallback;
      };

      // Usuário autenticado
      let authUserId: string | null = null;
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user?.id) {
          authUserId = authData.user.id;
        }
      } catch {
        authUserId = null;
      }

      const nowIso = new Date().toISOString();

      const payload: Record<string, any> = {
        // Aba 1 - Identificação e Contato
        nome_completo: editFormData.nome_completo.trim(),
        rg: cleanRg,
        cpf: cleanCpf,
        data_nascimento: editFormData.data_nascimento || null,
        idade: editFormData.idade === '' ? null : Number(editFormData.idade),
        raca_cor: editFormData.raca_cor || 'Não informado',
        telefone: editFormData.telefone.trim() || null,
        endereco: editFormData.endereco.trim() || null,
        bairro: editFormData.bairro.trim() || null,
        escolaridade: editFormData.escolaridade,
        estado_civil: editFormData.estado_civil,
        possui_cadastro_flh: editFormData.possui_cadastro_flh,
        possui_cras: editFormData.possui_cras,
        bairro_cras: editFormData.possui_cras
          ? editFormData.bairro_cras.trim() || null
          : null,
        data_ingresso:
          editFormData.data_ingresso ||
          assistido.data_ingresso ||
          new Date().toISOString().split('T')[0],
        foto_url: finalFotoUrl,

        // Aba 2 - Trabalho e Renda
        atividade_remunerada: editFormData.atividade_remunerada,
        profissao: profissaoFinal,
        renda_familiar_aproximada: rendaNumerica,
        beneficios_sociais: sanitizeStringArray(programasSociaisArray, ['Nenhum']),

        // Aba 3 - Moradia e Família
        composicao_familiar: finalComposicaoFamiliar,
        acesso_internet: editFormData.acesso_internet,
        tipo_moradia: tipoMoradiaFinal,
        servicos_basicos_regulares: editFormData.servicos_basicos_gerais === 'Sim',

        // Aba 4 - Vulnerabilidades e Saúde
        dificuldades_enfrentadas: sanitizeStringArray(
          editFormData.dificuldades_familia,
          ['Nenhuma']
        ),
        rede_apoio: editFormData.rede_apoio_principal,
        fatores_risco_evasao: sanitizeStringArray(
          editFormData.fatores_risco_evasao,
          ['Nenhum']
        ),
        possui_deficiencia: editFormData.saude_deficiencia,
        tipos_deficiencia: sanitizeStringArray(tiposDeficienciaArray, ['Nenhuma']),
        doencas_cronicas_familia: sanitizeStringArray(
          doencasCronicasFamiliaArray,
          ['Nenhuma condição registrada']
        ),
        servicos_acompanhamento: sanitizeStringArray(
          editFormData.servicos_flh_utilizados,
          ['Nenhum / Nunca utilizou']
        ),

        // Aba 5 - Motivações e Expectativas FLH
        motivo_busca: editFormData.motivo_busca_momento.trim() || null,
        expectativa_curso: expectativaCursoFinal,
        objetivo_profissional_3_meses:
          editFormData.objetivo_profissional_3_meses.trim() || null,
        curso_pretendido: editFormData.oficina_pretendida,
        cursos_anteriores: sanitizeStringArray(cursosAnterioresArray, [
          'Não participou de cursos anteriores'
        ]),
        status_curso:
          editFormData.status_acompanhamento ||
          editFormData.status_atendimento ||
          'Ativo / Em Acompanhamento'
      };

      if (authUserId) {
        payload.atualizado_por = authUserId;
      }

      // Executa o update com fallback seguro
      const updatedRecord = await assistidosService.update(assistido.id, payload);

      onAssistidoUpdated(updatedRecord);
      setIsEditingData(false);
      setSaveSuccessMsg('Cadastro atualizado com sucesso em todas as 5 etapas!');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Erro ao atualizar assistido:', err);
      setSaveErrorMsg(err.message || 'Erro ao salvar alterações no banco de dados.');
    } finally {
      setSavingEdit(false);
    }
  };

  // =========================================================================
  // SALVAMENTO DA AVALIAÇÃO DE 4 MESES NO SUPABASE
  // =========================================================================
  const handleSaveAvaliacao = async () => {
    setSavingAvaliacao(true);
    setAvaliacaoErrorMsg(null);
    setAvaliacaoSuccessMsg(null);

    try {
      if (!mudancaAutonomia.trim()) {
        setAvaliacaoErrorMsg(
          'Por favor, descreva as observações ou depoimento sobre a mudança na autonomia e qualidade de vida.'
        );
        setSavingAvaliacao(false);
        return;
      }

      if (statusFinalCurso === 'Desistiu (Evasão)' && !motivoEvasao.trim()) {
        setAvaliacaoErrorMsg('Por favor, informe o motivo da evasão / desistência.');
        setSavingAvaliacao(false);
        return;
      }

      // Definir novo status do assistido
      let novoStatus = 'Concluído';
      if (statusFinalCurso === 'Concluiu Oficina') {
        novoStatus = 'Concluído';
      } else if (statusFinalCurso === 'Desistiu (Evasão)') {
        novoStatus = 'Desistente / Evasão';
      } else {
        novoStatus = 'Ativo / Em Acompanhamento';
      }

      // Adicionar aos serviços de acompanhamento
      const servicosAtuais = Array.isArray(assistido.servicos_acompanhamento)
        ? [...assistido.servicos_acompanhamento]
        : typeof assistido.servicos_acompanhamento === 'string'
        ? [assistido.servicos_acompanhamento]
        : [];

      const servicoItem = `Avaliação de 4 Meses (${dataAvaliacao}): ${statusFinalCurso}`;
      const filteredServicos = servicosAtuais
        .filter((s) => !s.toLowerCase().includes('avaliação de 4 meses'))
        .filter((s) => s !== 'Nenhum / Nunca utilizou');
      filteredServicos.push(servicoItem);

      // Atualizar o bloco estruturado na expectativa_curso
      const cleanExpectativa = (assistido.expectativa_curso || '')
        .replace(/\s*\|\s*\[Avaliação 4 Meses[^\]]*\][^\n|]*/g, '')
        .replace(/\[Avaliação 4 Meses[^\]]*\][^\n|]*/g, '')
        .trim();

      const blocoAvaliacao = `[Avaliação 4 Meses - ${dataAvaliacao}] Status: ${statusFinalCurso}${
        motivoEvasao.trim() ? ` (${motivoEvasao.trim()})` : ''
      } | Impacto: ${impactoGerado} | Depoimento: ${mudancaAutonomia.trim()}`;

      const novaExpectativa = cleanExpectativa
        ? `${cleanExpectativa} | ${blocoAvaliacao}`
        : blocoAvaliacao;

      // Obter usuário logado
      let authUserId: string | null = null;
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user?.id) {
          authUserId = authData.user.id;
        }
      } catch {
        authUserId = null;
      }

      const updatePayload: Record<string, any> = {
        status_curso: novoStatus,
        servicos_acompanhamento: filteredServicos,
        expectativa_curso: novaExpectativa
      };

      if (authUserId) {
        updatePayload.atualizado_por = authUserId;
      }

      const updatedRecord = await assistidosService.update(assistido.id, updatePayload);

      onAssistidoUpdated(updatedRecord);
      setIsEditingAvaliacao(false);
      setAvaliacaoSuccessMsg('Avaliação de 4 Meses registrada com sucesso e status atualizado!');
      setTimeout(() => setAvaliacaoSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Erro ao salvar avaliação de 4 meses:', err);
      setAvaliacaoErrorMsg(err.message || 'Erro ao salvar avaliação no banco de dados.');
    } finally {
      setSavingAvaliacao(false);
    }
  };

  const [deletingFicha, setDeletingFicha] = useState(false);

  const handleDeleteAction = () => {
    if (!canUserDelete) return;

    if (onDelete) {
      onDelete(assistido);
      return;
    }

    setShowDirectConfirmModal(true);
  };

  const handleExecuteDirectDelete = async () => {
    setDeletingFicha(true);
    try {
      await assistidosService.delete(assistido.id);
      toast.success('Ficha removida com sucesso!', `${assistido.nome_completo} foi removido do sistema.`);
      setShowDirectConfirmModal(false);
      onClose();
    } catch (err: any) {
      console.error('Erro ao excluir assistido:', err);
      const msg = err?.message || 'Não foi possível excluir o cadastro.';
      toast.error('Erro ao excluir ficha', msg);
    } finally {
      setDeletingFicha(false);
    }
  };

  const renderStatusBadge = (status?: string | null) => {
    const s = status || 'Em Acompanhamento';
    if (s === 'Concluído / Formado' || s === 'Concluído/Formado') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold border border-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
          Concluído / Formado
        </span>
      );
    }
    if (s === 'Trancado / Evasão' || s === 'Trancado/Evasão') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold border border-amber-300">
          <span className="w-2 h-2 rounded-full bg-amber-600"></span>
          Trancado / Evasão
        </span>
      );
    }
    if (s === 'Desligado') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold border border-red-300">
          <span className="w-2 h-2 rounded-full bg-red-600"></span>
          Desligado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold border border-emerald-300">
        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
        Em Acompanhamento
      </span>
    );
  };

  const isSituacaoRua =
    assistido.tipo_moradia?.toLowerCase().includes('rua') ||
    (assistido.endereco?.toLowerCase().includes('rua') &&
      assistido.endereco?.toLowerCase().includes('situação'));

  // =========================================================================
  // PARSERS E EXTRATORES DE DADOS DO FORMULÁRIO (PARA VISUALIZAÇÃO)
  // =========================================================================
  const moradiaParsed = (() => {
    const raw = assistido.tipo_moradia || '';
    const parts = raw.split(' | ').map((p) => p.trim());
    const tipo = parts[0] || 'Não informado';
    let agua = 'Não informada';
    let energia = 'Não informada';
    let servicosGerais = assistido.servicos_basicos_regulares
      ? 'Sim (Regulares)'
      : 'Não / Parcial';
    let filhos =
      assistido.quantidade_filhos !== undefined && assistido.quantidade_filhos !== null
        ? String(assistido.quantidade_filhos)
        : '';
    let obs = '';

    parts.forEach((p) => {
      if (p.startsWith('Água:')) {
        agua = p.replace('Água:', '').trim();
      } else if (p.startsWith('Energia:')) {
        energia = p.replace('Energia:', '').trim();
      } else if (
        p.startsWith('Serviços Básicos Gerais:') ||
        p.startsWith('Serviços Gerais:')
      ) {
        servicosGerais = p.split(':')[1]?.trim() || servicosGerais;
      } else if (p.startsWith('Filhos:') || p.startsWith('Quantidade de Filhos:')) {
        filhos = p.split(':')[1]?.trim() || filhos;
      } else if (p.startsWith('Obs:')) {
        obs = p.replace('Obs:', '').trim();
      }
    });

    return { tipo, agua, energia, servicosGerais, filhos, obs, raw };
  })();

  const faixaRendaParsed = (() => {
    if (assistido.tipo_moradia?.includes('Faixa de Renda:')) {
      const match = assistido.tipo_moradia.match(/Faixa de Renda:\s*([^|]+)/);
      if (match && match[1]?.trim()) {
        return match[1].trim();
      }
    }
    if (assistido.profissao?.includes('Renda Familiar:')) {
      const match = assistido.profissao.match(/Renda Familiar:\s*([^|]+)/);
      if (match && match[1]?.trim()) {
        return match[1].trim();
      }
    }
    const val = Number(assistido.renda_familiar_aproximada);
    if (isNaN(val) || val === 0) return 'Sem Renda (R$ 0)';
    if (val <= 600) return 'Até R$ 600';
    if (val <= 1200) return 'De R$ 601 a R$ 1.200';
    if (val <= 2000) return 'De R$ 1.201 a R$ 2.000';
    if (val <= 3500) return 'De R$ 2.001 a R$ 3.500';
    if (val <= 5000) return 'De R$ 3.501 a R$ 5.000';
    return 'Acima de R$ 5.000';
  })();

  const trabalhoParsed = (() => {
    const raw = assistido.profissao || '';
    const isRemunerada = assistido.atividade_remunerada === 'Sim';
    let ocupacao = '';
    let dias = '';
    let turno = '';
    let desempregoJustificativa = '';
    let trabalhouAnteriormente = '';
    let areaAnterior = '';

    const parts = raw.split(' | ').map((p) => p.trim());
    parts.forEach((p) => {
      if (p.startsWith('Ocupação:')) {
        ocupacao = p.replace('Ocupação:', '').trim();
      } else if (p.startsWith('Dias:')) {
        dias = p.replace('Dias:', '').trim();
      } else if (p.startsWith('Turno:')) {
        turno = p.replace('Turno:', '').trim();
      } else if (
        p.startsWith('Causa/Justificativa:') ||
        p.startsWith('Justificativa/Ações:') ||
        p.startsWith('Motivo/Ações:')
      ) {
        desempregoJustificativa = p.split(':')[1]?.trim() || '';
      } else if (p.startsWith('Já trabalhou anteriormente:')) {
        trabalhouAnteriormente = p.replace('Já trabalhou anteriormente:', '').trim();
      } else if (p.startsWith('Trabalho anterior:')) {
        areaAnterior = p.replace('Trabalho anterior:', '').trim();
      } else if (p.includes('(Dias:') && p.includes('Turno:')) {
        const match = p.match(/^([^(]+)\s*\(Dias:\s*([^|]+)\|\s*Turno:\s*([^)]+)\)/);
        if (match) {
          ocupacao = match[1]?.trim() || '';
          dias = match[2]?.trim() || '';
          turno = match[3]?.trim() || '';
        }
      }
    });

    return {
      isRemunerada,
      ocupacao: ocupacao || (isRemunerada ? raw : 'Não informada'),
      dias: dias || 'Não informado',
      turno: turno || 'Não informado',
      desempregoJustificativa,
      trabalhouAnteriormente,
      areaAnterior,
      raw
    };
  })();

  const expectativaParsed = (() => {
    const raw = assistido.expectativa_curso || '';
    let preferencia = 'Sim, é o curso de preferência';
    let preferenciaOutro = '';
    let oQuePretende: string[] = [];
    let representacaoFLH = '';
    let outrasOficinas = '';
    let naoTemInteresse = false;

    const parts = raw.split(' | ').map((p) => p.trim());
    parts.forEach((p) => {
      if (p.includes('Curso de preferência do assistido')) {
        preferencia = 'Sim, é o curso de sua preferência';
      } else if (p.startsWith('Preferência alternativa:')) {
        preferencia = 'Não';
        preferenciaOutro = p.replace('Preferência alternativa:', '').trim();
      } else if (p.startsWith('Pretende:')) {
        const itens = p.replace('Pretende:', '').trim();
        oQuePretende = itens
          .split(',')
          .map((i) => i.trim())
          .filter(Boolean);
      } else if (p.startsWith('Significado FLH:')) {
        representacaoFLH = p.replace('Significado FLH:', '').trim();
      } else if (p.includes('Sem interesse em outras oficinas')) {
        naoTemInteresse = true;
      } else if (p.startsWith('Outras oficinas de interesse:')) {
        outrasOficinas = p.replace('Outras oficinas de interesse:', '').trim();
      }
    });

    return {
      preferencia,
      preferenciaOutro,
      oQuePretende,
      representacaoFLH,
      outrasOficinas,
      naoTemInteresse,
      raw
    };
  })();

  const saudeFamiliaTabela = (() => {
    const itemsRaw = Array.isArray(assistido.doencas_cronicas_familia)
      ? assistido.doencas_cronicas_familia
      : typeof assistido.doencas_cronicas_familia === 'string'
      ? [assistido.doencas_cronicas_familia]
      : [];

    const rows = [
      {
        id: 'cronica',
        titulo: 'Doença Crônica',
        subtitulo: 'Hipertensão, diabetes, cardiopatias, asma, etc.',
        registrada: false,
        detalhes: 'Nenhuma condição relatada'
      },
      {
        id: 'dependencia',
        titulo: 'Dependência Química',
        subtitulo: 'Álcool, tabaco ou outras substâncias',
        registrada: false,
        detalhes: 'Nenhuma condição relatada'
      },
      {
        id: 'mental',
        titulo: 'Sofrimento Psíquico Grave / Saúde Mental',
        subtitulo: 'Depressão grave, ansiedade, transtornos psiquiátricos',
        registrada: false,
        detalhes: 'Nenhuma condição relatada'
      },
      {
        id: 'deficiencia',
        titulo: 'Deficiência / Síndrome',
        subtitulo: 'Física, auditiva, visual, intelectual, autismo (TEA), etc.',
        registrada: false,
        detalhes: 'Nenhuma condição relatada'
      }
    ];

    itemsRaw.forEach((item) => {
      if (item.startsWith('Doença Crônica:')) {
        const val = item.replace('Doença Crônica:', '').trim();
        rows[0].registrada = true;
        rows[0].detalhes = val && val !== 'Sim' ? val : 'Condição registrada na família';
      } else if (item.startsWith('Dependência Química:')) {
        const val = item.replace('Dependência Química:', '').trim();
        rows[1].registrada = true;
        rows[1].detalhes = val && val !== 'Sim' ? val : 'Condição registrada na família';
      } else if (item.startsWith('Saúde Mental:')) {
        const val = item.replace('Saúde Mental:', '').trim();
        rows[2].registrada = true;
        rows[2].detalhes = val && val !== 'Sim' ? val : 'Condição registrada na família';
      } else if (
        item.startsWith('Deficiência/Síndrome:') ||
        item.startsWith('Deficiência:')
      ) {
        const val = item.replace(/Deficiência(\/Síndrome)?:/, '').trim();
        rows[3].registrada = true;
        rows[3].detalhes = val && val !== 'Sim' ? val : 'Condição registrada na família';
      }
    });

    if (assistido.possui_deficiencia && !rows[3].registrada) {
      rows[3].registrada = true;
      const defs = Array.isArray(assistido.tipos_deficiencia)
        ? assistido.tipos_deficiencia.filter((d) => d && d !== 'Nenhuma').join(', ')
        : '';
      rows[3].detalhes = defs || 'Deficiência registrada no cadastro do assistido';
    }

    return rows;
  })();

  const cursosAnterioresInfo = (() => {
    const raw = assistido.cursos_anteriores;
    if (Array.isArray(raw)) {
      if (raw.length === 0 || raw.includes('Não participou de cursos anteriores')) {
        return { participou: false, texto: 'Não participou de cursos anteriores' };
      }
      return { participou: true, texto: raw.join('; ') };
    }
    if (typeof raw === 'string' && raw.trim()) {
      if (raw.toLowerCase().includes('não participou')) {
        return { participou: false, texto: 'Não participou de cursos anteriores' };
      }
      return { participou: true, texto: raw.trim() };
    }
    return { participou: false, texto: 'Não participou de cursos anteriores' };
  })();

  // Configuração das 5 Abas no Modo de Edição
  const editTabsList = [
    { id: 1, title: '1. Identificação & Foto', icon: User },
    { id: 2, title: '2. Trabalho & Renda', icon: Briefcase },
    { id: 3, title: '3. Moradia & Família', icon: Home },
    { id: 4, title: '4. Saúde & Vulnerabilidades', icon: HeartPulse },
    { id: 5, title: '5. Motivações & FLH', icon: GraduationCap }
  ];

  return (
    <>
      <div className="no-print fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col shadow-2xl border border-gray-100 dark:border-slate-800">
        
        {/* Cabeçalho do Modal */}
        <div className="px-6 py-4.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/80">
          <div className="flex items-center gap-4">
            <div className="relative">
              {fotoPreview || assistido.foto_url ? (
                <img
                  src={fotoPreview || assistido.foto_url || ''}
                  alt={assistido.nome_completo}
                  className="w-13 h-13 rounded-2xl object-cover border-2 border-white dark:border-slate-700 shadow-sm ring-2 ring-emerald-500/20"
                />
              ) : (
                <div className="w-13 h-13 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  {assistido.nome_completo ? assistido.nome_completo.charAt(0).toUpperCase() : 'A'}
                </div>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-heading text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  {assistido.nome_completo}
                </h3>
                {renderStatusBadge(
                  isEditingData ? editFormData.status_atendimento : assistido.status_curso
                )}
                {isEditingData && (
                  <span className="px-2.5 py-0.5 bg-amber-600 text-white text-[10px] font-black rounded-full uppercase tracking-wider shadow-2xs">
                    Modo Edição Ativo
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-2">
                <span>
                  Oficina:{' '}
                  <strong className="text-slate-800 dark:text-slate-200 font-bold">
                    {isEditingData
                      ? editFormData.oficina_pretendida
                      : assistido.curso_pretendido || 'Geral'}
                  </strong>
                </span>
                <span>•</span>
                <span>CPF: {assistido.cpf || 'Não informado'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditingData ? (
              <div className="flex items-center gap-2">
                {canEvaluate && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('avaliacao');
                      setIsEditingAvaliacao(true);
                    }}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer ${
                      isPendente4Meses
                        ? 'bg-amber-600 hover:bg-amber-700 text-white animate-pulse'
                        : 'bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                    }`}
                    title="Registrar Avaliação de 4 Meses do Assistido"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      {existingAvaliacao
                        ? 'Atualizar Avaliação 4 Meses'
                        : 'Registrar Avaliação de 4 Meses'}
                    </span>
                  </button>
                )}

                {canEdit ? (
                  <button
                    type="button"
                    onClick={handleStartEdit}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                    title="Editar informações completas nas 5 Abas"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar Ficha (5 Abas)</span>
                  </button>
                ) : (
                  <span
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    title="Perfil Recepção tem permissão apenas para cadastro inicial e consulta"
                  >
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    Consulta (Recepção)
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={savingEdit}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Modo Leitura</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveFullEdit}
                  disabled={savingEdit}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingEdit ? 'Salvando...' : 'Salvar Alterações'}</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => window.print()}
              title="Imprimir Ficha Completa A4"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-lg transition border border-slate-300 dark:border-slate-700 shadow-2xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              <span>Imprimir Ficha</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Fechar Janela"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notificações no Topo */}
        {(saveSuccessMsg || avaliacaoSuccessMsg) && (
          <div className="px-6 py-2.5 bg-emerald-50 dark:bg-emerald-950/60 border-b border-emerald-100 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
            {saveSuccessMsg || avaliacaoSuccessMsg}
          </div>
        )}
        {(saveErrorMsg || avaliacaoErrorMsg) && (
          <div className="px-6 py-2.5 bg-red-50 dark:bg-red-950/60 border-b border-red-100 dark:border-red-800 text-xs font-semibold text-red-800 dark:text-red-200 flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            {saveErrorMsg || avaliacaoErrorMsg}
          </div>
        )}

        {/* BARRA DE NAVEGAÇÃO DE ABAS */}
        {!isEditingData ? (
          /* Abas do Modo de Visualização / Leitura */
          <div className="px-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800 flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-2.5">
            <button
              type="button"
              onClick={() => setActiveTab('geral')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === 'geral'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              Visão Geral 360°
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('identificacao')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === 'identificacao'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              1. Identificação Civil
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('trabalho')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === 'trabalho'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              2. Trabalho & Renda
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('saude')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === 'saude'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              3. Saúde & Vulnerabilidades
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('oficina')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === 'oficina'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              4. Oficinas & Percepção FLH
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('avaliacao')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'avaliacao'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : isPendente4Meses
                  ? 'text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 font-extrabold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>5. Avaliação 4 Meses</span>
              {isPendente4Meses ? (
                <span className="bg-amber-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  Pendente
                </span>
              ) : existingAvaliacao ? (
                <span className="bg-emerald-700 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  Realizada
                </span>
              ) : null}
            </button>
          </div>
        ) : (
          /* Abas do Modo de Edição Completa (5 Abas Oficiais) */
          <div className="px-6 border-b border-amber-200 dark:border-amber-800/60 bg-amber-50/60 dark:bg-amber-950/30 flex items-center justify-between gap-2 overflow-x-auto py-2">
            <div className="flex items-center gap-1 sm:gap-2">
              {editTabsList.map((tab) => {
                const Icon = tab.icon;
                const isCurrent = editActiveTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setEditActiveTab(tab.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                      isCurrent
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-amber-900 dark:text-amber-200 hover:bg-amber-100/70 dark:hover:bg-amber-900/40'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.title}</span>
                  </button>
                );
              })}
            </div>

            <div className="hidden lg:flex items-center gap-2 text-[11px] font-bold text-amber-800 dark:text-amber-300 pr-2">
              <span>Etapa {editActiveTab} de 5</span>
            </div>
          </div>
        )}

        {/* ÁREA DE CONTEÚDO PRINCIPAL (COM SCROLL) */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-gray-800 dark:text-slate-200 bg-gray-50/30 dark:bg-slate-900">
          
          {/* ================================================================= */}
          {/* MODO DE EDIÇÃO: AS 5 ABAS FORMULÁRIO COMPLETO */}
          {/* ================================================================= */}
          {isEditingData ? (
            <div className="space-y-6">
              {editActiveTab === 1 && (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-600" />
                    <span>
                      Aba 1: Atualize os dados civis, documentos, endereço/bairro e a foto do assistido.
                    </span>
                  </div>
                  <TabIdentificacao
                    formData={editFormData}
                    setFormData={setEditFormData}
                    fotoPreview={fotoPreview}
                    onFileSelect={handleFileSelect}
                    onRemoveFoto={handleRemoveFoto}
                  />
                </div>
              )}

              {editActiveTab === 2 && (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-900 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-emerald-600" />
                    <span>
                      Aba 2: Atualize atividade remunerada, ocupação, dias trabalhados, desemprego, faixa de renda e programas sociais.
                    </span>
                  </div>
                  <TabTrabalhoRenda
                    formData={editFormData}
                    setFormData={setEditFormData}
                  />
                </div>
              )}

              {editActiveTab === 3 && (
                <div className="space-y-4">
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-semibold text-indigo-900 flex items-center gap-2">
                    <Home className="w-4 h-4 text-indigo-600" />
                    <span>
                      Aba 3: Atualize composição familiar, número de filhos, internet, tipo de moradia e infraestrutura básica.
                    </span>
                  </div>
                  <TabMoradiaFamilia
                    formData={editFormData}
                    setFormData={setEditFormData}
                  />
                </div>
              )}

              {editActiveTab === 4 && (
                <div className="space-y-4">
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-900 flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-rose-600" />
                    <span>
                      Aba 4 (Seção 11): Atualize dificuldades, saúde familiar (parentesco e remédios), rede de apoio e serviços da FLH.
                    </span>
                  </div>
                  <TabVulnerabilidades
                    formData={editFormData}
                    setFormData={setEditFormData}
                  />
                </div>
              )}

              {editActiveTab === 5 && (
                <div className="space-y-4">
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs font-semibold text-purple-900 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-purple-600" />
                    <span>
                      Aba 5 (Seção 12): Atualize oficinas pretendidas, objetivos nos próximos 3 meses, percepção da FLH e outras oficinas.
                    </span>
                  </div>
                  <TabMotivacoes
                    formData={editFormData}
                    setFormData={setEditFormData}
                  />
                </div>
              )}

              {/* Botões de Navegação Entre Abas da Edição */}
              <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {editActiveTab > 1 && (
                    <button
                      type="button"
                      onClick={() => setEditActiveTab((prev) => Math.max(1, prev - 1))}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Etapa Anterior ({editActiveTab - 1})
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-gray-500 hover:text-gray-800 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Descartar Edição
                  </button>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {editActiveTab < 5 ? (
                    <button
                      type="button"
                      onClick={() => setEditActiveTab((prev) => Math.min(5, prev + 1))}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                    >
                      Próxima Etapa ({editActiveTab + 1})
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={handleSaveFullEdit}
                    disabled={savingEdit}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl text-xs font-bold transition shadow-md"
                  >
                    <Save className="w-4 h-4" />
                    {savingEdit ? 'Salvando Alterações...' : 'Salvar Alterações no Banco'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* =============================================================== */
            /* MODO DE LEITURA (VISUALIZAÇÃO COMPLETA DA FICHA) */
            /* =============================================================== */
            <div>
              {/* ABA GERAL: VISÃO 360° */}
              {activeTab === 'geral' && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Banner de Aviso: Avaliação de 4 Meses Pendente */}
                  {isPendente4Meses && (
                    <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-pulse">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider font-heading">
                            Atingiu 4 Meses (Avaliação Pendente)
                          </h4>
                          <p className="text-xs text-amber-800 mt-0.5">
                            Este assistido ingressou em{' '}
                            <strong>
                              {formatDate(assistido.data_ingresso || assistido.created_at)}
                            </strong>{' '}
                            (mais de 120 dias decorridos) e necessita da avaliação de acompanhamento de impacto e qualidade de vida.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('avaliacao');
                          setIsEditingAvaliacao(true);
                        }}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-xs shrink-0 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" />
                        Registrar Avaliação Agora
                      </button>
                    </div>
                  )}

                  {/* Banner de Avaliação de 4 Meses já Concluída */}
                  {existingAvaliacao && !isPendente4Meses && (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <span className="font-bold text-emerald-900">
                            Avaliação de 4 Meses Realizada em {formatDate(existingAvaliacao.data_avaliacao)}
                          </span>
                          <span className="text-emerald-700 block text-[11px]">
                            Status Final: <strong>{existingAvaliacao.status_final_curso}</strong> • Impacto: <strong>{existingAvaliacao.impacto_gerado}</strong>
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('avaliacao')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition shrink-0 cursor-pointer"
                      >
                        Ver Avaliação
                      </button>
                    </div>
                  )}

                  {/* Cards de Resumo */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 bg-white rounded-2xl border border-gray-200 shadow-2xs">
                      <span className="text-gray-400 text-[11px] font-semibold block uppercase tracking-wider">
                        Renda Familiar
                      </span>
                      <span className="text-sm font-extrabold text-emerald-700 mt-1 block">
                        {faixaRendaParsed}
                      </span>
                    </div>

                    <div className="p-3.5 bg-white rounded-2xl border border-gray-200 shadow-2xs">
                      <span className="text-gray-400 text-[11px] font-semibold block uppercase tracking-wider">
                        Composição Domiciliar
                      </span>
                      <span className="text-sm font-extrabold text-emerald-700 mt-1 block">
                        {isSituacaoRua
                          ? 'Em Situação de Rua'
                          : `${assistido.composicao_familiar || 1} pessoas`}
                      </span>
                    </div>

                    <div className="p-3.5 bg-white rounded-2xl border border-gray-200 shadow-2xs">
                      <span className="text-gray-400 text-[11px] font-semibold block uppercase tracking-wider">
                        Filhos Dependentes
                      </span>
                      <span className="text-sm font-extrabold text-pink-700 mt-1 block">
                        {moradiaParsed.filhos !== ''
                          ? `${moradiaParsed.filhos} filhos`
                          : assistido.quantidade_filhos !== undefined &&
                            assistido.quantidade_filhos !== null
                          ? `${assistido.quantidade_filhos} filhos`
                          : 'Não informado'}
                      </span>
                    </div>

                    <div className="p-3.5 bg-white rounded-2xl border border-gray-200 shadow-2xs">
                      <span className="text-gray-400 text-[11px] font-semibold block uppercase tracking-wider">
                        Internet em Casa
                      </span>
                      <span
                        className={`text-sm font-extrabold mt-1 block ${
                          assistido.acesso_internet === 'Sim'
                            ? 'text-indigo-700'
                            : 'text-gray-500'
                        }`}
                      >
                        {assistido.acesso_internet || 'Não informada'}
                      </span>
                    </div>
                  </div>

                  {/* Informações Pessoais e Residenciais */}
                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2.5">
                      <User className="w-4 h-4 text-emerald-600" />
                      Identificação Civil e Residencial
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="text-gray-400 font-semibold block">Nome Completo:</span>
                        <span className="font-bold text-gray-900">{assistido.nome_completo}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 font-semibold block">CPF:</span>
                        <span className="font-medium text-gray-800">
                          {assistido.cpf || 'Não informado'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 font-semibold block">RG:</span>
                        <span className="font-medium text-gray-800">
                          {assistido.rg || 'Não informado'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 font-semibold block">Data de Nascimento:</span>
                        <span className="font-medium text-gray-800">
                          {formatDate(assistido.data_nascimento)}
                          {assistido.idade ? ` (${assistido.idade} anos)` : ''}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 font-semibold block">Telefone / WhatsApp:</span>
                        <span className="font-bold text-emerald-700">
                          {assistido.telefone || 'Não informado'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 font-semibold block">Raça / Cor:</span>
                        <span className="font-medium text-gray-800">
                          {assistido.raca_cor || 'Não informada'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 font-semibold block">Escolaridade:</span>
                        <span className="font-medium text-gray-800">
                          {assistido.escolaridade || 'Não informada'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 font-semibold block">Estado Civil:</span>
                        <span className="font-medium text-gray-800">
                          {assistido.estado_civil || 'Não informado'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 font-semibold block">CRAS de Referência:</span>
                        <span className="font-medium text-gray-800">
                          {assistido.possui_cras
                            ? `Sim (${assistido.bairro_cras || 'Bairro não especificado'})`
                            : 'Não possui cadastro no CRAS'}
                        </span>
                      </div>
                      <div className="col-span-1 sm:col-span-2">
                        <span className="text-gray-400 font-semibold block">Endereço:</span>
                        <span className="font-medium text-gray-800">
                          {assistido.endereco || 'Não informado'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 font-semibold block">Bairro:</span>
                        <span className="font-medium text-gray-800">
                          {assistido.bairro || 'Não informado'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 font-semibold block">Data de Ingresso no FLH:</span>
                        <span className="font-bold text-gray-900">
                          {formatDate(assistido.data_ingresso || assistido.created_at)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 font-semibold block">Status do Acompanhamento:</span>
                        <span className="mt-0.5 block">
                          {renderStatusBadge(assistido.status_curso)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 font-semibold block">Data de Saída / Desligamento:</span>
                        <span className="font-medium text-gray-800">
                          {getAssistidoDataSaida(assistido)
                            ? formatDate(getAssistidoDataSaida(assistido))
                            : 'Em acompanhamento ativo'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Trabalho, Renda e Moradia */}
                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2.5">
                      <Briefcase className="w-4 h-4 text-emerald-600" />
                      Trabalho, Renda Familiar e Moradia
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="text-gray-400 font-semibold block">
                          Atividade Remunerada Atual:
                        </span>
                        <span
                          className={`font-bold ${
                            assistido.atividade_remunerada === 'Sim'
                              ? 'text-emerald-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {assistido.atividade_remunerada === 'Sim'
                            ? 'Sim (Atividade Ativa)'
                            : 'Não (Desempregado / Sem Ocupação)'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 font-semibold block">Ocupação / Ramo:</span>
                        <span className="font-medium text-gray-900">
                          {trabalhoParsed.ocupacao}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 font-semibold block">
                          Turno e Dias de Trabalho:
                        </span>
                        <span className="font-medium text-gray-800">
                          {trabalhoParsed.turno} (Dias: {trabalhoParsed.dias})
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 font-semibold block">Faixa de Renda:</span>
                        <span className="font-bold text-emerald-800">{faixaRendaParsed}</span>
                      </div>
                      <div className="col-span-1 sm:col-span-2">
                        <span className="text-gray-400 font-semibold block">
                          Programas Sociais Recebidos:
                        </span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {Array.isArray(assistido.beneficios_sociais) &&
                          assistido.beneficios_sociais.length > 0 ? (
                            assistido.beneficios_sociais.map((prog, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded font-medium text-[11px]"
                              >
                                {prog}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 italic">Nenhum registrado</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-400 font-semibold block">Tipo de Moradia:</span>
                        <span className="font-medium text-gray-800">{moradiaParsed.tipo}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 font-semibold block">Água e Energia:</span>
                        <span className="font-medium text-gray-800">
                          Água: {moradiaParsed.agua} | Luz: {moradiaParsed.energia}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 font-semibold block">Serviços Básicos:</span>
                        <span className="font-medium text-gray-800">
                          {moradiaParsed.servicosGerais}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 1: IDENTIFICAÇÃO CIVIL */}
              {activeTab === 'identificacao' && (
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-4 animate-fadeIn">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2.5">
                    <User className="w-4 h-4 text-emerald-600" />
                    Dados Civis, Documentais e CRAS
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-gray-400 font-semibold block">Nome Completo:</span>
                      <span className="font-bold text-gray-900">{assistido.nome_completo}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold block">CPF:</span>
                      <span className="font-medium text-gray-800">
                        {assistido.cpf || 'Não informado'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold block">RG:</span>
                      <span className="font-medium text-gray-800">
                        {assistido.rg || 'Não informado'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold block">Data de Nascimento:</span>
                      <span className="font-medium text-gray-800">
                        {formatDate(assistido.data_nascimento)}
                        {assistido.idade ? ` (${assistido.idade} anos)` : ''}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold block">Telefone / WhatsApp:</span>
                      <span className="font-bold text-emerald-700">
                        {assistido.telefone || 'Não informado'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold block">Raça / Cor:</span>
                      <span className="font-medium text-gray-800">
                        {assistido.raca_cor || 'Não informada'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold block">Escolaridade:</span>
                      <span className="font-medium text-gray-800">
                        {assistido.escolaridade || 'Não informada'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold block">Estado Civil:</span>
                      <span className="font-medium text-gray-800">
                        {assistido.estado_civil || 'Não informado'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold block">Cadastro no CRAS:</span>
                      <span className="font-medium text-gray-800">
                        {assistido.possui_cras
                          ? `Sim (${assistido.bairro_cras || 'Bairro do CRAS não informado'})`
                          : 'Não possui cadastro no CRAS'}
                      </span>
                    </div>
                    <div className="col-span-1 sm:col-span-2">
                      <span className="text-gray-400 font-semibold block">Endereço Residencial:</span>
                      <span className="font-medium text-gray-800">
                        {assistido.endereco || 'Não informado'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold block">Bairro:</span>
                      <span className="font-medium text-gray-800">
                        {assistido.bairro || 'Não informado'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold block">Data de Ingresso no FLH:</span>
                      <span className="font-bold text-gray-900">
                        {formatDate(assistido.data_ingresso || assistido.created_at)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold block">Status do Acompanhamento:</span>
                      <span className="mt-1 block">
                        {renderStatusBadge(assistido.status_curso)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold block">Data de Saída / Desligamento:</span>
                      <span className="font-medium text-gray-800">
                        {getAssistidoDataSaida(assistido)
                          ? formatDate(getAssistidoDataSaida(assistido))
                          : 'Em acompanhamento ativo'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 2: TRABALHO & RENDA */}
              {activeTab === 'trabalho' && (
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-4 animate-fadeIn">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2.5">
                    <Briefcase className="w-4 h-4 text-emerald-600" />
                    Situação Profissional, Faixa de Renda e Programas Sociais
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-gray-400 font-semibold block">
                        Atividade Remunerada Atual:
                      </span>
                      <span
                        className={`font-bold ${
                          assistido.atividade_remunerada === 'Sim'
                            ? 'text-emerald-700'
                            : 'text-amber-700'
                        }`}
                      >
                        {assistido.atividade_remunerada === 'Sim'
                          ? 'Sim, realiza atividade remunerada'
                          : 'Não realiza atividade remunerada'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold block">Ocupação / Ramo:</span>
                      <span className="font-medium text-gray-900">
                        {trabalhoParsed.ocupacao}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold block">Turno de Trabalho:</span>
                      <span className="font-medium text-gray-800">{trabalhoParsed.turno}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold block">Dias da Semana:</span>
                      <span className="font-medium text-gray-800">{trabalhoParsed.dias}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold block">
                        Faixa de Renda Familiar / Própria:
                      </span>
                      <span className="font-extrabold text-emerald-800">
                        {faixaRendaParsed}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold block">
                        Já trabalhou anteriormente:
                      </span>
                      <span className="font-medium text-gray-800">
                        {trabalhoParsed.trabalhouAnteriormente ||
                          (trabalhoParsed.areaAnterior ? `Sim (${trabalhoParsed.areaAnterior})` : 'Não')}
                      </span>
                    </div>
                    {trabalhoParsed.desempregoJustificativa && (
                      <div className="col-span-1 sm:col-span-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
                        <span className="text-gray-500 font-semibold block mb-1">
                          Causa do Desemprego / Sem Renda:
                        </span>
                        <p className="text-gray-800 italic">
                          "{trabalhoParsed.desempregoJustificativa}"
                        </p>
                      </div>
                    )}
                    <div className="col-span-1 sm:col-span-3">
                      <span className="text-gray-400 font-semibold block mb-1">
                        Programas Sociais e Transferência de Renda:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {Array.isArray(assistido.beneficios_sociais) &&
                        assistido.beneficios_sociais.length > 0 ? (
                          assistido.beneficios_sociais.map((prog, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 bg-indigo-50 text-indigo-900 rounded-lg text-xs font-semibold border border-indigo-200"
                            >
                              {prog}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 italic">Nenhum benefício registrado</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 3: SAÚDE & VULNERABILIDADES */}
              {activeTab === 'saude' && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Seção 11: Tabela de Condições de Saúde Familiar */}
                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2.5">
                      <HeartPulse className="w-4 h-4 text-red-600" />
                      Saúde Familiar (Seção 11: Condições, Parentesco e Medicamento/Tratamento)
                    </h4>

                    <div className="space-y-3">
                      {saudeFamiliaTabela.map((row) => (
                        <div
                          key={row.id}
                          className={`p-3.5 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                            row.registrada
                              ? 'bg-red-50/60 border-red-200'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900 text-sm">
                                {row.titulo}
                              </span>
                              {row.registrada ? (
                                <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded font-bold text-[10px]">
                                  Registrado
                                </span>
                              ) : (
                                <span className="text-gray-400 text-[11px]">Não registrado</span>
                              )}
                            </div>
                            <span className="text-gray-500 text-[11px] block mt-0.5">
                              {row.subtitulo}
                            </span>
                          </div>

                          <div className="sm:text-right">
                            <span className="text-gray-800 font-medium block">
                              {row.detalhes}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Vulnerabilidades e Apoio */}
                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      Dificuldades, Rede de Apoio e Serviços FLH
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-gray-400 font-semibold block mb-1">
                          Dificuldades Enfrentadas pela Família:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(assistido.dificuldades_enfrentadas) &&
                          assistido.dificuldades_enfrentadas.length > 0 ? (
                            assistido.dificuldades_enfrentadas.map((dif, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-amber-50 text-amber-900 rounded font-medium border border-amber-200 text-[11px]"
                              >
                                {dif}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 italic">Nenhuma informada</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-gray-400 font-semibold block mb-1">
                          Rede de Apoio Principal:
                        </span>
                        <span className="font-bold text-gray-900 block">
                          {assistido.rede_apoio || 'Não informada'}
                        </span>
                      </div>

                      <div className="col-span-1 sm:col-span-2">
                        <span className="text-gray-400 font-semibold block mb-1">
                          Serviços da Fundação Lar Harmonia já Utilizados:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {Array.isArray(assistido.servicos_acompanhamento) &&
                          assistido.servicos_acompanhamento.length > 0 ? (
                            assistido.servicos_acompanhamento.map((srv, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1 bg-emerald-50 text-emerald-900 rounded-lg text-xs font-semibold border border-emerald-200"
                              >
                                {srv}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 italic">Nenhum serviço registrado</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 4: OFICINAS & EXPECTATIVAS */}
              {activeTab === 'oficina' && (
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-4 animate-fadeIn">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2.5">
                    <GraduationCap className="w-4 h-4 text-purple-600" />
                    Oficinas, Motivações e Percepção da Fundação Lar Harmonia (Seção 12)
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-gray-400 font-semibold block">Oficina Pretendida:</span>
                      <span className="font-extrabold text-emerald-900 text-sm">
                        {assistido.curso_pretendido || 'Não informado'}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-400 font-semibold block">Status do Atendimento:</span>
                      <span className="mt-1 block">
                        {renderStatusBadge(assistido.status_curso)}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-400 font-semibold block">
                        É a oficina de sua preferência?
                      </span>
                      <span className="font-bold text-gray-900">
                        {expectativaParsed.preferencia}
                        {expectativaParsed.preferenciaOutro
                          ? ` (Preferia: ${expectativaParsed.preferenciaOutro})`
                          : ''}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-400 font-semibold block">
                        Cursos Profissionalizantes Anteriores:
                      </span>
                      <span className="font-medium text-gray-800">
                        {cursosAnterioresInfo.texto}
                      </span>
                    </div>

                    {assistido.motivo_busca && (
                      <div className="col-span-1 sm:col-span-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
                        <span className="text-gray-400 font-semibold block mb-1">
                          Motivo da busca pela oficina neste momento:
                        </span>
                        <p className="text-gray-800 italic">"{assistido.motivo_busca}"</p>
                      </div>
                    )}

                    {expectativaParsed.representacaoFLH && (
                      <div className="col-span-1 sm:col-span-2 bg-rose-50/50 p-3 rounded-xl border border-rose-200">
                        <span className="text-rose-900 font-semibold block mb-1">
                          O que a Fundação Lar Harmonia representa para sua família?
                        </span>
                        <p className="text-gray-900 italic">
                          "{expectativaParsed.representacaoFLH}"
                        </p>
                      </div>
                    )}

                    <div className="col-span-1 sm:col-span-2">
                      <span className="text-gray-400 font-semibold block mb-1">
                        Objetivo profissional para os próximos 3 meses:
                      </span>
                      <span className="font-medium text-gray-900">
                        {assistido.objetivo_profissional_3_meses || 'Não informado'}
                      </span>
                    </div>

                    <div className="col-span-1 sm:col-span-2">
                      <span className="text-gray-400 font-semibold block mb-1">
                        Interesse em outras oficinas da FLH:
                      </span>
                      <span className="font-medium text-gray-900">
                        {expectativaParsed.naoTemInteresse
                          ? 'Não tem interesse em outras oficinas no momento'
                          : expectativaParsed.outrasOficinas || 'Não informado'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 5: AVALIAÇÃO DE 4 MESES */}
              {activeTab === 'avaliacao' && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Se já existe avaliação registrada e não está em modo de edição da avaliação */}
                  {existingAvaliacao && !isEditingAvaliacao ? (
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                            <Award className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="text-base font-bold text-gray-900">
                              Avaliação de 4 Meses Concluída
                            </h4>
                            <p className="text-xs text-gray-500">
                              Realizada em {formatDate(existingAvaliacao.data_avaliacao)}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setIsEditingAvaliacao(true)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition border border-emerald-200 cursor-pointer self-start sm:self-auto"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Atualizar Avaliação</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 text-xs">
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
                          <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px]">
                            Data da Avaliação
                          </span>
                          <span className="font-extrabold text-gray-900 text-sm block">
                            {formatDate(existingAvaliacao.data_avaliacao)}
                          </span>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
                          <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px]">
                            Status Final do Curso / Oficina
                          </span>
                          <span className="font-extrabold text-emerald-800 text-sm block">
                            {existingAvaliacao.status_final_curso}
                            {existingAvaliacao.motivo_evasao && (
                              <span className="text-xs font-normal text-gray-600 block mt-0.5">
                                Motivo: {existingAvaliacao.motivo_evasao}
                              </span>
                            )}
                          </span>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
                          <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px]">
                            Impacto Social e Econômico
                          </span>
                          <span className="font-extrabold text-emerald-800 text-sm block">
                            {existingAvaliacao.impacto_gerado}
                          </span>
                        </div>

                        <div className="col-span-1 sm:col-span-2 md:col-span-3 p-5 bg-gradient-to-r from-emerald-50/50 to-teal-50/30 rounded-2xl border border-emerald-100 space-y-2">
                          <span className="text-emerald-900 font-bold uppercase tracking-wider block text-[11px] flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-emerald-600" />
                            Mudança na Autonomia e Qualidade de Vida (Depoimento / Observações)
                          </span>
                          <p className="text-gray-800 text-sm italic whitespace-pre-wrap leading-relaxed">
                            "{existingAvaliacao.mudanca_autonomia_qualidade_vida}"
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Formulário de Registro / Atualização da Avaliação */
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-6">
                      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                        <div className="flex items-center gap-2.5">
                          <Award className="w-5 h-5 text-emerald-600" />
                          <div>
                            <h4 className="text-base font-bold text-gray-900">
                              {existingAvaliacao
                                ? 'Atualizar Avaliação de 4 Meses'
                                : 'Registrar Avaliação de 4 Meses (Acompanhamento FLH)'}
                            </h4>
                            <p className="text-xs text-gray-500">
                              Ficha de acompanhamento pós-ingresso de 120 dias no Lar Harmonia
                            </p>
                          </div>
                        </div>
                        {existingAvaliacao && (
                          <button
                            type="button"
                            onClick={() => setIsEditingAvaliacao(false)}
                            className="text-xs text-gray-500 hover:text-gray-800 font-medium px-2.5 py-1 rounded-lg hover:bg-gray-100"
                          >
                            Voltar para visualização
                          </button>
                        )}
                      </div>

                      {/* Notificações no Formulário de Avaliação */}
                      {avaliacaoErrorMsg && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-800 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                          {avaliacaoErrorMsg}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                        {/* 1. Data da Avaliação */}
                        <div className="md:col-span-4">
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                            Data da Avaliação <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={dataAvaliacao}
                            onChange={(e) => setDataAvaliacao(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-gray-300 text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                          <p className="text-[11px] text-gray-500 mt-1">
                            Padrão preenchido com a data atual.
                          </p>
                        </div>

                        {/* 2. Status Final do Curso */}
                        <div className="md:col-span-4">
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                            Status Final do Curso / Oficina <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={statusFinalCurso}
                            onChange={(e) => setStatusFinalCurso(e.target.value as any)}
                            className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-gray-300 text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                          >
                            <option value="Concluiu Oficina">Concluiu Oficina</option>
                            <option value="Desistiu (Evasão)">Desistiu (Evasão)</option>
                            <option value="Continua em Acompanhamento">Continua em Acompanhamento</option>
                          </select>
                          <p className="text-[11px] text-gray-500 mt-1">
                            Atualizará o status do assistido no sistema.
                          </p>
                        </div>

                        {/* 3. Impacto Gerado */}
                        <div className="md:col-span-4">
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                            Impacto Gerado <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={impactoGerado}
                            onChange={(e) => setImpactoGerado(e.target.value as any)}
                            className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-gray-300 text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                          >
                            <option value="Conseguiu Emprego">Conseguiu Emprego</option>
                            <option value="Abriu Pequeno Negócio">Abriu Pequeno Negócio</option>
                            <option value="Aumentou Renda em Casa">Aumentou Renda em Casa</option>
                            <option value="Sem Alteração Renda">Sem Alteração Renda</option>
                            <option value="Outro">Outro</option>
                          </select>
                          <p className="text-[11px] text-gray-500 mt-1">
                            Resultado socioeconômico direto.
                          </p>
                        </div>

                        {/* Campo condicional: Motivo da Evasão se Desistiu */}
                        {statusFinalCurso === 'Desistiu (Evasão)' && (
                          <div className="md:col-span-12 p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                            <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider">
                              Motivo da Evasão / Desistência <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <select
                                value={
                                  [
                                    'Transporte / Distância',
                                    'Horário incompatível / Conseguiu Trabalho',
                                    'Cuidado infantil / Dependentes',
                                    'Saúde fragilizada',
                                    'Mudança de endereço / Território',
                                    'Falta de interesse'
                                  ].includes(motivoEvasao)
                                    ? motivoEvasao
                                    : 'Outro'
                                }
                                onChange={(e) => {
                                  if (e.target.value !== 'Outro') {
                                    setMotivoEvasao(e.target.value);
                                  } else {
                                    setMotivoEvasao('');
                                  }
                                }}
                                className="w-full px-3 py-2 bg-white rounded-lg border border-gray-300 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                              >
                                <option value="Transporte / Distância">Transporte / Distância</option>
                                <option value="Horário incompatível / Conseguiu Trabalho">Horário incompatível / Conseguiu Trabalho</option>
                                <option value="Cuidado infantil / Dependentes">Cuidado infantil / Dependentes</option>
                                <option value="Saúde fragilizada">Saúde fragilizada</option>
                                <option value="Mudança de endereço / Território">Mudança de endereço / Território</option>
                                <option value="Falta de interesse">Falta de interesse</option>
                                <option value="Outro">Outro motivo especificado...</option>
                              </select>

                              <input
                                type="text"
                                placeholder="Especifique ou detalhe o motivo da evasão..."
                                value={motivoEvasao}
                                onChange={(e) => setMotivoEvasao(e.target.value)}
                                className="w-full px-3 py-2 bg-white rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                              />
                            </div>
                          </div>
                        )}

                        {/* 4. Mudança na Autonomia e Qualidade de Vida (Texto livre de depoimento/observações) */}
                        <div className="md:col-span-12 space-y-1.5">
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center justify-between">
                            <span>
                              Mudança na Autonomia e Qualidade de Vida (Depoimento / Observações){' '}
                              <span className="text-red-500">*</span>
                            </span>
                            <span className="text-[11px] text-gray-400 font-normal lowercase">
                              (relato do assistido e da equipe)
                            </span>
                          </label>
                          <textarea
                            rows={4}
                            value={mudancaAutonomia}
                            onChange={(e) => setMudancaAutonomia(e.target.value)}
                            placeholder="Descreva detalhadamente o depoimento do assistido sobre seu progresso, melhorias em sua renda, relações familiares, saúde mental e autonomia após a participação no Lar Harmonia..."
                            className="w-full px-4 py-3 bg-white rounded-xl border border-gray-300 text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none transition"
                          />
                        </div>
                      </div>

                      {/* Botões do Formulário de Avaliação */}
                      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                        {existingAvaliacao && (
                          <button
                            type="button"
                            onClick={() => setIsEditingAvaliacao(false)}
                            disabled={savingAvaliacao}
                            className="px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold transition"
                          >
                            Cancelar
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleSaveAvaliacao}
                          disabled={savingAvaliacao}
                          className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
                        >
                          <Save className="w-4 h-4" />
                          <span>
                            {savingAvaliacao ? 'Salvando Avaliação...' : 'Salvar Avaliação'}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RODAPÉ DO MODAL: AUDITORIA AMIGÁVEL DO OPERADOR E AÇÕES (Requisito 3) */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-500">
          
          {/* Seção Obrigatória de Auditoria e Operador */}
          <div className="space-y-1.5 py-0.5">
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-700">
              <span className="font-semibold text-gray-600 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-gray-500" /> Cadastrado por:
              </span>
              <strong className="text-gray-900 font-bold">
                {operadorCadastro.nome}
              </strong>
              <span className="text-gray-600 font-medium">
                ({operadorCadastro.cargo})
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600">em {formatDateTime(assistido.created_at)}</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-700">
              <span className="font-semibold text-gray-600 flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-gray-500" /> Última alteração por:
              </span>
              <strong className="text-gray-900 font-bold">
                {operadorAtualizacao.nome}
              </strong>
              <span className="text-gray-600 font-medium">
                ({operadorAtualizacao.cargo})
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600">em {formatDateTime(assistido.updated_at || assistido.created_at)}</span>
            </div>
          </div>

          {/* Botões de Ação no Rodapé */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {canUserDelete && !isEditingData && (
              <button
                type="button"
                onClick={handleDeleteAction}
                disabled={deletingFicha}
                className="inline-flex items-center gap-1.5 text-xs text-red-600 hover:text-red-800 font-bold hover:bg-red-50 px-3 py-2 rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {deletingFicha ? 'Excluindo...' : 'Excluir'}
              </button>
            )}

            {isEditingData ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={savingEdit}
                  className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveFullEdit}
                  disabled={savingEdit}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingEdit ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl transition shadow-2xs cursor-pointer"
                  title="Imprimir Ficha Completa A4"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Imprimir Ficha</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                >
                  Fechar Ficha
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* ESTILOS DE IMPRESSÃO EMBUTIDOS PARA GARANTIR COMPATIBILIDADE A4 */}
    <style>{`
      @media print {
        header, nav, aside, footer, .no-print, .no-print * {
          display: none !important;
          visibility: hidden !important;
        }

        button, [role="button"] {
          display: none !important;
        }

        html, body, #root, .min-h-screen {
          background: #ffffff !important;
          background-color: #ffffff !important;
          color: #111827 !important;
          margin: 0 !important;
          padding: 0 !important;
          height: auto !important;
          min-height: 0 !important;
          overflow: visible !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        #ficha-impressao-a4 {
          display: block !important;
          visibility: visible !important;
          position: relative !important;
          width: 100% !important;
          max-width: 210mm !important;
          margin: 0 auto !important;
          padding: 8mm 12mm !important;
          background: #ffffff !important;
          background-color: #ffffff !important;
          color: #111827 !important;
          box-shadow: none !important;
          border: none !important;
          z-index: 999999 !important;
        }

        #ficha-impressao-a4 * {
          visibility: visible !important;
        }

        .print-section {
          break-inside: avoid !important;
          page-break-inside: avoid !important;
          margin-bottom: 12px !important;
        }

        @page {
          size: A4 portrait;
          margin: 8mm 10mm;
        }
      }
    `}</style>

    {/* DOCUMENTO FORMATADO PARA IMPRESSÃO A4 (EXCLUSIVO @media print) */}
    <div id="ficha-impressao-a4" className="hidden print:block p-6 bg-white text-gray-900 text-xs">
      {/* Cabeçalho Institucional A4 */}
      <div className="print-section border-b-2 border-gray-900 pb-3 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          {assistido.foto_url && (
            <img
              src={assistido.foto_url}
              alt={assistido.nome_completo}
              className="w-16 h-16 rounded-lg object-cover border border-gray-300"
            />
          )}
          <div>
            <h1 className="text-sm font-extrabold uppercase tracking-wide text-gray-900">
              Fundação Lar Harmonia
            </h1>
            <h2 className="text-xs font-semibold text-gray-700">
              Setor de Serviço Social • Ficha Cadastral e Acompanhamento do Assistido
            </h2>
            <p className="text-[10px] text-gray-500 mt-0.5">
              Protocolo Cadastral: #{assistido.id} • Emissão: {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="inline-block border border-gray-800 px-2.5 py-0.5 text-xs font-bold uppercase rounded">
            {assistido.status_curso || 'Em Acompanhamento'}
          </span>
          <p className="text-[10px] text-gray-600 mt-1">
            Ingresso: {formatDate(assistido.data_ingresso || assistido.created_at)}
          </p>
        </div>
      </div>

      {/* 1. Identificação Civil & Contato (Aba 1) */}
      <div className="print-section mb-3.5">
        <h3 className="text-[11px] font-bold uppercase tracking-wider bg-gray-100 px-2 py-1 border-l-4 border-emerald-600 mb-1.5">
          1. Identificação Civil & Contato
        </h3>
        <div className="grid grid-cols-3 gap-2 border border-gray-200 p-2.5 rounded text-[11px]">
          <div>
            <span className="text-gray-500 block">Nome Completo:</span>
            <strong className="text-gray-900">{assistido.nome_completo}</strong>
          </div>
          <div>
            <span className="text-gray-500 block">CPF:</span>
            <span>{assistido.cpf || 'Não informado'}</span>
          </div>
          <div>
            <span className="text-gray-500 block">RG:</span>
            <span>{assistido.rg || 'Não informado'}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Data de Nasc. / Idade:</span>
            <span>
              {assistido.data_nascimento ? formatDate(assistido.data_nascimento) : 'Não informada'}
              {assistido.idade ? ` (${assistido.idade} anos)` : ''}
            </span>
          </div>
          <div>
            <span className="text-gray-500 block">Raça / Cor:</span>
            <span>{assistido.raca_cor || 'Não informada'}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Estado Civil:</span>
            <span>{assistido.estado_civil || 'Não informado'}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Telefone:</span>
            <span>{assistido.telefone || 'Não informado'}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Bairro:</span>
            <span>{assistido.bairro || 'Não informado'}</span>
          </div>
          <div>
            <span className="text-gray-500 block">CRAS de Referência:</span>
            <span>{assistido.possui_cras ? `Sim (${assistido.bairro_cras || 'Bairro'})` : 'Não possui'}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Cadastro FLH:</span>
            <span>{assistido.possui_cadastro_flh ? 'Sim (Já cadastrado)' : 'Primeiro Cadastro'}</span>
          </div>
          <div className="col-span-2">
            <span className="text-gray-500 block">Endereço Completo:</span>
            <span>{assistido.endereco || 'Não informado'}</span>
          </div>
        </div>
      </div>

      {/* 2. Trabalho, Renda & Benefícios (Aba 2) */}
      <div className="print-section mb-3.5">
        <h3 className="text-[11px] font-bold uppercase tracking-wider bg-gray-100 px-2 py-1 border-l-4 border-emerald-600 mb-1.5">
          2. Trabalho, Renda & Benefícios
        </h3>
        <div className="grid grid-cols-3 gap-2 border border-gray-200 p-2.5 rounded text-[11px]">
          <div>
            <span className="text-gray-500 block">Escolaridade:</span>
            <span>{assistido.escolaridade || 'Não informada'}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Profissão / Ocupação:</span>
            <span>{assistido.profissao || assistido.atividade_remunerada || 'Não informada'}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Atividade Remunerada:</span>
            <span>{assistido.atividade_remunerada || 'Não informada'}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Renda Familiar Aproximada:</span>
            <span>
              {assistido.renda_familiar_aproximada
                ? `R$ ${assistido.renda_familiar_aproximada}`
                : 'Sem renda informada'}
            </span>
          </div>
          <div className="col-span-2">
            <span className="text-gray-500 block">Benefícios Sociais:</span>
            <span>
              {Array.isArray(assistido.beneficios_sociais) && assistido.beneficios_sociais.length > 0
                ? assistido.beneficios_sociais.join(', ')
                : 'Nenhum benefício social registrado'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Moradia & Família (Aba 3) */}
      <div className="print-section mb-3.5">
        <h3 className="text-[11px] font-bold uppercase tracking-wider bg-gray-100 px-2 py-1 border-l-4 border-emerald-600 mb-1.5">
          3. Moradia & Composição Familiar
        </h3>
        <div className="grid grid-cols-3 gap-2 border border-gray-200 p-2.5 rounded text-[11px]">
          <div>
            <span className="text-gray-500 block">Tipo de Moradia:</span>
            <span>{assistido.tipo_moradia || 'Não informado'}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Composição Familiar:</span>
            <span>{assistido.composicao_familiar ? `${assistido.composicao_familiar} pessoa(s)` : 'Não informada'}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Quantidade de Filhos:</span>
            <span>{assistido.quantidade_filhos !== undefined && assistido.quantidade_filhos !== null ? `${assistido.quantidade_filhos} filho(s)` : 'Não informado'}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Serviços Básicos (Água / Luz):</span>
            <span>{assistido.servicos_basicos_regulares ? 'Regulares' : 'Irregulares / Parciais'}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Acesso à Internet:</span>
            <span>{assistido.acesso_internet || 'Não informado'}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Rede de Apoio:</span>
            <span>{assistido.rede_apoio || 'Não informada'}</span>
          </div>
        </div>
      </div>

      {/* 4. Saúde & Vulnerabilidades (Aba 4) */}
      <div className="print-section mb-3.5">
        <h3 className="text-[11px] font-bold uppercase tracking-wider bg-gray-100 px-2 py-1 border-l-4 border-emerald-600 mb-1.5">
          4. Saúde & Vulnerabilidades
        </h3>
        <div className="grid grid-cols-2 gap-2 border border-gray-200 p-2.5 rounded text-[11px]">
          <div>
            <span className="text-gray-500 block">Doenças Crônicas na Família:</span>
            <span>
              {Array.isArray(assistido.doencas_cronicas_familia) && assistido.doencas_cronicas_familia.length > 0
                ? assistido.doencas_cronicas_familia.join(', ')
                : typeof assistido.doencas_cronicas_familia === 'string'
                ? assistido.doencas_cronicas_familia
                : 'Nenhuma registrada'}
            </span>
          </div>
          <div>
            <span className="text-gray-500 block">Possui Deficiência / Síndrome:</span>
            <span>
              {assistido.possui_deficiencia
                ? Array.isArray(assistido.tipos_deficiencia) && assistido.tipos_deficiencia.length > 0
                  ? `Sim (${assistido.tipos_deficiencia.join(', ')})`
                  : 'Sim'
                : 'Não'}
            </span>
          </div>
          <div>
            <span className="text-gray-500 block">Dificuldades Enfrentadas:</span>
            <span>
              {Array.isArray(assistido.dificuldades_enfrentadas) && assistido.dificuldades_enfrentadas.length > 0
                ? assistido.dificuldades_enfrentadas.join(', ')
                : 'Nenhuma informada'}
            </span>
          </div>
          <div>
            <span className="text-gray-500 block">Fatores de Risco de Evasão:</span>
            <span>
              {Array.isArray(assistido.fatores_risco_evasao) && assistido.fatores_risco_evasao.length > 0
                ? assistido.fatores_risco_evasao.join(', ')
                : 'Nenhum identificado'}
            </span>
          </div>
          <div className="col-span-2">
            <span className="text-gray-500 block">Serviços de Acompanhamento Social:</span>
            <span>
              {Array.isArray(assistido.servicos_acompanhamento) && assistido.servicos_acompanhamento.length > 0
                ? assistido.servicos_acompanhamento.join(', ')
                : 'Nenhum serviço registrado'}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Oficinas & Acompanhamento FLH (Aba 5) */}
      <div className="print-section mb-3.5">
        <h3 className="text-[11px] font-bold uppercase tracking-wider bg-gray-100 px-2 py-1 border-l-4 border-emerald-600 mb-1.5">
          5. Oficinas & Acompanhamento na Fundação Lar Harmonia
        </h3>
        <div className="grid grid-cols-2 gap-2 border border-gray-200 p-2.5 rounded text-[11px]">
          <div>
            <span className="text-gray-500 block">Oficina / Curso Vinculado:</span>
            <strong className="text-gray-900">{assistido.curso_pretendido || 'Geral / Acompanhamento Social'}</strong>
          </div>
          <div>
            <span className="text-gray-500 block">Data de Ingresso:</span>
            <span>{formatDate(assistido.data_ingresso || assistido.created_at)}</span>
          </div>
          <div className="col-span-2">
            <span className="text-gray-500 block">Motivo da Busca & Expectativas:</span>
            <span>{assistido.motivo_busca || assistido.expectativa_curso || 'Não informado'}</span>
          </div>
          {assistido.objetivo_profissional_3_meses && (
            <div className="col-span-2">
              <span className="text-gray-500 block">Objetivo Profissional (3 Meses):</span>
              <span>{assistido.objetivo_profissional_3_meses}</span>
            </div>
          )}
          {assistido.cursos_anteriores && (
            <div className="col-span-2">
              <span className="text-gray-500 block">Cursos Anteriores na FLH:</span>
              <span>
                {Array.isArray(assistido.cursos_anteriores)
                  ? assistido.cursos_anteriores.join(', ')
                  : assistido.cursos_anteriores}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 6. Avaliação de 4 Meses */}
      <div className="print-section mb-4">
        <h3 className="text-[11px] font-bold uppercase tracking-wider bg-gray-100 px-2 py-1 border-l-4 border-amber-600 mb-1.5">
          6. Registro de Avaliação de 4 Meses
        </h3>
        <div className="border border-gray-200 p-2.5 rounded text-[11px]">
          {existingAvaliacao ? (
            <div className="space-y-1.5">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-gray-500 block">Data da Avaliação:</span>
                  <strong>{formatDate(existingAvaliacao.data_avaliacao)}</strong>
                </div>
                <div>
                  <span className="text-gray-500 block">Status Final do Curso:</span>
                  <strong>{existingAvaliacao.status_final_curso}</strong>
                </div>
                <div>
                  <span className="text-gray-500 block">Impacto na Renda/Vida:</span>
                  <strong>{existingAvaliacao.impacto_gerado}</strong>
                </div>
              </div>
              {existingAvaliacao.mudanca_autonomia_qualidade_vida && (
                <div>
                  <span className="text-gray-500 block">Depoimento / Mudança na Autonomia:</span>
                  <p className="italic text-gray-800">"{existingAvaliacao.mudanca_autonomia_qualidade_vida}"</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 italic">
              {isPendente4Meses
                ? 'Assistido com 4 meses de acompanhamento completos - Avaliação Pendente de Registro.'
                : 'Assistido em período regular de acompanhamento (< 120 dias). Avaliação de 4 meses ainda não realizada.'}
            </p>
          )}
        </div>
      </div>

      {/* Rodapé com Assinaturas Oficiais */}
      <div className="print-section pt-4 mt-4 border-t border-gray-300">
        <p className="text-[9px] text-gray-500 text-center mb-6">
          Declaro para os devidos fins que as informações acima foram registradas no Sistema Social da Fundação Lar Harmonia.
        </p>

        <div className="grid grid-cols-2 gap-8 text-center text-xs">
          <div>
            <div className="border-t border-gray-800 pt-1.5 w-4/5 mx-auto">
              <p className="font-bold text-gray-900">{assistido.nome_completo}</p>
              <p className="text-[10px] text-gray-500">Assinatura do Assistido</p>
            </div>
          </div>
          <div>
            <div className="border-t border-gray-800 pt-1.5 w-4/5 mx-auto">
              <p className="font-bold text-gray-900">
                {operadorAtualizacao?.nome || 'Serviço Social'}
              </p>
              <p className="text-[10px] text-gray-500">
                {operadorAtualizacao?.cargo || 'Assistente Social Responsável'} • FLH
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Mini-Modal de Confirmação Estilizado */}
      {showDirectConfirmModal && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-inner">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-heading">
                Confirmar Exclusão de Ficha
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Esta ação é irreversível e excluirá permanentemente o cadastro de:
              </p>
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-100 dark:border-rose-900/50">
                <p className="text-sm font-bold text-rose-700 dark:text-rose-300">
                  {assistido.nome_completo}
                </p>
                {assistido.cpf && (
                  <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80 font-mono mt-0.5">
                    CPF: {formatCPF(assistido.cpf)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDirectConfirmModal(false)}
                disabled={deletingFicha}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteDirectDelete}
                disabled={deletingFicha}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                {deletingFicha ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Sim, Excluir
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </>
  );
};
