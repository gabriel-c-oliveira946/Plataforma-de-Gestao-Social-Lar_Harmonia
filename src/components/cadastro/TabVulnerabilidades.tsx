import React from 'react';
import {
  HeartPulse,
  AlertTriangle,
  Users2,
  Building,
  CheckCircle,
  FileText,
  User,
  Users,
  Pill,
  Stethoscope,
  Plus,
  Trash2
} from 'lucide-react';
import {
  CadastroFormData,
  ItemCondicaoSaude,
  DIFICULDADES_OPCOES,
  FATORES_EVASAO_OPCOES,
  REDES_APOIO,
  SERVICOS_FLH_OPCOES
} from '../../types/cadastro';

interface TabVulnerabilidadesProps {
  formData: CadastroFormData;
  setFormData: React.Dispatch<React.SetStateAction<CadastroFormData>>;
}

interface HealthCategoryConfig {
  key: 'saude_doenca_cronica' | 'saude_dependencia_quimica' | 'saude_mental' | 'saude_deficiencia' | 'saude_outra_situacao';
  listaKey: 'saude_doencas_cronicas_lista' | 'saude_dependencia_quimica_lista' | 'saude_mental_lista' | 'saude_deficiencia_lista' | 'saude_outra_situacao_lista';
  parentescoKey: 'saude_doenca_cronica_parentesco' | 'saude_dependencia_quimica_parentesco' | 'saude_mental_parentesco' | 'saude_deficiencia_parentesco' | 'saude_outra_situacao_parentesco';
  nomeKey: 'saude_doenca_cronica_nome' | 'saude_dependencia_quimica_nome' | 'saude_mental_nome' | 'saude_deficiencia_nome' | 'saude_outra_situacao_nome';
  medKey: 'saude_doenca_cronica_medicamento' | 'saude_dependencia_quimica_medicamento' | 'saude_mental_medicamento' | 'saude_deficiencia_medicamento' | 'saude_outra_situacao_medicamento';
  obsKey: 'saude_doenca_cronica_obs' | 'saude_dependencia_quimica_obs' | 'saude_mental_obs' | 'saude_deficiencia_obs' | 'saude_outra_situacao_obs';
  detalheKey: 'saude_doenca_cronica_detalhe' | 'saude_dependencia_quimica_detalhe' | 'saude_mental_detalhe' | 'saude_deficiencia_detalhe' | 'saude_outra_situacao_detalhe';
  titulo: string;
  subtitulo: string;
  addItemLabel: string;
  nomePlaceholder: string;
  medPlaceholder: string;
  obsPlaceholder: string;
}

const HEALTH_CATEGORIES: HealthCategoryConfig[] = [
  {
    key: 'saude_doenca_cronica',
    listaKey: 'saude_doencas_cronicas_lista',
    parentescoKey: 'saude_doenca_cronica_parentesco',
    nomeKey: 'saude_doenca_cronica_nome',
    medKey: 'saude_doenca_cronica_medicamento',
    obsKey: 'saude_doenca_cronica_obs',
    detalheKey: 'saude_doenca_cronica_detalhe',
    titulo: 'Doenças Crônicas',
    subtitulo: 'Hipertensão arterial, diabetes, cardiopatias, asma grave, insuficiência renal, etc.',
    addItemLabel: '+ Adicionar outra doença crônica',
    nomePlaceholder: 'Ex: Hipertensão arterial grave e Diabetes tipo 2',
    medPlaceholder: 'Ex: Losartana 50mg, Metformina 850mg (Posto SUS / Farmácia Popular)',
    obsPlaceholder: 'Ex: Acompanhamento médico semestral no posto do bairro, necessita de dieta controlada...'
  },
  {
    key: 'saude_dependencia_quimica',
    listaKey: 'saude_dependencia_quimica_lista',
    parentescoKey: 'saude_dependencia_quimica_parentesco',
    nomeKey: 'saude_dependencia_quimica_nome',
    medKey: 'saude_dependencia_quimica_medicamento',
    obsKey: 'saude_dependencia_quimica_obs',
    detalheKey: 'saude_dependencia_quimica_detalhe',
    titulo: 'Dependência Química',
    subtitulo: 'Álcool, tabaco ou outras substâncias psicoativas',
    addItemLabel: '+ Adicionar outra dependência ou substância',
    nomePlaceholder: 'Ex: Dependência de álcool e tabagismo',
    medPlaceholder: 'Ex: CAPS AD / Sem medicação específica / Em grupo de apoio',
    obsPlaceholder: 'Ex: Períodos recorrentes de recaída, aceita participar de palestras e encaminhamento institucional...'
  },
  {
    key: 'saude_mental',
    listaKey: 'saude_mental_lista',
    parentescoKey: 'saude_mental_parentesco',
    nomeKey: 'saude_mental_nome',
    medKey: 'saude_mental_medicamento',
    obsKey: 'saude_mental_obs',
    detalheKey: 'saude_mental_detalhe',
    titulo: 'Sofrimento Psíquico Grave / Saúde Mental',
    subtitulo: 'Depressão severa, ansiedade generalizada, transtorno bipolar, esquizofrenia, ideação suicida',
    addItemLabel: '+ Adicionar outra condição de saúde mental',
    nomePlaceholder: 'Ex: Transtorno depressivo maior e crises severas de pânico/ansiedade',
    medPlaceholder: 'Ex: Sertralina 50mg, Clonazepam (Ambulatório FLH / Posto SUS)',
    obsPlaceholder: 'Ex: Faz acompanhamento psicológico na FLH, crises frequentes em momentos de estresse financeiro...'
  },
  {
    key: 'saude_deficiencia',
    listaKey: 'saude_deficiencia_lista',
    parentescoKey: 'saude_deficiencia_parentesco',
    nomeKey: 'saude_deficiencia_nome',
    medKey: 'saude_deficiencia_medicamento',
    obsKey: 'saude_deficiencia_obs',
    detalheKey: 'saude_deficiencia_detalhe',
    titulo: 'Deficiência / Síndrome',
    subtitulo: 'PcD motora, auditiva, visual, intelectual, Transtorno do Espectro Autista (TEA), Síndrome de Down',
    addItemLabel: '+ Adicionar outra deficiência ou síndrome',
    nomePlaceholder: 'Ex: TEA (Autismo Nível 2 de Suporte) e deficiência intelectual leve',
    medPlaceholder: 'Ex: Risperidona 1mg (Farmácia de Alto Custo SUS) / Terapia ocupacional',
    obsPlaceholder: 'Ex: Necessita de suporte contínuo nas atividades diárias, possui laudo médico atualizado...'
  },
  {
    key: 'saude_outra_situacao',
    listaKey: 'saude_outra_situacao_lista',
    parentescoKey: 'saude_outra_situacao_parentesco',
    nomeKey: 'saude_outra_situacao_nome',
    medKey: 'saude_outra_situacao_medicamento',
    obsKey: 'saude_outra_situacao_obs',
    detalheKey: 'saude_outra_situacao_detalhe',
    titulo: 'Outra Situação Relevante de Saúde',
    subtitulo: 'Sequelas de AVC, cirurgias recentes, membro acamado, neoplasias, doenças raras',
    addItemLabel: '+ Adicionar outra condição relevante',
    nomePlaceholder: 'Ex: Sequelas motoras de AVC / Acamado sob cuidados domiciliares',
    medPlaceholder: 'Ex: Fisioterapia domiciliar SUS, anticoagulante diário',
    obsPlaceholder: 'Ex: Familiar requer cuidados integrais de cuidador em casa, o que restringe horários de trabalho...'
  }
];

export const TabVulnerabilidades: React.FC<TabVulnerabilidadesProps> = ({
  formData,
  setFormData
}) => {
  const handleDificuldadesToggle = (item: string) => {
    setFormData((prev) => {
      let list = [...prev.dificuldades_familia];
      if (item === 'Nenhuma') {
        return { ...prev, dificuldades_familia: ['Nenhuma'] };
      }
      list = list.filter((d) => d !== 'Nenhuma');
      if (list.includes(item)) {
        list = list.filter((d) => d !== item);
      } else {
        list.push(item);
      }
      if (list.length === 0) list = ['Nenhuma'];
      return { ...prev, dificuldades_familia: list };
    });
  };

  const handleFatoresEvasaoToggle = (item: string) => {
    setFormData((prev) => {
      let list = [...prev.fatores_risco_evasao];
      if (item === 'Nenhum') {
        return { ...prev, fatores_risco_evasao: ['Nenhum'] };
      }
      list = list.filter((f) => f !== 'Nenhum');
      if (list.includes(item)) {
        list = list.filter((f) => f !== item);
      } else {
        list.push(item);
      }
      if (list.length === 0) list = ['Nenhum'];
      return { ...prev, fatores_risco_evasao: list };
    });
  };

  const handleServicosFlhToggle = (item: string) => {
    setFormData((prev) => {
      let list = [...prev.servicos_flh_utilizados];
      if (item === 'Nenhum / Nunca utilizou') {
        return { ...prev, servicos_flh_utilizados: ['Nenhum / Nunca utilizou'] };
      }
      list = list.filter((s) => s !== 'Nenhum / Nunca utilizou');
      if (list.includes(item)) {
        list = list.filter((s) => s !== item);
      } else {
        list.push(item);
      }
      if (list.length === 0) list = ['Nenhum / Nunca utilizou'];
      return { ...prev, servicos_flh_utilizados: list };
    });
  };

  // Obter itens da categoria com compatibilidade com estado legado
  const getCategoryItems = (cat: HealthCategoryConfig): ItemCondicaoSaude[] => {
    const list = formData[cat.listaKey];
    if (Array.isArray(list) && list.length > 0) {
      return list;
    }

    if (formData[cat.key]) {
      const parentescoStr = formData[cat.parentescoKey] || 'O próprio assistido';
      const isProprio = parentescoStr === 'O próprio assistido' || !parentescoStr;
      return [
        {
          id: `initial_${cat.key}`,
          parentesco_tipo: isProprio ? 'assistido' : 'familiar',
          parentesco_nome: isProprio ? '' : parentescoStr,
          nome_doenca: formData[cat.nomeKey] || '',
          medicamento: formData[cat.medKey] || '',
          observacoes: formData[cat.obsKey] || ''
        }
      ];
    }

    return [];
  };

  // Sincronizar listas e chaves legadas
  const syncCategoryState = (
    prev: CadastroFormData,
    cat: HealthCategoryConfig,
    items: ItemCondicaoSaude[]
  ): CadastroFormData => {
    const isAtivo = items.length > 0;
    const firstItem = items[0];

    const parentescoFinal = firstItem
      ? firstItem.parentesco_tipo === 'assistido'
        ? 'O próprio assistido'
        : firstItem.parentesco_nome || 'Familiar'
      : 'O próprio assistido';

    const detalheParts = [];
    if (firstItem?.nome_doenca) detalheParts.push(firstItem.nome_doenca);
    if (parentescoFinal) detalheParts.push(parentescoFinal);
    if (firstItem?.medicamento) detalheParts.push(`Med: ${firstItem.medicamento}`);
    if (firstItem?.observacoes) detalheParts.push(`Obs: ${firstItem.observacoes}`);

    return {
      ...prev,
      [cat.key]: isAtivo,
      [cat.listaKey]: items,
      [cat.parentescoKey]: parentescoFinal,
      [cat.nomeKey]: firstItem?.nome_doenca || '',
      [cat.medKey]: firstItem?.medicamento || '',
      [cat.obsKey]: firstItem?.observacoes || '',
      [cat.detalheKey]: detalheParts.join(' | ')
    };
  };

  // Alternar checkbox da categoria
  const handleToggleCategory = (cat: HealthCategoryConfig, checked: boolean) => {
    setFormData((prev) => {
      if (checked) {
        const currentItems = getCategoryItems(cat);
        const newItems: ItemCondicaoSaude[] =
          currentItems.length > 0
            ? currentItems
            : [
                {
                  id: `cond_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                  parentesco_tipo: 'assistido',
                  parentesco_nome: '',
                  nome_doenca: '',
                  medicamento: '',
                  observacoes: ''
                }
              ];
        return syncCategoryState(prev, cat, newItems);
      } else {
        return syncCategoryState(prev, cat, []);
      }
    });
  };

  // Adicionar nova condição na mesma categoria
  const handleAddItem = (cat: HealthCategoryConfig) => {
    setFormData((prev) => {
      const currentItems = getCategoryItems(cat);
      const newItem: ItemCondicaoSaude = {
        id: `cond_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        parentesco_tipo: 'assistido',
        parentesco_nome: '',
        nome_doenca: '',
        medicamento: '',
        observacoes: ''
      };
      const newItems = [...currentItems, newItem];
      return syncCategoryState(prev, cat, newItems);
    });
  };

  // Remover uma condição específica da categoria
  const handleRemoveItem = (cat: HealthCategoryConfig, itemId: string) => {
    setFormData((prev) => {
      const currentItems = getCategoryItems(cat);
      const newItems = currentItems.filter((it) => it.id !== itemId);
      return syncCategoryState(prev, cat, newItems);
    });
  };

  // Atualizar campo de um item específico
  const handleUpdateItem = (
    cat: HealthCategoryConfig,
    itemId: string,
    updates: Partial<ItemCondicaoSaude>
  ) => {
    setFormData((prev) => {
      const currentItems = getCategoryItems(cat);
      const newItems = currentItems.map((item) => {
        if (item.id === itemId) {
          return { ...item, ...updates };
        }
        return item;
      });
      return syncCategoryState(prev, cat, newItems);
    });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Dificuldades Enfrentadas */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6 transition-colors">
        <h3 className="font-heading text-base font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          Dificuldades Enfrentadas pela Família
        </h3>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Marque todas as vulnerabilidades que incidem sobre o núcleo familiar no momento:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {DIFICULDADES_OPCOES.map((dif) => {
            const checked = formData.dificuldades_familia.includes(dif);
            return (
              <label
                key={dif}
                className={`flex items-center gap-2 p-3 rounded-lg border text-xs font-semibold cursor-pointer select-none transition ${
                  checked
                    ? 'bg-amber-600 dark:bg-amber-600 border-amber-700 dark:border-amber-700 text-white shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-850'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => handleDificuldadesToggle(dif)}
                  className="hidden"
                />
                {checked && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
                <span>{dif}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Tabela / Bloco de Saúde Familiar */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6 transition-colors">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-heading text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            Vulnerabilidades e Saúde Familiar
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Registre as condições de saúde de cada membro familiar, permitindo múltiplas doenças por categoria com medicamentos e observações.
          </p>
        </div>

        <div className="space-y-6">
          {HEALTH_CATEGORIES.map((cat) => {
            const items = getCategoryItems(cat);
            const isChecked = items.length > 0;

            return (
              <div
                key={cat.key}
                className={`p-4 sm:p-5 rounded-2xl border transition ${
                  isChecked
                    ? 'bg-rose-50/40 dark:bg-slate-950 border-rose-200 dark:border-rose-900/60 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800/80'
                }`}
              >
                {/* Cabeçalho do Card com Checkbox de Ativação */}
                <div className="flex items-start justify-between gap-3">
                  <label className="inline-flex items-start gap-3 cursor-pointer select-none flex-1">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => handleToggleCategory(cat, e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                    />
                    <div>
                      <span className="text-sm font-bold text-slate-900 dark:text-white block">
                        {cat.titulo}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                        {cat.subtitulo}
                      </span>
                    </div>
                  </label>

                  <span
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold shrink-0 ${
                      isChecked
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/90 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        : 'bg-slate-200/70 text-slate-500 dark:bg-slate-850 dark:text-slate-400 border dark:border-slate-800'
                    }`}
                  >
                    {isChecked ? `${items.length} cadastrada(s)` : 'Não se aplica'}
                  </span>
                </div>

                {/* Lista de Condições Cadastradas nesta Categoria */}
                {isChecked && (
                  <div className="mt-5 pt-4 border-t border-rose-100 dark:border-slate-800/80 space-y-5 animate-fadeIn">
                    {items.map((item, index) => {
                      const isProprio = item.parentesco_tipo === 'assistido';

                      return (
                        <div
                          key={item.id}
                          className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-rose-100 dark:border-slate-800 shadow-2xs space-y-4 relative"
                        >
                          {/* Barra do Item: Contador e Botão de Remover */}
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 text-[11px] flex items-center justify-center font-bold">
                                {index + 1}
                              </span>
                              Registro de {cat.titulo}
                            </span>

                            {items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(cat, item.id)}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1 rounded-md transition cursor-pointer"
                                title="Remover esta condição"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Remover
                              </button>
                            )}
                          </div>

                          {/* 1. Quem possui a condição: Botões com Alto Contraste e Modo Escuro Otimizado */}
                          <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                              Quem possui esta condição? <span className="text-rose-500">*</span>
                            </label>
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Botão: O próprio assistido */}
                              <button
                                type="button"
                                onClick={() => {
                                  handleUpdateItem(cat, item.id, {
                                    parentesco_tipo: 'assistido',
                                    parentesco_nome: ''
                                  });
                                }}
                                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition select-none cursor-pointer ${
                                  isProprio
                                    ? 'bg-indigo-600 text-white border border-indigo-700 shadow-xs dark:bg-indigo-600 dark:text-white dark:border-indigo-500'
                                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-750'
                                }`}
                              >
                                <User className="w-3.5 h-3.5" />
                                O próprio assistido
                              </button>

                              {/* Botão: Outro familiar */}
                              <button
                                type="button"
                                onClick={() => {
                                  handleUpdateItem(cat, item.id, {
                                    parentesco_tipo: 'familiar'
                                  });
                                }}
                                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition select-none cursor-pointer ${
                                  !isProprio
                                    ? 'bg-indigo-600 text-white border border-indigo-700 shadow-xs dark:bg-indigo-600 dark:text-white dark:border-indigo-500'
                                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-750'
                                }`}
                              >
                                <Users className="w-3.5 h-3.5" />
                                Outro familiar
                              </button>
                            </div>

                            {/* Campo de texto se for 'Outro familiar' */}
                            {!isProprio && (
                              <div className="pt-2 animate-fadeIn">
                                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                  Grau de Parentesco / Quem é na família: <span className="text-rose-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  autoFocus
                                  value={item.parentesco_nome}
                                  onChange={(e) =>
                                    handleUpdateItem(cat, item.id, {
                                      parentesco_nome: e.target.value
                                    })
                                  }
                                  placeholder="Ex: Mãe, Filho, Cônjuge, Avó, Irmão..."
                                  className="w-full sm:w-80 px-3.5 py-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-emerald-600 dark:focus:ring-indigo-500 outline-none"
                                />
                              </div>
                            )}
                          </div>

                          {/* 2. Nome/Descrição da Doença + Medicamento / Como Adquire */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                                <Stethoscope className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                                Nome / Descrição da Doença ou Diagnóstico:
                              </label>
                              <input
                                type="text"
                                value={item.nome_doenca}
                                onChange={(e) =>
                                  handleUpdateItem(cat, item.id, {
                                    nome_doenca: e.target.value
                                  })
                                }
                                placeholder={cat.nomePlaceholder}
                                className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-600 dark:focus:ring-indigo-500 outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                                <Pill className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                Medicamento / Como Adquire / Tratamento:
                              </label>
                              <input
                                type="text"
                                value={item.medicamento}
                                onChange={(e) =>
                                  handleUpdateItem(cat, item.id, {
                                    medicamento: e.target.value
                                  })
                                }
                                placeholder={cat.medPlaceholder}
                                className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-600 dark:focus:ring-indigo-500 outline-none"
                              />
                            </div>
                          </div>

                          {/* 3. Explicação / Observações */}
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                              Observações, Explicações ou Detalhes Relevantes:
                            </label>
                            <textarea
                              rows={2}
                              value={item.observacoes}
                              onChange={(e) =>
                                handleUpdateItem(cat, item.id, {
                                  observacoes: e.target.value
                                })
                              }
                              placeholder={cat.obsPlaceholder}
                              className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-600 dark:focus:ring-indigo-500 outline-none resize-none"
                            />
                          </div>
                        </div>
                      );
                    })}

                    {/* Botão Dinâmico para Adicionar Outra Condição nesta Categoria */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => handleAddItem(cat)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/70 dark:hover:bg-rose-900/80 text-rose-800 dark:text-rose-300 border border-dashed border-rose-300 dark:border-rose-800 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
                      >
                        <Plus className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                        {cat.addItemLabel}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Rede de Apoio e Risco de Evasão */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6 transition-colors">
        <h3 className="font-heading text-base font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
          <Users2 className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
          Rede de Apoio e Fatores de Risco
        </h3>

        {/* Rede de Apoio Principal */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Rede de Apoio Principal da Família
          </label>
          <div className="flex flex-wrap gap-3 sm:gap-4">
            {REDES_APOIO.map((apoio) => (
              <label
                key={apoio}
                className="inline-flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200 font-semibold cursor-pointer"
              >
                <input
                  type="radio"
                  name="rede_apoio_principal"
                  value={apoio}
                  checked={formData.rede_apoio_principal === apoio}
                  onChange={() => setFormData({ ...formData, rede_apoio_principal: apoio })}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                />
                {apoio}
              </label>
            ))}
          </div>
        </div>

        {/* Fatores de risco para evasão */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Fatores de Risco para Permanência / Evasão das Atividades
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {FATORES_EVASAO_OPCOES.map((fat) => {
              const checked = formData.fatores_risco_evasao.includes(fat);
              return (
                <label
                  key={fat}
                  className={`flex items-center gap-2 p-3 rounded-lg border text-xs font-semibold cursor-pointer select-none transition ${
                    checked
                      ? 'bg-rose-600 dark:bg-rose-600 border-rose-700 dark:border-rose-700 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleFatoresEvasaoToggle(fat)}
                    className="hidden"
                  />
                  {checked && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
                  <span>{fat}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* Serviços da FLH já utilizados */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6 transition-colors">
        <h3 className="font-heading text-base font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
          <Building className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
          Serviços da Fundação Lar Harmonia (FLH) Já Utilizados
        </h3>

        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Marque todos os setores ou atendimentos da instituição que a família já utilizou:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {SERVICOS_FLH_OPCOES.map((serv) => {
              const checked = formData.servicos_flh_utilizados.includes(serv);
              return (
                <label
                  key={serv}
                  className={`flex items-center gap-2 p-3 rounded-lg border text-xs font-semibold cursor-pointer select-none transition ${
                    checked
                      ? 'bg-emerald-700 dark:bg-emerald-600 border-emerald-800 dark:border-emerald-700 text-white shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-850'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleServicosFlhToggle(serv)}
                    className="hidden"
                  />
                  {checked && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
                  <span>{serv}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
