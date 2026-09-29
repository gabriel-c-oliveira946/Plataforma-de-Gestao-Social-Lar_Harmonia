import React from 'react';
import {
  Home,
  Users,
  Wifi,
  Droplet,
  Zap,
  CheckCircle,
  HelpCircle,
  ShieldAlert,
  Baby
} from 'lucide-react';
import { CadastroFormData, TIPOS_MORADIA } from '../../types/cadastro';
import { handleIntegerKeyDown } from '../../utils/masks';

interface TabMoradiaFamiliaProps {
  formData: CadastroFormData;
  setFormData: React.Dispatch<React.SetStateAction<CadastroFormData>>;
}

export const TabMoradiaFamilia: React.FC<TabMoradiaFamiliaProps> = ({
  formData,
  setFormData
}) => {
  const handleMoraSozinho = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      mora_sozinho: checked,
      composicao_familiar: checked ? 1 : prev.composicao_familiar === 1 ? 1 : prev.composicao_familiar
    }));
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Composição Familiar e Filhos */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-6 transition-colors">
        <h3 className="font-heading text-base font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-3 flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
          Composição Familiar e Filhos
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5">
          {/* Pessoas no domicílio */}
          <div className="md:col-span-6 space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Quantas pessoas moram no domicílio? (Composição Familiar)
            </label>
            <input
              type="number"
              min="1"
              max="25"
              disabled={formData.mora_sozinho || formData.em_situacao_rua}
              value={formData.mora_sozinho || formData.em_situacao_rua ? 1 : formData.composicao_familiar}
              onKeyDown={handleIntegerKeyDown}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  composicao_familiar: e.target.value === '' ? '' : Math.max(1, Number(e.target.value))
                })
              }
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-semibold focus:ring-2 focus:ring-emerald-600 outline-none disabled:bg-slate-100 dark:disabled:bg-slate-750 disabled:text-slate-500 dark:disabled:text-slate-400"
            />
            <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={formData.mora_sozinho || formData.em_situacao_rua}
                disabled={formData.em_situacao_rua}
                onChange={(e) => handleMoraSozinho(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Mora sozinho(a) / Em situação de rua (bloqueia em 1 pessoa)</span>
            </label>
          </div>

          {/* Quantidade de filhos */}
          <div className="md:col-span-6 space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Baby className="w-4 h-4 text-pink-500" />
              Quantidade de Filhos
            </label>
            <input
              type="number"
              min="0"
              max="25"
              value={formData.quantidade_filhos}
              onKeyDown={handleIntegerKeyDown}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  quantidade_filhos: e.target.value === '' ? '' : Math.max(0, Number(e.target.value))
                })
              }
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-semibold focus:ring-2 focus:ring-emerald-600 outline-none"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Informe 0 caso o assistido não tenha filhos dependentes.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Acesso à Internet */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4 transition-colors">
        <h3 className="font-heading text-base font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-3 flex items-center gap-2">
          <Wifi className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
          Acesso à Internet em Casa
        </h3>

        <div className="p-4 bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl space-y-3">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Possui acesso à internet em casa? <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-6">
            <label className="inline-flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200 font-bold cursor-pointer">
              <input
                type="radio"
                name="acesso_internet"
                value="Sim"
                checked={formData.acesso_internet === 'Sim'}
                onChange={() => setFormData({ ...formData, acesso_internet: 'Sim' })}
                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
              />
              Sim, possui internet
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200 font-bold cursor-pointer">
              <input
                type="radio"
                name="acesso_internet"
                value="Não"
                checked={formData.acesso_internet === 'Não'}
                onChange={() => setFormData({ ...formData, acesso_internet: 'Não' })}
                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
              />
              Não possui internet
            </label>
          </div>
        </div>
      </div>

      {/* 3. Moradia e Infraestrutura Básica */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-6 transition-colors">
        <h3 className="font-heading text-base font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-3 flex items-center gap-2">
          <Home className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
          Condições de Moradia e Infraestrutura Básica
        </h3>

        <div className="space-y-6">
          {/* Tipo de Moradia */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Tipo de Moradia
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {TIPOS_MORADIA.map((tipo) => {
                const isSelected = formData.tipo_moradia === tipo;
                return (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => {
                      const isRua = tipo === 'Em situação de rua';
                      setFormData({
                        ...formData,
                        tipo_moradia: tipo,
                        em_situacao_rua: isRua,
                        mora_sozinho: isRua ? true : formData.mora_sozinho,
                        endereco: isRua ? 'Em situação de rua' : formData.endereco === 'Em situação de rua' ? '' : formData.endereco,
                        bairro: isRua ? 'Sem moradia fixa' : formData.bairro === 'Sem moradia fixa' ? '' : formData.bairro
                      });
                    }}
                    className={`p-3 rounded-lg border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-amber-600 dark:bg-amber-500 text-white border-amber-700 dark:border-amber-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-700/60 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>{tipo}</span>
                    {isSelected && <CheckCircle className="w-4 h-4 flex-shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Serviços Básicos: Água, Energia e Gerais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4.5 bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl">
            {/* Água */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Droplet className="w-4 h-4 text-emerald-600" />
                Abastecimento de Água
              </label>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="agua_regularidade"
                    value="Regular"
                    checked={formData.agua_regularidade === 'Regular'}
                    onChange={() => setFormData({ ...formData, agua_regularidade: 'Regular' })}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  Regular
                </label>
                <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="agua_regularidade"
                    value="Irregular"
                    checked={formData.agua_regularidade === 'Irregular'}
                    onChange={() => setFormData({ ...formData, agua_regularidade: 'Irregular' })}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  Irregular / Poço
                </label>
              </div>
            </div>

            {/* Energia */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                Energia Elétrica
              </label>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="energia_regularidade"
                    value="Regular"
                    checked={formData.energia_regularidade === 'Regular'}
                    onChange={() => setFormData({ ...formData, energia_regularidade: 'Regular' })}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  Regular
                </label>
                <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="energia_regularidade"
                    value="Irregular"
                    checked={formData.energia_regularidade === 'Irregular'}
                    onChange={() => setFormData({ ...formData, energia_regularidade: 'Irregular' })}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  Irregular
                </label>
              </div>
            </div>

            {/* Serviços Gerais */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-emerald-600" />
                Serviços Básicos Gerais
              </label>
              <select
                value={formData.servicos_basicos_gerais}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    servicos_basicos_gerais: e.target.value as any
                  })
                }
                className="w-full p-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-semibold text-slate-800 dark:text-white outline-none"
              >
                <option value="Sim">Sim (Completos e Regulares)</option>
                <option value="Parcialmente">Parcialmente Regulares</option>
                <option value="Irregular">Irregulares / Precários</option>
              </select>
            </div>
          </div>

          {/* Observações Relevantes de Moradia */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Observações Relevantes sobre Moradia e Infraestrutura:
            </label>
            <textarea
              rows={3}
              value={formData.observacoes_moradia}
              onChange={(e) =>
                setFormData({ ...formData, observacoes_moradia: e.target.value })
              }
              placeholder="Ex: Área de encosta ou risco de deslizamento, infiltrações recorrentes, fossa séptica rudimentar..."
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-400 rounded-lg border border-slate-300 dark:border-slate-600 text-sm focus:ring-2 focus:ring-emerald-600 outline-none resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
