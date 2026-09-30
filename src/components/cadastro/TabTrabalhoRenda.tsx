import React from 'react';
import {
  Briefcase,
  DollarSign,
  Gift,
  CheckCircle,
  Clock,
  Award
} from 'lucide-react';
import {
  CadastroFormData,
  DIAS_SEMANA_OPCOES,
  TURNOS_OPCOES,
  FAIXAS_RENDA,
  PROGRAMAS_SOCIAIS_OPCOES
} from '../../types/cadastro';

interface TabTrabalhoRendaProps {
  formData: CadastroFormData;
  setFormData: React.Dispatch<React.SetStateAction<CadastroFormData>>;
}

export const TabTrabalhoRenda: React.FC<TabTrabalhoRendaProps> = ({
  formData,
  setFormData
}) => {
  const handleDiaSemanaToggle = (dia: string) => {
    setFormData((prev) => {
      const current = prev.dias_semana_trabalho_array || [];
      const updated = current.includes(dia)
        ? current.filter((d) => d !== dia)
        : [...current, dia];
      return {
        ...prev,
        dias_semana_trabalho_array: updated,
        dias_semana_trabalho: updated.join(', ')
      };
    });
  };

  const handleFaixaRenda = (faixa: string) => {
    let numVal = 0;
    if (faixa === 'Até R$ 600') numVal = 600;
    else if (faixa === 'De R$ 601 a R$ 1.200') numVal = 1200;
    else if (faixa === 'De R$ 1.201 a R$ 2.000') numVal = 2000;
    else if (faixa === 'De R$ 2.001 a R$ 3.500') numVal = 3500;
    else if (faixa === 'De R$ 3.501 a R$ 5.000') numVal = 5000;
    else if (faixa === 'Acima de R$ 5.000') numVal = 6000;

    setFormData((prev) => ({
      ...prev,
      faixa_renda: faixa,
      renda_aproximada_valor: numVal
    }));
  };

  const handleProgramasSociaisToggle = (item: string) => {
    setFormData((prev) => {
      let list = [...prev.programas_sociais];
      if (item === 'Nenhum') {
        return {
          ...prev,
          programas_sociais: ['Nenhum'],
          outro_programa_social: ''
        };
      }
      list = list.filter((p) => p !== 'Nenhum');
      if (list.includes(item)) {
        list = list.filter((p) => p !== item);
      } else {
        list.push(item);
      }
      if (list.length === 0) list = ['Nenhum'];
      return {
        ...prev,
        programas_sociais: list,
        outro_programa_social: list.includes('Outro') ? prev.outro_programa_social : ''
      };
    });
  };

  const isTrabalhando = formData.atividade_remunerada === 'Sim';
  const isAposentado = formData.atividade_remunerada === 'Aposentado(a) / Pensionista';
  const isDesempregado = formData.atividade_remunerada === 'Não';

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Atividade Remunerada e Ocupação */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-6 transition-colors">
        <h3 className="font-heading text-base font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-3 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
          Atividade Remunerada e Trabalho Atual
        </h3>

        {/* Pergunta: Realiza atividade remunerada atual? */}
        <div className="p-4 bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl space-y-3">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Situação Profissional / Atividade Remunerada Atual <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
            <label className="inline-flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200 font-semibold cursor-pointer">
              <input
                type="radio"
                name="atividade_remunerada"
                value="Sim"
                checked={isTrabalhando}
                onChange={() =>
                  setFormData({
                    ...formData,
                    atividade_remunerada: 'Sim',
                    desemprego_circunstancia: ''
                  })
                }
                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
              />
              Sim, realiza atividade remunerada
            </label>

            <label className="inline-flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200 font-semibold cursor-pointer">
              <input
                type="radio"
                name="atividade_remunerada"
                value="Não"
                checked={isDesempregado}
                onChange={() =>
                  setFormData({
                    ...formData,
                    atividade_remunerada: 'Não',
                    ocupacao_atual: '',
                    dias_semana_trabalho_array: [],
                    dias_semana_trabalho: ''
                  })
                }
                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
              />
              Não realiza atividade remunerada (Sem renda/desempregado)
            </label>

            <label className="inline-flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200 font-semibold cursor-pointer">
              <input
                type="radio"
                name="atividade_remunerada"
                value="Aposentado(a) / Pensionista"
                checked={isAposentado}
                onChange={() =>
                  setFormData({
                    ...formData,
                    atividade_remunerada: 'Aposentado(a) / Pensionista',
                    ocupacao_atual: formData.ocupacao_atual || 'Aposentado(a) / Pensionista',
                    desemprego_circunstancia: ''
                  })
                }
                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
              />
              Aposentado(a) / Pensionista
            </label>
          </div>
        </div>

        {/* Campos se SIM (Trabalhando) */}
        {isTrabalhando && (
          <div className="p-4 sm:p-5 bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl space-y-5 animate-fadeIn">
            <h4 className="font-heading text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              Detalhes da Atividade Remunerada
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Ocupação / Ramo */}
              <div className="md:col-span-8">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ocupação / Ramo da Atividade
                </label>
                <input
                  type="text"
                  value={formData.ocupacao_atual}
                  onChange={(e) => setFormData({ ...formData, ocupacao_atual: e.target.value })}
                  placeholder="Ex: Diarista, Pedreiro, Vendedora ambulante, Costureira"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-600 text-sm focus:ring-2 focus:ring-emerald-600 outline-none"
                />
              </div>

              {/* Turno */}
              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Turno de Trabalho
                </label>
                <select
                  value={formData.turno_trabalho}
                  onChange={(e) => setFormData({ ...formData, turno_trabalho: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-600 text-sm focus:ring-2 focus:ring-emerald-600 outline-none"
                >
                  {TURNOS_OPCOES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dias da Semana (Pills de Marcação Fácil) */}
              <div className="md:col-span-12 space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Dias da Semana em que Trabalha:
                </label>
                <div className="flex flex-wrap gap-2">
                  {DIAS_SEMANA_OPCOES.map((dia) => {
                    const isSelected = (formData.dias_semana_trabalho_array || []).includes(dia);
                    return (
                      <button
                        key={dia}
                        type="button"
                        onClick={() => handleDiaSemanaToggle(dia)}
                        className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-700 dark:bg-emerald-600 text-white border border-emerald-800 dark:border-emerald-700 shadow-xs'
                            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'
                        }`}
                      >
                        {dia}
                      </button>
                    );
                  })}
                </div>
                {(formData.dias_semana_trabalho_array || []).length > 0 && (
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-400 font-medium">
                    Dias selecionados: {(formData.dias_semana_trabalho_array || []).join(', ')}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Campos se APOSENTADO(A) / PENSIONISTA */}
        {isAposentado && (
          <div className="p-4 sm:p-5 bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 rounded-xl space-y-4 animate-fadeIn">
            <h4 className="font-heading text-xs font-bold text-purple-900 dark:text-purple-300 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-700 dark:text-purple-400" />
              Detalhes da Aposentadoria / Pensão
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-8">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tipo de Aposentadoria / Pensão / Benefício:
                </label>
                <input
                  type="text"
                  value={formData.ocupacao_atual || 'Aposentado(a) / Pensionista'}
                  onChange={(e) => setFormData({ ...formData, ocupacao_atual: e.target.value })}
                  placeholder="Ex: Aposentadoria por Idade, Pensão por Morte, BPC/LOAS..."
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-600 text-sm focus:ring-2 focus:ring-purple-600 outline-none"
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Atividade informal complementar?
                </label>
                <select
                  value={formData.turno_trabalho || 'Sem atividade extra'}
                  onChange={(e) => setFormData({ ...formData, turno_trabalho: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-600 text-sm focus:ring-2 focus:ring-purple-600 outline-none"
                >
                  <option value="Sem atividade extra">Sem atividade complementar</option>
                  <option value="Manhã">Bicos / Manhã</option>
                  <option value="Tarde">Bicos / Tarde</option>
                  <option value="Integral">Bicos / Integral</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Causa do Desemprego / Sem Renda (Exibição Condicional: apenas se não realiza atividade remunerada) */}
        {isDesempregado && (
          <div className="space-y-1.5 animate-fadeIn">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Causa do Desemprego / Sem Renda (Ao que atribui a circunstância e o que está fazendo a respeito?):
            </label>
            <textarea
              rows={2}
              value={formData.desemprego_circunstancia}
              onChange={(e) =>
                setFormData({ ...formData, desemprego_circunstancia: e.target.value })
              }
              placeholder="Ex: Demissão recente, cuidado integral com filhos pequenos, buscando recolocação informal..."
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-400 rounded-lg border border-slate-300 dark:border-slate-600 text-sm focus:ring-2 focus:ring-emerald-600 outline-none resize-none"
            />
          </div>
        )}

        {/* Histórico Anterior */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2 border-t border-slate-100 dark:border-slate-700">
          <div className="md:col-span-4">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Já trabalhou anteriormente?
            </label>
            <div className="flex gap-4">
              <label className="inline-flex items-center gap-1.5 text-xs text-slate-800 dark:text-slate-200 font-medium cursor-pointer">
                <input
                  type="radio"
                  name="trabalhou_anteriormente"
                  value="Sim"
                  checked={formData.trabalhou_anteriormente === 'Sim'}
                  onChange={() => setFormData({ ...formData, trabalhou_anteriormente: 'Sim' })}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                Sim
              </label>
              <label className="inline-flex items-center gap-1.5 text-xs text-slate-800 dark:text-slate-200 font-medium cursor-pointer">
                <input
                  type="radio"
                  name="trabalhou_anteriormente"
                  value="Não"
                  checked={formData.trabalhou_anteriormente === 'Não'}
                  onChange={() =>
                    setFormData({
                      ...formData,
                      trabalhou_anteriormente: 'Não',
                      area_trabalho_anterior: ''
                    })
                  }
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                Não
              </label>
            </div>
          </div>

          <div className="md:col-span-8">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Em qual área ou função exercida anteriormente?
            </label>
            <input
              type="text"
              disabled={formData.trabalhou_anteriormente === 'Não'}
              value={formData.area_trabalho_anterior}
              onChange={(e) =>
                setFormData({ ...formData, area_trabalho_anterior: e.target.value })
              }
              placeholder="Ex: Auxiliar de limpeza, Atendente de comércio, Construção civil"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-600 text-sm focus:ring-2 focus:ring-emerald-600 outline-none disabled:bg-slate-100 dark:disabled:bg-slate-700/50 disabled:text-slate-400 dark:disabled:text-slate-500"
            />
          </div>
        </div>
      </div>

      {/* 2. Faixa de Renda Familiar / Própria */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-6 transition-colors">
        <h3 className="font-heading text-base font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-3 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
          Faixa de Renda Familiar / Própria
        </h3>

        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Selecione a faixa que melhor representa a renda mensal conjunta de todas as pessoas do domicílio:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {FAIXAS_RENDA.map((faixa) => {
              const isSelected = formData.faixa_renda === faixa;
              return (
                <button
                  key={faixa}
                  type="button"
                  onClick={() => handleFaixaRenda(faixa)}
                  className={`p-3.5 rounded-lg border text-left text-xs font-bold transition flex items-center justify-between shadow-2xs cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-700 dark:bg-emerald-600 text-white border-emerald-800 dark:border-emerald-700 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-700/60 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{faixa}</span>
                  {isSelected && <CheckCircle className="w-4 h-4 flex-shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>

          <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-lg text-xs text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-700 dark:text-emerald-400 flex-shrink-0" />
            <span>
              Faixa de renda registrada:{' '}
              <strong className="font-extrabold text-emerald-950 dark:text-emerald-200">
                {formData.faixa_renda}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* 3. Benefícios e Programas Sociais */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-6 transition-colors">
        <h3 className="font-heading text-base font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-3 flex items-center gap-2">
          <Gift className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
          Programas Sociais e Benefícios
        </h3>

        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            A família ou o assistido recebe algum programa social ou transferência de renda governamental?
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PROGRAMAS_SOCIAIS_OPCOES.map((prog) => {
              const checked = formData.programas_sociais.includes(prog);
              return (
                <label
                  key={prog}
                  className={`flex items-center gap-2 p-3 rounded-lg border text-xs font-semibold cursor-pointer select-none transition ${
                    checked
                      ? 'bg-emerald-700 dark:bg-emerald-600 border-emerald-800 dark:border-emerald-700 text-white shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-700/60 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleProgramasSociaisToggle(prog)}
                    className="hidden"
                  />
                  {checked && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
                  <span>{prog}</span>
                </label>
              );
            })}
          </div>

          {/* Campo livre se marcar Outro */}
          {formData.programas_sociais.includes('Outro') && (
            <div className="pt-2 animate-fadeIn">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Qual outro programa ou benefício social?
              </label>
              <input
                type="text"
                value={formData.outro_programa_social}
                onChange={(e) =>
                  setFormData({ ...formData, outro_programa_social: e.target.value })
                }
                placeholder="Ex: Auxílio Gás, Aluguel Social, Bolsa Municipal"
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-400 rounded-lg border border-slate-300 dark:border-slate-600 text-sm focus:ring-2 focus:ring-emerald-600 outline-none"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
