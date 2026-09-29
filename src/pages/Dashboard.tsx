import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase/client';
import { useAuth } from '../context/AuthContext';
import { assistidosService } from '../services/assistidosService';
import { VerFichaModal, Assistido } from '../components/VerFichaModal';
export type { Assistido };
import {
  isPendenteAvaliacao4Meses,
  hasAvaliacao4Meses,
  isStatusAtivo,
  getDiasIngresso,
  FILTRO_AVALIACAO_4_MESES
} from '../utils/avaliacao4Meses';
export { isPendenteAvaliacao4Meses, hasAvaliacao4Meses };
import {
  Search,
  SlidersHorizontal,
  RotateCcw,
  User as UserIcon,
  MapPin,
  Calendar,
  GraduationCap,
  Trash2,
  Eye,
  Plus,
  Phone,
  Home,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  HeartPulse,
  Save,
  Users,
  DollarSign,
  Briefcase,
  Wifi,
  Baby,
  AlertTriangle,
  Clock,
  LayoutGrid,
  List,
  ClipboardList,
  Download,
  FileSpreadsheet
} from 'lucide-react';

const COMPOSICAO_LIST = [
  'Todos',
  'Mora Sozinho (1 pessoa)',
  '2 a 4 pessoas',
  '5+ pessoas',
  'Em Situação de Rua'
];

const FILHOS_LIST = [
  'Todos',
  'Sem Filhos',
  'Com Filhos'
];

const FAIXAS_RENDA_LIST = [
  'Todas as Faixas',
  'Sem Renda (R$ 0)',
  'Até R$ 600',
  'De R$ 601 a R$ 1.200',
  'De R$ 1.201 a R$ 2.000',
  'De R$ 2.001 a R$ 3.500',
  'De R$ 3.501 a R$ 5.000',
  'Acima de R$ 5.000'
];

const SAUDE_FAMILIA_LIST = [
  'Todas',
  'Com Condição de Saúde Registrada',
  'Doença Crônica',
  'Dependência Química',
  'Saúde Mental',
  'Deficiência / Síndrome'
];

const SERVICOS_FLH_LIST = [
  'Todos',
  'Ambulatório',
  'Psicologia',
  'Jurídico',
  'SAC',
  'Programas Sociais',
  'Programa Idosos',
  'Programa Crianças/Adolescentes',
  'Nenhum'
];

const OCUPACAO_LIST = [
  'Todos',
  'Com Atividade Remunerada',
  'Desempregados / Sem Ocupação'
];

const INTERNET_LIST = [
  'Todos',
  'Sim',
  'Não'
];

const OFICINAS_LIST = [
  'Todos',
  'Informática',
  'Corte e Costura',
  'Manicure',
  'Cabeleireiro',
  'Tranças / Design de Unhas',
  'Barbeiro',
  'Massoterapia',
  'Pilates',
  'Crochê / Artesanato',
  'Inglês',
  'Balé / Capoeira',
  'Nenhuma Oficina (Apenas Acompanhamento)'
];

const STATUS_LIST = [
  'Todos os Status',
  'Apenas Ativos',
  'Apenas Concluídos',
  'Apenas Desistentes',
  'Pausados'
];

const ANOS_LIST = [
  'Todos os Anos',
  '2026',
  '2025',
  '2024',
  '2023',
  '2022 ou anterior'
];

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

// Helper para extrair quantidade de filhos de um assistido
export function getAssistidoFilhos(item: Assistido): number | null {
  if (
    item.quantidade_filhos !== undefined &&
    item.quantidade_filhos !== null &&
    !isNaN(Number(item.quantidade_filhos))
  ) {
    return Number(item.quantidade_filhos);
  }
  if (item.tipo_moradia) {
    const match = item.tipo_moradia.match(/Filhos:\s*(\d+)/);
    if (match) return Number(match[1]);
  }
  return null;
}

// Helper para obter a Faixa de Renda exata de um assistido
export function getAssistidoFaixaRenda(item: Assistido): string {
  if (item.tipo_moradia?.includes('Faixa de Renda:')) {
    const match = item.tipo_moradia.match(/Faixa de Renda:\s*([^|]+)/);
    if (match && match[1]?.trim()) {
      return match[1].trim();
    }
  }
  if (item.profissao?.includes('Renda Familiar:')) {
    const match = item.profissao.match(/Renda Familiar:\s*([^|]+)/);
    if (match && match[1]?.trim()) {
      return match[1].trim();
    }
  }
  const val = Number(item.renda_familiar_aproximada);
  if (isNaN(val) || val === 0) return 'Sem Renda (R$ 0)';
  if (val <= 600) return 'Até R$ 600';
  if (val <= 1200) return 'De R$ 601 a R$ 1.200';
  if (val <= 2000) return 'De R$ 1.201 a R$ 2.000';
  if (val <= 3500) return 'De R$ 2.001 a R$ 3.500';
  if (val <= 5000) return 'De R$ 3.501 a R$ 5.000';
  return 'Acima de R$ 5.000';
}

export default function Dashboard() {
  const { user, canDelete, canEdit } = useAuth();

  // Estados principais de dados
  const [assistidos, setAssistidos] = useState<Assistido[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Estados de busca e filtros (painel expandido por padrão conforme solicitado)
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterLocalidade, setFilterLocalidade] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(true);

  // Filtros detalhados do formulário
  const [filterComposicao, setFilterComposicao] = useState<string>('Todos');
  const [filterFilhos, setFilterFilhos] = useState<string>('Todos');
  const [filterFaixaRenda, setFilterFaixaRenda] = useState<string>('Todas as Faixas');
  const [filterSaudeFamilia, setFilterSaudeFamilia] = useState<string>('Todas');
  const [filterServicosFLH, setFilterServicosFLH] = useState<string>('Todos');
  const [filterOcupacao, setFilterOcupacao] = useState<string>('Todos');
  const [filterInternet, setFilterInternet] = useState<string>('Todos');

  // Filtros complementares
  const [filterOficina, setFilterOficina] = useState<string>('Todos');
  const [filterStatus, setFilterStatus] = useState<string>('Todos os Status');
  const [filterAvaliacao, setFilterAvaliacao] = useState<string>('Todos');
  const [filterAno, setFilterAno] = useState<string>('Todos os Anos');
  const [filterDataInicial, setFilterDataInicial] = useState<string>('');
  const [filterDataFinal, setFilterDataFinal] = useState<string>('');

  // Modo de visualização: Grade de Cards ou Tabela
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Modal de Detalhes / Ficha Completa
  const [selectedAssistido, setSelectedAssistido] = useState<Assistido | null>(null);

  // Modal de Exclusão (Admin)
  const [assistidoToDelete, setAssistidoToDelete] = useState<Assistido | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  // Identificação se o usuário logado é Admin (Apenas Diretoria/Admin tem permissão de exclusão)
  const isAdmin = canDelete;

  // Carregar assistidos (com fallback offline seguro)
  const fetchAssistidos = async (showLoading: boolean = true) => {
    const shouldShow = typeof showLoading === 'boolean' ? showLoading : true;
    if (shouldShow) setLoading(true);
    setErrorMsg(null);
    try {
      const data = await assistidosService.getAll();
      setAssistidos(data || []);
    } catch (err: any) {
      console.error('Erro ao carregar assistidos:', err);
      setErrorMsg('Não foi possível carregar a lista de assistidos no momento. Tente novamente.');
    } finally {
      if (shouldShow) setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Busca direta no banco sempre que o Dashboard for carregado
    fetchAssistidos(true);

    // 2. Re-executa sempre que a aba ganhar foco
    const handleFocus = () => {
      fetchAssistidos(false);
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchAssistidos(false);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 3. Sincronização em tempo real via Supabase Realtime se configurado
    let channel: any = null;
    try {
      const hasUrl = typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL;
      if (hasUrl) {
        channel = supabase
          .channel('assistidos-realtime-dashboard')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'assistidos' },
            (payload) => {
              if (payload.eventType === 'DELETE') {
                const deletedId = (payload.old as any)?.id;
                if (deletedId) {
                  setAssistidos((prev) => prev.filter((a) => a.id !== deletedId));
                } else {
                  fetchAssistidos(false);
                }
              } else {
                fetchAssistidos(false);
              }
            }
          )
          .subscribe();
      }
    } catch (channelErr) {
      console.warn('Realtime channel não disponível:', channelErr);
    }

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch {}
      }
    };
  }, []);

  // Métricas rápidas calculadas para o topo do Dashboard
  const metrics = useMemo(() => {
    let pendentes4Meses = 0;
    let avaliacoesConcluidas = 0;
    let ativosAcompanhamento = 0;

    for (const item of assistidos) {
      if (isPendenteAvaliacao4Meses(item)) {
        pendentes4Meses++;
      }
      if (hasAvaliacao4Meses(item)) {
        avaliacoesConcluidas++;
      }
      if (isStatusAtivo(item.status_curso)) {
        ativosAcompanhamento++;
      }
    }

    return {
      total: assistidos.length,
      pendentes4Meses,
      avaliacoesConcluidas,
      ativosAcompanhamento
    };
  }, [assistidos]);

  // Limpeza de todos os filtros
  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterLocalidade('');
    setFilterComposicao('Todos');
    setFilterFilhos('Todos');
    setFilterFaixaRenda('Todas as Faixas');
    setFilterSaudeFamilia('Todas');
    setFilterServicosFLH('Todos');
    setFilterOcupacao('Todos');
    setFilterInternet('Todos');
    setFilterOficina('Todos');
    setFilterStatus('Todos os Status');
    setFilterAvaliacao('Todos');
    setFilterAno('Todos os Anos');
    setFilterDataInicial('');
    setFilterDataFinal('');
  };

  // Contagem de filtros ativos
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filterLocalidade.trim()) count++;
    if (filterComposicao !== 'Todos') count++;
    if (filterFilhos !== 'Todos') count++;
    if (filterFaixaRenda !== 'Todas as Faixas') count++;
    if (filterSaudeFamilia !== 'Todas') count++;
    if (filterServicosFLH !== 'Todos') count++;
    if (filterOcupacao !== 'Todos') count++;
    if (filterInternet !== 'Todos') count++;
    if (filterOficina !== 'Todos') count++;
    if (filterStatus !== 'Todos os Status') count++;
    if (filterAvaliacao !== 'Todos') count++;
    if (filterAno !== 'Todos os Anos') count++;
    if (filterDataInicial) count++;
    if (filterDataFinal) count++;
    return count;
  }, [
    filterLocalidade,
    filterComposicao,
    filterFilhos,
    filterFaixaRenda,
    filterSaudeFamilia,
    filterServicosFLH,
    filterOcupacao,
    filterInternet,
    filterOficina,
    filterStatus,
    filterAvaliacao,
    filterAno,
    filterDataInicial,
    filterDataFinal
  ]);

  // Filtragem dinâmica e precisa em tempo real
  const filteredAssistidos = useMemo(() => {
    return assistidos.filter((item) => {
      // 1. Busca textual rápida (Nome, CPF ou RG)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const nomeMatch = item.nome_completo?.toLowerCase().includes(query) ?? false;
        const cleanQueryCpf = query.replace(/\D/g, '');
        const cpfMatch = cleanQueryCpf && item.cpf ? item.cpf.replace(/\D/g, '').includes(cleanQueryCpf) : false;
        const rgMatch = item.rg?.toLowerCase().includes(query) ?? false;
        if (!nomeMatch && !cpfMatch && !rgMatch) {
          return false;
        }
      }

      // 2. Filtro Localidade (Bairro / Cidade dinâmico)
      if (filterLocalidade.trim()) {
        const locQuery = filterLocalidade.toLowerCase().trim();
        const bMatch = item.bairro?.toLowerCase().includes(locQuery) ?? false;
        const endMatch = item.endereco?.toLowerCase().includes(locQuery) ?? false;
        const crasMatch = item.bairro_cras?.toLowerCase().includes(locQuery) ?? false;
        if (!bMatch && !endMatch && !crasMatch) {
          return false;
        }
      }

      // 3. Filtro Composição Familiar: [Todos] [Mora Sozinho (1 pessoa)] [2 a 4 pessoas] [5+ pessoas] [Em Situação de Rua]
      if (filterComposicao !== 'Todos') {
        const isRua =
          item.tipo_moradia?.toLowerCase().includes('rua') ||
          (item.endereco?.toLowerCase().includes('rua') &&
            item.endereco?.toLowerCase().includes('situação'));
        if (filterComposicao === 'Em Situação de Rua') {
          if (!isRua) return false;
        } else if (filterComposicao === 'Mora Sozinho (1 pessoa)') {
          if (isRua) return false;
          const comp = item.composicao_familiar || 1;
          if (comp !== 1) return false;
        } else if (filterComposicao === '2 a 4 pessoas') {
          if (isRua) return false;
          const comp = item.composicao_familiar || 1;
          if (comp < 2 || comp > 4) return false;
        } else if (filterComposicao === '5+ pessoas') {
          if (isRua) return false;
          const comp = item.composicao_familiar || 1;
          if (comp < 5) return false;
        }
      }

      // 4. Filtro Filhos: [Todos] [Sem Filhos] [Com Filhos]
      if (filterFilhos !== 'Todos') {
        const qtd = getAssistidoFilhos(item);
        if (filterFilhos === 'Sem Filhos') {
          if (qtd !== null && qtd > 0) return false;
        } else if (filterFilhos === 'Com Filhos') {
          if (qtd === null || qtd <= 0) return false;
        }
      }

      // 5. Filtro Faixa de Renda: [Todas as Faixas] [Sem Renda (R$ 0)] [Até R$ 600] [De R$ 601 a R$ 1.200] [De R$ 1.201 a R$ 2.000] [De R$ 2.001 a R$ 3.500] [De R$ 3.501 a R$ 5.000] [Acima de R$ 5.000]
      if (filterFaixaRenda !== 'Todas as Faixas') {
        const itemFaixa = getAssistidoFaixaRenda(item);
        if (itemFaixa !== filterFaixaRenda) {
          return false;
        }
      }

      // 6. Filtro Saúde na Família: [Todas] [Com Condição de Saúde Registrada] [Doença Crônica] [Dependência Química] [Saúde Mental] [Deficiência / Síndrome]
      if (filterSaudeFamilia !== 'Todas') {
        const saudeArr = Array.isArray(item.doencas_cronicas_familia)
          ? item.doencas_cronicas_familia
          : typeof item.doencas_cronicas_familia === 'string'
          ? [item.doencas_cronicas_familia]
          : [];
        const saudeStr = saudeArr.join(' ').toLowerCase();
        const hasCondicaoRegistrada =
          saudeArr.some(
            (c) =>
              c &&
              !c.toLowerCase().includes('nenhuma') &&
              !c.toLowerCase().includes('não informado')
          ) || Boolean(item.possui_deficiencia);

        if (filterSaudeFamilia === 'Com Condição de Saúde Registrada') {
          if (!hasCondicaoRegistrada) return false;
        } else if (filterSaudeFamilia === 'Doença Crônica') {
          if (!saudeStr.includes('crônica') && !saudeStr.includes('cronica')) return false;
        } else if (filterSaudeFamilia === 'Dependência Química') {
          if (!saudeStr.includes('química') && !saudeStr.includes('quimica') && !saudeStr.includes('depend')) return false;
        } else if (filterSaudeFamilia === 'Saúde Mental') {
          if (!saudeStr.includes('mental')) return false;
        } else if (filterSaudeFamilia === 'Deficiência / Síndrome') {
          const hasDef =
            Boolean(item.possui_deficiencia) ||
            saudeStr.includes('deficiên') ||
            saudeStr.includes('deficien') ||
            saudeStr.includes('síndrome') ||
            saudeStr.includes('sindrome');
          if (!hasDef) return false;
        }
      }

      // 7. Filtro Serviços da FLH: [Todos] [Ambulatório] [Psicologia] [Jurídico] [SAC] [Programas Sociais]
      if (filterServicosFLH !== 'Todos') {
        const servicos = Array.isArray(item.servicos_acompanhamento)
          ? item.servicos_acompanhamento
          : typeof item.servicos_acompanhamento === 'string'
          ? [item.servicos_acompanhamento]
          : [];
        const servicosStr = servicos.join(' ').toLowerCase();

        if (filterServicosFLH === 'Nenhum') {
          const hasNenhum =
            servicos.length === 0 ||
            servicos.some(
              (s) =>
                s.toLowerCase().includes('nenhum') ||
                s.toLowerCase().includes('nunca')
            );
          if (!hasNenhum) return false;
        } else if (filterServicosFLH === 'Programas Sociais') {
          const hasProg =
            servicosStr.includes('programa') ||
            servicosStr.includes('criança') ||
            servicosStr.includes('crianca') ||
            servicosStr.includes('adolescente') ||
            servicosStr.includes('idoso') ||
            (Array.isArray(item.beneficios_sociais) &&
              item.beneficios_sociais.some((b) => !b.toLowerCase().includes('nenhum')));
          if (!hasProg) return false;
        } else if (filterServicosFLH === 'Programa Idosos') {
          if (!servicosStr.includes('idoso')) return false;
        } else if (filterServicosFLH === 'Programa Crianças/Adolescentes') {
          if (
            !servicosStr.includes('criança') &&
            !servicosStr.includes('crianca') &&
            !servicosStr.includes('adolescente')
          ) {
            return false;
          }
        } else {
          const target = filterServicosFLH.toLowerCase();
          if (!servicosStr.includes(target)) {
            return false;
          }
        }
      }

      // 8. Filtro Ocupação / Trabalho: [Todos] [Com Atividade Remunerada] [Desempregados / Sem Ocupação]
      if (filterOcupacao !== 'Todos') {
        const isRemunerada = item.atividade_remunerada === 'Sim';
        if (filterOcupacao === 'Com Atividade Remunerada' && !isRemunerada) return false;
        if (filterOcupacao === 'Desempregados / Sem Ocupação' && isRemunerada) return false;
      }

      // 9. Filtro Acesso à Internet: [Todos] [Sim] [Não]
      if (filterInternet !== 'Todos') {
        const internetVal = (item.acesso_internet || '').toLowerCase();
        const hasInternet = internetVal === 'sim' || internetVal === 'true';
        if (filterInternet === 'Sim' && !hasInternet) return false;
        if (filterInternet === 'Não' && hasInternet) return false;
      }

      // 10. Filtro Oficina / Curso
      if (filterOficina !== 'Todos') {
        if ((item.curso_pretendido || '').toLowerCase() !== filterOficina.toLowerCase()) {
          return false;
        }
      }

      // 11. Filtro Status: [Todos os Status] [Apenas Ativos] [Apenas Concluídos] [Apenas Desistentes] [Pausados]
      if (filterStatus !== 'Todos os Status') {
        const currentStatus = (item.status_curso || '').toLowerCase();
        if (filterStatus === 'Apenas Ativos') {
          const isAtivo =
            currentStatus.includes('ativo') ||
            currentStatus.includes('acompanhamento') ||
            !currentStatus;
          if (!isAtivo) return false;
        } else if (filterStatus === 'Apenas Concluídos') {
          if (!currentStatus.includes('conclu') && !currentStatus.includes('formad')) return false;
        } else if (filterStatus === 'Apenas Desistentes') {
          if (
            !currentStatus.includes('desist') &&
            !currentStatus.includes('evas') &&
            !currentStatus.includes('trancad') &&
            !currentStatus.includes('desligad')
          ) {
            return false;
          }
        } else if (filterStatus === 'Pausados') {
          if (!currentStatus.includes('pausad')) return false;
        }
      }

      // 12. Filtro Dedicado "Avaliação de 4 Meses":
      // [Todos]
      // [⚠️ Pendentes de Avaliação (>= 4 Meses)] (Exibe apenas os assistidos com 120+ dias de curso ativos e sem avaliação)
      // [⏳ Em Acompanhamento (< 4 Meses)] (Exibe assistidos mais recentes com menos de 120 dias)
      // [✅ Avaliação Concluída] (Exibe assistidos que já tiveram a avaliação de 4 meses registrada)
      if (filterAvaliacao !== 'Todos') {
        if (filterAvaliacao === '⚠️ Pendentes de Avaliação (>= 4 Meses)') {
          if (!isPendenteAvaliacao4Meses(item)) {
            return false;
          }
        } else if (filterAvaliacao === '⏳ Em Acompanhamento (< 4 Meses)') {
          const dias = getDiasIngresso(item.data_ingresso, item.created_at);
          const isRecente =
            dias !== null &&
            dias < 120 &&
            isStatusAtivo(item.status_curso) &&
            !hasAvaliacao4Meses(item);
          if (!isRecente) {
            return false;
          }
        } else if (filterAvaliacao === '✅ Avaliação Concluída') {
          if (!hasAvaliacao4Meses(item)) {
            return false;
          }
        }
      }

      // 13. Filtro de Período de Entrada (Por Ano e/ou Intervalo De-Até)
      const dataEntradaStr = item.data_ingresso || item.created_at;
      if (filterAno !== 'Todos os Anos') {
        if (!dataEntradaStr) return false;
        const entryDate = new Date(dataEntradaStr);
        if (isNaN(entryDate.getTime())) return false;
        const entryYear = entryDate.getFullYear();
        if (filterAno === '2022 ou anterior') {
          if (entryYear > 2022) return false;
        } else {
          if (entryYear !== Number(filterAno)) return false;
        }
      }

      if (filterDataInicial) {
        if (!dataEntradaStr) return false;
        const itemYmd = dataEntradaStr.split('T')[0];
        if (itemYmd < filterDataInicial) return false;
      }

      if (filterDataFinal) {
        if (!dataEntradaStr) return false;
        const itemYmd = dataEntradaStr.split('T')[0];
        if (itemYmd > filterDataFinal) return false;
      }

      return true;
    });
  }, [
    assistidos,
    searchTerm,
    filterLocalidade,
    filterComposicao,
    filterFilhos,
    filterFaixaRenda,
    filterSaudeFamilia,
    filterServicosFLH,
    filterOcupacao,
    filterInternet,
    filterOficina,
    filterStatus,
    filterAvaliacao,
    filterAno,
    filterDataInicial,
    filterDataFinal
  ]);

  // Formatação de data em português
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Não registrada';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  // Exportação de Relatório em Excel/CSV respeitando os filtros ativos
  const handleExportCSV = () => {
    if (filteredAssistidos.length === 0) {
      setErrorMsg('Nenhum assistido encontrado nos filtros ativos para exportação.');
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }

    const escapeCSV = (value: any): string => {
      if (value === null || value === undefined) return '""';
      const str = String(value).trim();
      return `"${str.replace(/"/g, '""')}"`;
    };

    // 16 Colunas do Relatório conforme especificação
    const headers = [
      'ID Cadastral',
      'Nome Completo',
      'CPF',
      'Telefone',
      'Data de Ingresso',
      'Status do Acompanhamento',
      'Bairro / Localidade',
      'Escolaridade',
      'Ocupação / Trabalho',
      'Faixa de Renda (Renda Familiar / Própria)',
      'Composição Familiar (Pessoas)',
      'Filhos',
      'Acesso à Internet',
      'Condições de Saúde na Família',
      'Oficina Pretendida',
      'Pendente Avaliação 4 Meses? (Sim/Não)'
    ];

    const rows = filteredAssistidos.map((item) => {
      // 1. ID Cadastral
      const id = item.id || '';

      // 2. Nome Completo
      const nome = item.nome_completo || '';

      // 3. CPF
      const cpf = item.cpf || 'Não informado';

      // 4. Telefone
      const telefone = item.telefone || 'Não informado';

      // 5. Data de Ingresso
      const dataIngresso = formatDate(item.data_ingresso || item.created_at);

      // 6. Status do Acompanhamento
      const statusAcompanhamento = item.status_curso || 'Em Acompanhamento';

      // 7. Bairro / Localidade
      const isRua =
        item.tipo_moradia === 'Em situação de rua' ||
        item.endereco === 'Em situação de rua';
      const bairroLocalidade = isRua
        ? 'Em situação de rua'
        : item.bairro || item.endereco || item.bairro_cras || 'Não informado';

      // 8. Escolaridade
      const escolaridade = item.escolaridade || 'Não informada';

      // 9. Ocupação / Trabalho
      const ocupacao = item.profissao || item.atividade_remunerada || 'Não informada';

      // 10. Faixa de Renda (Renda Familiar / Própria)
      const faixaRenda = getAssistidoFaixaRenda(item);

      // 11. Composição Familiar (Pessoas)
      const composicao =
        item.composicao_familiar !== undefined && item.composicao_familiar !== null
          ? `${item.composicao_familiar} pessoa(s)`
          : 'Não informada';

      // 12. Filhos
      const qtdFilhos = getAssistidoFilhos(item);
      const filhos = qtdFilhos !== null ? `${qtdFilhos}` : 'Não informado';

      // 13. Acesso à Internet
      const internet = item.acesso_internet || 'Não informado';

      // 14. Condições de Saúde na Família
      const saudeList: string[] = [];
      if (Array.isArray(item.doencas_cronicas_familia)) {
        const valid = item.doencas_cronicas_familia.filter(
          (d) =>
            d &&
            !d.toLowerCase().includes('nenhum') &&
            !d.toLowerCase().includes('não informado')
        );
        saudeList.push(...valid);
      } else if (
        typeof item.doencas_cronicas_familia === 'string' &&
        item.doencas_cronicas_familia.trim() &&
        !item.doencas_cronicas_familia.toLowerCase().includes('nenhum')
      ) {
        saudeList.push(item.doencas_cronicas_familia.trim());
      }
      if (item.possui_deficiencia) {
        const defStr =
          Array.isArray(item.tipos_deficiencia) && item.tipos_deficiencia.length > 0
            ? item.tipos_deficiencia.join(', ')
            : 'Sim';
        saudeList.push(`Deficiência: ${defStr}`);
      }
      const saudeFamilia =
        saudeList.length > 0 ? saudeList.join('; ') : 'Nenhuma condição registrada';

      // 15. Oficina Pretendida
      const oficina = item.curso_pretendido || 'Nenhuma oficina vinculada';

      // 16. Pendente Avaliação 4 Meses? (Sim/Não)
      const pendente4Meses = isPendenteAvaliacao4Meses(item) ? 'Sim' : 'Não';

      return [
        escapeCSV(id),
        escapeCSV(nome),
        escapeCSV(cpf),
        escapeCSV(telefone),
        escapeCSV(dataIngresso),
        escapeCSV(statusAcompanhamento),
        escapeCSV(bairroLocalidade),
        escapeCSV(escolaridade),
        escapeCSV(ocupacao),
        escapeCSV(faixaRenda),
        escapeCSV(composicao),
        escapeCSV(filhos),
        escapeCSV(internet),
        escapeCSV(saudeFamilia),
        escapeCSV(oficina),
        escapeCSV(pendente4Meses)
      ];
    });

    // Delimitador ';' padrão para Excel em português com UTF-8 BOM (\uFEFF)
    const csvContent =
      '\uFEFF' +
      [headers.map(escapeCSV).join(';'), ...rows.map((row) => row.join(';'))].join('\r\n');

    // Nome no padrão: relatorio_assistidos_lar_harmonia_YYYY-MM-DD.csv
    const today = new Date().toISOString().split('T')[0];
    const filename = `relatorio_assistidos_lar_harmonia_${today}.csv`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setSuccessMsg(
      `Planilha (.csv) gerada com sucesso! ${filteredAssistidos.length} assistidos exportados no arquivo "${filename}".`
    );
    setTimeout(() => {
      setSuccessMsg(null);
    }, 4500);
  };

  // Badge de Status visual
  const renderStatusBadge = (status?: string | null) => {
    const s = (status || 'Em Acompanhamento').toLowerCase();
    if (s.includes('conclu') || s.includes('formad')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 border border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800">
          Concluído
        </span>
      );
    }
    if (s.includes('desist') || s.includes('evas') || s.includes('trancad')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
          Desistente / Evasão
        </span>
      );
    }
    if (s.includes('pausad')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-300 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600">
          Pausado
        </span>
      );
    }
    if (s.includes('desligad')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800">
          Desligado
        </span>
      );
    }
    // Padrão: Ativo / Em Acompanhamento
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
        Ativo / Em Acompanhamento
      </span>
    );
  };

  // Abrir Modal de Visualização da Ficha Completa
  const handleOpenDetails = (item: Assistido) => {
    setSelectedAssistido(item);
  };

  // Excluir assistido (Apenas Admin)
  const handleConfirmDelete = async () => {
    if (!assistidoToDelete || !isAdmin) return;
    setDeleting(true);
    try {
      await assistidosService.delete(assistidoToDelete.id);

      setAssistidos((prev) => prev.filter((a) => a.id !== assistidoToDelete.id));
      if (selectedAssistido?.id === assistidoToDelete.id) {
        setSelectedAssistido(null);
      }
      setSuccessMsg(`Assistido ${assistidoToDelete.nome_completo} excluído com sucesso.`);
      setAssistidoToDelete(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch {
      setErrorMsg('Não foi possível excluir o cadastro do assistido. Verifique suas permissões.');
      setTimeout(() => setErrorMsg(null), 5000);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20 pt-6 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 no-print">
        {/* Cabeçalho da Página */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight font-heading">
              Assistidos Lar Harmonia
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
              Consulte, acompanhe e gerencie as fichas sociais dos assistidos e suas oficinas.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchAssistidos(true)}
              disabled={loading}
              title="Atualizar lista"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 dark:text-slate-400 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>

            <Link
              to="/cadastrar"
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Novo Cadastro
            </Link>
          </div>
        </div>

        {/* Mensagem de Notificação de Sucesso */}
        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl shadow-xs flex items-center justify-between text-emerald-900 dark:text-emerald-300 animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
              <span className="text-sm font-semibold">{successMsg}</span>
            </div>
            <button
              onClick={() => setSuccessMsg(null)}
              className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Mensagem de Erro de Conexão */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl shadow-xs flex items-center justify-between text-red-800 dark:text-red-300">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <span className="text-sm font-medium">{errorMsg}</span>
            </div>
            <button
              onClick={() => fetchAssistidos(true)}
              className="text-xs bg-white dark:bg-slate-800 text-red-700 dark:text-red-400 font-semibold px-3 py-1 border border-red-300 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-slate-700 cursor-pointer"
            >
              Tentar Novamente
            </button>
          </div>
        )}

        {/* CARDS DE MÉTRICAS RÁPIDAS NO TOPO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Card Requisitado com Destaque: 📋 X Pendentes de Avaliação de 4 Meses */}
          <div
            onClick={() => {
              setFilterAvaliacao('⚠️ Pendentes de Avaliação (>= 4 Meses)');
              setShowFilters(true);
            }}
            className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-sm flex items-center justify-between ${
              filterAvaliacao === '⚠️ Pendentes de Avaliação (>= 4 Meses)'
                ? 'bg-amber-100/90 dark:bg-amber-950/60 border-amber-400 dark:border-amber-600 ring-2 ring-amber-400'
                : 'bg-amber-50/90 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 hover:border-amber-300 dark:hover:border-amber-700'
            }`}
            title="Clique para filtrar apenas os assistidos com 120+ dias ativos sem avaliação de 4 meses"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900 dark:text-amber-300 uppercase tracking-wider font-heading">
                <ClipboardList className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                <span>Avaliação de 4 Meses</span>
              </div>
              <div className="text-2xl font-bold text-amber-950 dark:text-amber-100 font-heading">
                📋 {metrics.pendentes4Meses}{' '}
                <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  {metrics.pendentes4Meses === 1 ? 'Pendente' : 'Pendentes'}
                </span>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-400 font-medium">
                📋 {metrics.pendentes4Meses} Pendentes de Avaliação de 4 Meses
              </p>
            </div>
            <div className="w-11 h-11 rounded-lg bg-amber-200 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            </div>
          </div>

          {/* Total de Assistidos */}
          <div
            onClick={() => {
              setFilterAvaliacao('Todos');
              setFilterStatus('Todos os Status');
            }}
            className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-xs hover:shadow-sm transition cursor-pointer flex items-center justify-between"
            title="Total de fichas cadastradas no Lar Harmonia"
          >
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-heading">
                Total de Assistidos
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-heading">
                {metrics.total}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Cadastrados no Lar Harmonia</p>
            </div>
            <div className="w-11 h-11 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
          </div>

          {/* Ativos / Em Acompanhamento */}
          <div
            onClick={() => {
              setFilterStatus('Apenas Ativos');
              setShowFilters(true);
            }}
            className={`p-4 rounded-xl border transition shadow-xs hover:shadow-sm cursor-pointer flex items-center justify-between ${
              filterStatus === 'Apenas Ativos'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 ring-2 ring-emerald-500/20'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-500'
            }`}
            title="Assistidos ativos em acompanhamento na FLH"
          >
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-heading">
                Em Acompanhamento
              </div>
              <div className="text-2xl font-bold text-emerald-800 dark:text-emerald-300 font-heading">
                {metrics.ativosAcompanhamento}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Assistidos com status ativo</p>
            </div>
            <div className="w-11 h-11 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>

          {/* Avaliações Concluídas */}
          <div
            onClick={() => {
              setFilterAvaliacao('✅ Avaliação Concluída');
              setShowFilters(true);
            }}
            className={`p-4 rounded-xl border transition shadow-xs hover:shadow-sm cursor-pointer flex items-center justify-between ${
              filterAvaliacao === '✅ Avaliação Concluída'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 ring-2 ring-emerald-500/20'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
            title="Assistidos com avaliação de 4 meses concluída"
          >
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-heading">
                Avaliações Concluídas
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-heading">
                {metrics.avaliacoesConcluidas}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Avaliações de 4 meses salvas</p>
            </div>
            <div className="w-11 h-11 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* BARRA DE BUSCA E FILTROS */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs p-4 sm:p-5 mb-6 space-y-4 transition-colors">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Campo de Busca Rápida (Nome, CPF ou RG) */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por Nome Completo, CPF ou RG..."
                className="w-full pl-10 pr-9 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 outline-none transition"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  title="Limpar busca textual"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Campo de Filtro Dinâmico por Localidade (Bairro / Cidade) */}
            <div className="relative flex-1 lg:max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-400">
                <MapPin className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              </div>
              <input
                type="text"
                value={filterLocalidade}
                onChange={(e) => setFilterLocalidade(e.target.value)}
                placeholder="Buscar por Bairro / Localidade..."
                className="w-full pl-10 pr-9 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 outline-none transition"
              />
              {filterLocalidade && (
                <button
                  type="button"
                  onClick={() => setFilterLocalidade('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  title="Limpar filtro de localidade"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Botão Expandir/Recolher Filtros */}
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold border transition cursor-pointer ${
                  showFilters || activeFiltersCount > 0
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                <span>Painel de Filtros</span>
                {activeFiltersCount > 0 && (
                  <span className="w-4 h-4 flex items-center justify-center bg-emerald-700 text-white rounded-full text-[10px] font-bold">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {/* Botão Limpar Filtros */}
              {(activeFiltersCount > 0 || searchTerm || filterLocalidade) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-red-700 dark:hover:text-red-400 transition cursor-pointer"
                  title="Restaurar todos os filtros"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Limpar</span>
                </button>
              )}
            </div>
          </div>

          {/* PAINEL EXPANSÍVEL DE FILTROS AVANÇADOS */}
          {showFilters && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-700/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 animate-in fade-in duration-200">
              {/* 1. Composição Familiar */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Composição Familiar
                </label>
                <select
                  value={filterComposicao}
                  onChange={(e) => setFilterComposicao(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-emerald-700 outline-none"
                >
                  {COMPOSICAO_LIST.map((c) => (
                    <option key={c} value={c} className="dark:bg-slate-800 dark:text-slate-100">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Filhos */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Filhos
                </label>
                <select
                  value={filterFilhos}
                  onChange={(e) => setFilterFilhos(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-emerald-700 outline-none"
                >
                  {FILHOS_LIST.map((f) => (
                    <option key={f} value={f} className="dark:bg-slate-800 dark:text-slate-100">
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Faixa de Renda */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Faixa de Renda
                </label>
                <select
                  value={filterFaixaRenda}
                  onChange={(e) => setFilterFaixaRenda(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-emerald-700 outline-none"
                >
                  {FAIXAS_RENDA_LIST.map((r) => (
                    <option key={r} value={r} className="dark:bg-slate-800 dark:text-slate-100">
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Saúde na Família */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Saúde na Família
                </label>
                <select
                  value={filterSaudeFamilia}
                  onChange={(e) => setFilterSaudeFamilia(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-emerald-700 outline-none"
                >
                  {SAUDE_FAMILIA_LIST.map((s) => (
                    <option key={s} value={s} className="dark:bg-slate-800 dark:text-slate-100">
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* 5. Serviços Utilizados na FLH */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Serviços da FLH Utilizados
                </label>
                <select
                  value={filterServicosFLH}
                  onChange={(e) => setFilterServicosFLH(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-emerald-700 outline-none"
                >
                  {SERVICOS_FLH_LIST.map((s) => (
                    <option key={s} value={s} className="dark:bg-slate-800 dark:text-slate-100">
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* 6. Ocupação / Trabalho */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Ocupação / Trabalho
                </label>
                <select
                  value={filterOcupacao}
                  onChange={(e) => setFilterOcupacao(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-emerald-700 outline-none"
                >
                  {OCUPACAO_LIST.map((o) => (
                    <option key={o} value={o} className="dark:bg-slate-800 dark:text-slate-100">
                      {o}
                    </option>
                  ))}
                </select>
              </div>

              {/* 7. Acesso à Internet */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Acesso à Internet
                </label>
                <select
                  value={filterInternet}
                  onChange={(e) => setFilterInternet(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-emerald-700 outline-none"
                >
                  {INTERNET_LIST.map((i) => (
                    <option key={i} value={i} className="dark:bg-slate-800 dark:text-slate-100">
                      {i}
                    </option>
                  ))}
                </select>
              </div>

              {/* 8. Oficina / Curso Pretendido */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Oficina / Curso
                </label>
                <select
                  value={filterOficina}
                  onChange={(e) => setFilterOficina(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-emerald-700 outline-none"
                >
                  {OFICINAS_LIST.map((o) => (
                    <option key={o} value={o} className="dark:bg-slate-800 dark:text-slate-100">
                      {o}
                    </option>
                  ))}
                </select>
              </div>

              {/* 9. Status Atendimento */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Status do Acompanhamento
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-emerald-700 outline-none"
                >
                  {STATUS_LIST.map((s) => (
                    <option key={s} value={s} className="dark:bg-slate-800 dark:text-slate-100">
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* 10. Filtro Dedicado: Avaliação de 4 Meses */}
              <div className="bg-amber-50/70 dark:bg-amber-950/30 p-2 rounded-lg border border-amber-200 dark:border-amber-800">
                <label className="block text-xs font-semibold text-amber-900 dark:text-amber-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1 font-heading">
                    <ClipboardList className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                    Avaliação 4 Meses
                  </span>
                  {metrics.pendentes4Meses > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-amber-600 text-white text-[10px] font-bold leading-none">
                      {metrics.pendentes4Meses}
                    </span>
                  )}
                </label>
                <select
                  value={filterAvaliacao}
                  onChange={(e) => setFilterAvaliacao(e.target.value)}
                  className="w-full p-1.5 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-md text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  {FILTRO_AVALIACAO_4_MESES.map((a) => (
                    <option key={a} value={a} className="dark:bg-slate-800 dark:text-slate-100">
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              {/* 11. Ano de Entrada */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Ano de Ingresso
                </label>
                <select
                  value={filterAno}
                  onChange={(e) => setFilterAno(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-emerald-700 outline-none"
                >
                  {ANOS_LIST.map((a) => (
                    <option key={a} value={a} className="dark:bg-slate-800 dark:text-slate-100">
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              {/* 12. Data de entrada depois de: */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Data de entrada depois de:
                </label>
                <input
                  type="date"
                  value={filterDataInicial}
                  onChange={(e) => setFilterDataInicial(e.target.value)}
                  className="w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-emerald-700 outline-none"
                />
              </div>

              {/* 13. Data de entrada antes de: */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Data de entrada antes de:
                </label>
                <input
                  type="date"
                  value={filterDataFinal}
                  onChange={(e) => setFilterDataFinal(e.target.value)}
                  className="w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-emerald-700 outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* BARRA DE CONTAGEM E RESUMO DE RESULTADOS */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 px-1">
          <div className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
            Exibindo <span className="font-bold text-slate-900 dark:text-slate-100">{filteredAssistidos.length}</span> assistidos encontrados
            {assistidos.length !== filteredAssistidos.length && (
              <span className="text-slate-500 dark:text-slate-400 text-xs ml-1.5">
                (de um total de {assistidos.length} cadastrados)
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Botão de Destaque para Exportação CSV / Excel */}
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={filteredAssistidos.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg shadow-xs transition cursor-pointer"
              title="Exportar assistidos da listagem filtrada para planilha CSV / Excel"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>Exportar Planilha</span>
              {filteredAssistidos.length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 bg-emerald-800 text-emerald-100 rounded-full text-[10px] font-semibold">
                  {filteredAssistidos.length}
                </span>
              )}
            </button>

            {/* Alternar Visualização: Cards ou Tabela */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 rounded-lg shadow-2xs self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Tabela</span>
              </button>
            </div>
          </div>
        </div>

        {/* ESTADO DE CARREGAMENTO */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-200 dark:border-slate-700 animate-pulse space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-gray-200 dark:bg-slate-700 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2" />
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-full" />
                  <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-4/5" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* LISTA VAZIA */}
        {!loading && filteredAssistidos.length === 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center shadow-xs transition-colors">
            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-heading">
              Nenhum assistido encontrado com os filtros selecionados
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs max-w-md mx-auto mt-1 mb-6">
              Tente redefinir os filtros de pesquisa ou cadastre um novo assistido na plataforma.
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Limpar Filtros
              </button>
              <Link
                to="/cadastrar"
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Cadastrar Assistido
              </Link>
            </div>
          </div>
        )}

        {/* GRID DE CARDS DE ASSISTIDOS (Modo Cards) */}
        {!loading && filteredAssistidos.length > 0 && viewMode === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAssistidos.map((assistido) => {
              const isSituacaoRua =
                assistido.tipo_moradia === 'Em situação de rua' ||
                assistido.endereco === 'Em situação de rua';

              return (
                <div
                  key={assistido.id}
                  className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-600 dark:hover:border-emerald-500 shadow-xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between overflow-hidden group"
                >
                  {/* Conteúdo Principal do Card */}
                  <div className="p-5 space-y-3.5">
                    {/* Topo: Foto / Avatar + Nome + Status */}
                    <div className="flex items-start gap-3.5">
                      {/* Foto ou Avatar padrão */}
                      <div className="relative shrink-0">
                        {assistido.foto_url ? (
                          <img
                            src={assistido.foto_url}
                            alt={assistido.nome_completo}
                            className="w-13 h-13 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-2xs"
                          />
                        ) : (
                          <div className="w-13 h-13 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-800 dark:text-slate-200 font-bold text-base font-heading">
                            {assistido.nome_completo
                              ? assistido.nome_completo.charAt(0).toUpperCase()
                              : <UserIcon className="w-6 h-6 text-slate-500 dark:text-slate-400" />}
                          </div>
                        )}
                      </div>

                      {/* Nome, Idade e Status */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                          {renderStatusBadge(assistido.status_curso)}
                        </div>
                        {isPendenteAvaliacao4Meses(assistido) && (
                          <div className="mb-1.5">
                            <span
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-2xs animate-pulse"
                              title="Assistido com mais de 120 dias de curso/acolhimento ativos. Necessita registro da Avaliação de 4 Meses."
                            >
                              <span>⚠️</span>
                              <span>Avaliação 4 Meses Pendente</span>
                            </span>
                          </div>
                        )}
                        <h3
                          className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug line-clamp-1 group-hover:text-emerald-800 dark:group-hover:text-emerald-400 transition font-heading"
                          title={assistido.nome_completo}
                        >
                          {assistido.nome_completo}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {assistido.idade !== null && assistido.idade !== undefined
                            ? `${assistido.idade} anos`
                            : 'Idade não informada'}{' '}
                          {assistido.raca_cor && `• ${assistido.raca_cor}`}
                        </p>
                      </div>
                    </div>

                    {/* Tags Visuais Especiais (Situação de Rua / PcD) */}
                    {(isSituacaoRua || assistido.possui_deficiencia) && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {isSituacaoRua && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <Home className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                            Em situação de rua
                          </span>
                        )}
                        {assistido.possui_deficiencia && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            <HeartPulse className="w-3 h-3 text-indigo-700 dark:text-indigo-400" />
                            Possui deficiência (PcD)
                          </span>
                        )}
                      </div>
                    )}

                    {/* Informações Resumidas com Ícones */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700/80 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                      {/* Bairro / Localidade */}
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400 shrink-0" />
                        <span className="truncate">
                          {isSituacaoRua
                            ? 'Sem moradia fixa (Situação de Rua)'
                            : assistido.bairro || assistido.endereco || 'Bairro não informado'}
                        </span>
                      </div>

                      {/* Oficina / Curso */}
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <GraduationCap className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                        <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {assistido.curso_pretendido || 'Não vinculada'}
                        </span>
                      </div>

                      {/* Faixa de Renda Familiar */}
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                        <span>
                          Renda:{' '}
                          <strong className="text-emerald-800 dark:text-emerald-400 font-bold">
                            {getAssistidoFaixaRenda(assistido)}
                          </strong>
                        </span>
                      </div>

                      {/* Composição Familiar e Filhos */}
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <Users className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400 shrink-0" />
                        <span>
                          Família: <strong>{assistido.composicao_familiar || 1}</strong> {assistido.composicao_familiar === 1 ? 'pessoa' : 'pessoas'}
                          {getAssistidoFilhos(assistido) !== null && (
                            <> • <strong>{getAssistidoFilhos(assistido)}</strong> {getAssistidoFilhos(assistido) === 1 ? 'filho' : 'filhos'}</>
                          )}
                        </span>
                      </div>

                      {/* Ocupação / Trabalho */}
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400 shrink-0" />
                        <span className="truncate">
                          {assistido.atividade_remunerada === 'Sim'
                            ? 'Atividade remunerada ativa'
                            : 'Sem ocupação formal'}
                          {assistido.acesso_internet && ` • Internet: ${assistido.acesso_internet}`}
                        </span>
                      </div>

                      {/* Data de Ingresso */}
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400 shrink-0" />
                        <span>
                          Ingresso:{' '}
                          <strong className="text-slate-700 dark:text-slate-200">
                            {formatDate(assistido.data_ingresso || assistido.created_at)}
                          </strong>
                        </span>
                      </div>

                      {/* Data de Saída / Desligamento (se houver) */}
                      {getAssistidoDataSaida(assistido) && (
                        <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
                          <Calendar className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 shrink-0" />
                          <span>
                            Saída:{' '}
                            <strong className="text-rose-800 dark:text-rose-300">
                              {formatDate(getAssistidoDataSaida(assistido))}
                            </strong>
                          </span>
                        </div>
                      )}

                      {/* Telefone (se houver) */}
                      {assistido.telefone && (
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                          <Phone className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                          <span>{assistido.telefone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rodapé do Card com Ações */}
                  <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between gap-2">
                    {/* Botão Ver / Editar Ficha */}
                    <button
                      type="button"
                      onClick={() => handleOpenDetails(assistido)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-slate-600 text-emerald-800 dark:text-emerald-300 border border-slate-200 dark:border-slate-600 hover:border-emerald-300 dark:hover:border-emerald-500 text-xs font-semibold rounded-lg shadow-2xs transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                      {canEdit ? 'Ver / Editar Ficha' : 'Ver Ficha'}
                    </button>

                    {/* Botão Excluir (Apenas Admin) */}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setAssistidoToDelete(assistido)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-slate-400 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md text-xs font-medium transition cursor-pointer"
                        title="Excluir Assistido (Permissão Admin)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Excluir</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TABELA DE ASSISTIDOS (Modo Tabela) */}
        {!loading && filteredAssistidos.length > 0 && viewMode === 'table' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-heading">
                    <th scope="col" className="py-3 px-4">Assistido</th>
                    <th scope="col" className="py-3 px-4">Status</th>
                    <th scope="col" className="py-3 px-4">Avaliação 4 Meses</th>
                    <th scope="col" className="py-3 px-4">Oficina</th>
                    <th scope="col" className="py-3 px-4">Localidade</th>
                    <th scope="col" className="py-3 px-4">Data Ingresso</th>
                    <th scope="col" className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-xs text-slate-800 dark:text-slate-200">
                  {filteredAssistidos.map((assistido) => {
                    const isPendente = isPendenteAvaliacao4Meses(assistido);
                    const isConcluida = hasAvaliacao4Meses(assistido);
                    const dias = getDiasIngresso(assistido.data_ingresso, assistido.created_at);
                    const isSituacaoRua =
                      assistido.tipo_moradia === 'Em situação de rua' ||
                      assistido.endereco === 'Em situação de rua';

                    return (
                      <tr
                        key={assistido.id}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition ${
                          isPendente ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                        }`}
                      >
                        {/* Assistido Foto & Nome */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {assistido.foto_url ? (
                              <img
                                src={assistido.foto_url}
                                alt={assistido.nome_completo}
                                className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center font-bold text-xs shrink-0 font-heading">
                                {assistido.nome_completo ? assistido.nome_completo.charAt(0).toUpperCase() : 'A'}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-900 dark:text-slate-100 truncate hover:text-emerald-700 transition font-heading">
                                {assistido.nome_completo}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                {assistido.idade ? `${assistido.idade} anos` : 'Idade não informada'}
                                {assistido.cpf ? ` • CPF: ${assistido.cpf}` : ''}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {renderStatusBadge(assistido.status_curso)}
                        </td>

                        {/* Avaliação 4 Meses */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {isPendente ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-2xs animate-pulse">
                              <span>⚠️</span>
                              <span>Avaliação 4 Meses Pendente</span>
                            </span>
                          ) : isConcluida ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
                              Avaliação Concluída
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                              {dias !== null ? `⏳ ${dias} dias (< 120 dias)` : 'Em acompanhamento'}
                            </span>
                          )}
                        </td>

                        {/* Oficina */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-medium truncate max-w-[160px]">
                            <GraduationCap className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                            <span className="truncate">{assistido.curso_pretendido || 'Não vinculada'}</span>
                          </div>
                        </td>

                        {/* Localidade */}
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 truncate max-w-[160px]">
                          {isSituacaoRua ? 'Situação de Rua' : assistido.bairro || assistido.endereco || 'Não informado'}
                        </td>

                        {/* Data Ingresso */}
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {formatDate(assistido.data_ingresso || assistido.created_at)}
                        </td>

                        {/* Ações */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenDetails(assistido)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-slate-600 text-emerald-800 dark:text-emerald-300 border border-slate-200 dark:border-slate-600 hover:border-emerald-300 text-xs font-semibold rounded-md shadow-2xs transition"
                            >
                              <Eye className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
                              {canEdit ? 'Ver / Editar' : 'Ver Ficha'}
                            </button>
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => setAssistidoToDelete(assistido)}
                                className="p-1 text-slate-400 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md transition"
                                title="Excluir Assistido"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL DETALHES / VISUALIZAÇÃO COMPLETA DA FICHA (VerFichaModal)           */}
      {/* ========================================================================= */}
      {selectedAssistido && (
        <VerFichaModal
          assistido={selectedAssistido}
          isAdmin={isAdmin}
          onClose={() => setSelectedAssistido(null)}
          onDelete={(assistido) => {
            setSelectedAssistido(null);
            setAssistidoToDelete(assistido);
          }}
          onAssistidoUpdated={(updated) => {
            setSelectedAssistido(updated);
            setAssistidos((prev) =>
              prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item))
            );
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO (APENAS ADMIN)                           */}
      {/* ========================================================================= */}
      {assistidoToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 space-y-4">
            <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-heading">
                Confirmar Exclusão de Assistido
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Esta ação é irreversível e excluirá permanentemente o cadastro de:
              </p>
              <p className="text-sm font-bold text-red-700 dark:text-red-400 mt-2 p-2 bg-red-50 dark:bg-red-950/40 rounded-lg">
                {assistidoToDelete.nome_completo}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAssistidoToDelete(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
              >
                {deleting ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
