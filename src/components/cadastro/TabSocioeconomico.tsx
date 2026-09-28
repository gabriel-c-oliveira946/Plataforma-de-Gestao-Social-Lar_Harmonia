import React from 'react';
import {
  Briefcase,
  Users,
  DollarSign,
  Home,
  Wifi,
  Droplet,
  Zap,
  CheckCircle,
  HelpCircle,
  ShieldAlert
} from 'lucide-react';
import { CadastroFormData, FAIXAS_RENDA, TIPOS_MORADIA } from '../../types/cadastro';
import { handleIntegerKeyDown } from '../../utils/masks';

interface TabSocioeconomicoProps {
  formData: CadastroFormData;
  setFormData: React.Dispatch<React.SetStateAction<CadastroFormData>>;
}

export const TabSocioeconomico: React.FC<TabSocioeconomicoProps> = ({
  formData,
  setFormData
}) => {
  const handleMoraSozinho = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      mora_sozinho: checked,
      composicao_familiar: checked ? 1 : prev.composicao_familiar
    }));
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

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Trabalho e Atividade Remunerada */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-6">
        <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-blue-600" />
          Trabalho e Atividade Remunerada Atual
        </h3>

        {/* Pergunta: Realiza atividade remunerada atual? */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
            Atividade Remunerada Atual?
          </label>
          <div className="flex gap-4">
            <label className="inline-flex items-center gap-2 text-sm text-gray-800 font-semibold cursor-pointer">
              <input
                type="radio"
                name="atividade_remunerada"
                value="Sim"
                checked={formData.atividade_remunerada === 'Sim'}
                onChange={() => setFormData({ ...formData, atividade_remunerada: 'Sim' })}
                className="text-blue-600 focus:ring-blue-500"
              />
              Sim, realiza atividade remunerada
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-gray-800 font-semibold cursor-pointer">
              <input
                type="radio"
                name="atividade_remunerada"
                value="Não"
                checked={formData.atividade_remunerada === 'Não'}
                onChange={() =>
                  setFormData({
                    ...formData,
                    atividade_remunerada: 'Não',
                    ocupacao_atual: '',
                    dias_semana_trabalho: ''
                  })
                }
                className="text-blue-600 focus:ring-blue-500"
              />
              Não realiza atividade remunerada
            </label>
          </div>
        </div>

        {/* Campos se SIM */}
        {formData.atividade_remunerada === 'Sim' ? (
          <div className="p-4.5 bg-blue-50/50 border border-blue-200 rounded-xl space-y-4">
            <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
              Detalhes da Ocupação Atual
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-6">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Ocupação / Qual atividade exerce?
                </label>
                <input
                  type="text"
                  value={formData.ocupacao_atual}
                  onChange={(e) => setFormData({ ...formData, ocupacao_atual: e.target.value })}
                  placeholder="Ex: Diarista, Pedreiro, Vendedora ambulante"
                  className="w-full px-3.5 py-2.5 bg-white rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Dias da semana
                </label>
                <input
                  type="text"
                  value={formData.dias_semana_trabalho}
                  onChange={(e) =>
                    setFormData({ ...formData, dias_semana_trabalho: e.target.value })
                  }
                  placeholder="Ex: Seg a Sex, 3x na semana"
                  className="w-full px-3.5 py-2.5 bg-white rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Turno
                </label>
                <select
                  value={formData.turno_trabalho}
                  onChange={(e) => setFormData({ ...formData, turno_trabalho: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="Manhã">Manhã</option>
                  <option value="Tarde">Tarde</option>
                  <option value="Noite">Noite</option>
                  <option value="Integral">Integral</option>
                  <option value="Variável / Escala">Variável / Escala</option>
                </select>
              </div>
            </div>
          </div>
        ) : (
          /* Campo de Desemprego/Sem renda */
          <div className="p-4.5 bg-amber-50/50 border border-amber-200 rounded-xl space-y-3">
            <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider">
              Em caso de desemprego / sem renda:
            </label>
            <p className="text-xs text-amber-800">
              Ao que a família atribui essa circunstância e o que está sendo feito para sair dela?
            </p>
            <textarea
              rows={3}
              value={formData.desemprego_circunstancia}
              onChange={(e) =>
                setFormData({ ...formData, desemprego_circunstancia: e.target.value })
              }
              placeholder="Descreva as circunstâncias relatadas (ex: falta de oportunidade, cuidados com filhos, busca ativa por trabalho, necessidade de qualificação)..."
              className="w-full px-3.5 py-2 bg-white rounded-lg border border-amber-300 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>
        )}

        {/* Histórico: Já trabalhou anteriormente? */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
            Já trabalhou anteriormente?
          </label>
          <div className="flex gap-4">
            <label className="inline-flex items-center gap-2 text-sm text-gray-800 font-medium cursor-pointer">
              <input
                type="radio"
                name="trabalhou_anteriormente"
                value="Sim"
                checked={formData.trabalhou_anteriormente === 'Sim'}
                onChange={() => setFormData({ ...formData, trabalhou_anteriormente: 'Sim' })}
                className="text-blue-600 focus:ring-blue-500"
              />
              Sim
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-gray-800 font-medium cursor-pointer">
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
                className="text-blue-600 focus:ring-blue-500"
              />
              Não
            </label>
          </div>

          {formData.trabalhou_anteriormente === 'Sim' && (
            <div className="pt-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Em qual área / função atuou anteriormente?
              </label>
              <input
                type="text"
                value={formData.area_trabalho_anterior}
                onChange={(e) =>
                  setFormData({ ...formData, area_trabalho_anterior: e.target.value })
                }
                placeholder="Ex: Comércio, Limpeza, Construção civil, Recepção"
                className="w-full px-3.5 py-2 bg-white rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          )}
        </div>

        {/* Acesso à Internet em Casa */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Wifi className="w-5 h-5 text-blue-600" />
            <div>
              <span className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
                Acesso à Internet em Casa?
              </span>
              <span className="text-xs text-gray-500">Possui Wi-Fi ou conexão de dados estável na residência?</span>
            </div>
          </div>
          <div className="flex gap-4">
            <label className="inline-flex items-center gap-2 text-sm text-gray-800 font-semibold cursor-pointer">
              <input
                type="radio"
                name="acesso_internet"
                value="Sim"
                checked={formData.acesso_internet === 'Sim'}
                onChange={() => setFormData({ ...formData, acesso_internet: 'Sim' })}
                className="text-blue-600 focus:ring-blue-500"
              />
              Sim
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-gray-800 font-semibold cursor-pointer">
              <input
                type="radio"
                name="acesso_internet"
                value="Não"
                checked={formData.acesso_internet === 'Não'}
                onChange={() => setFormData({ ...formData, acesso_internet: 'Não' })}
                className="text-blue-600 focus:ring-blue-500"
              />
              Não
            </label>
          </div>
        </div>
      </div>

      {/* Composição Familiar e Renda */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-6">
        <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          Composição Familiar e Renda
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Pessoas no Domicílio */}
          <div className="md:col-span-4 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Pessoas no domicílio
              </label>
              <label className="inline-flex items-center gap-1.5 text-xs text-amber-800 bg-amber-100 px-2 py-0.5 rounded cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.mora_sozinho}
                  onChange={(e) => handleMoraSozinho(e.target.checked)}
                  className="rounded text-amber-600 w-3.5 h-3.5"
                />
                Mora sozinho / Rua
              </label>
            </div>
            <input
              type="number"
              min="1"
              disabled={formData.mora_sozinho}
              value={formData.composicao_familiar}
              onKeyDown={handleIntegerKeyDown}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  composicao_familiar: e.target.value.replace(/\D/g, '')
                })
              }
              className={`w-full px-3.5 py-2 rounded-lg border text-sm outline-none transition ${
                formData.mora_sozinho
                  ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500'
              }`}
            />
          </div>

          {/* Quantos Filhos */}
          <div className="md:col-span-4 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              Quantos filhos possui?
            </label>
            <input
              type="number"
              min="0"
              value={formData.quantidade_filhos}
              onKeyDown={handleIntegerKeyDown}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  quantidade_filhos: e.target.value.replace(/\D/g, '')
                })
              }
              placeholder="0"
              className="w-full px-3.5 py-2 bg-white rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Faixa de Renda */}
          <div className="md:col-span-4 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              Renda Familiar / Própria
            </label>
            <select
              value={formData.faixa_renda}
              onChange={(e) => handleFaixaRenda(e.target.value)}
              className="w-full px-3.5 py-2 bg-white rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium"
            >
              {FAIXAS_RENDA.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Programas Sociais */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
            Programas Sociais Recebidos
          </label>
          <div className="flex flex-wrap gap-4">
            {['Bolsa Família', 'BPC', 'Outro', 'Nenhum'].map((prog) => {
              const checked = formData.programas_sociais.includes(prog);
              return (
                <label
                  key={prog}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer select-none transition ${
                    checked
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleProgramasSociaisToggle(prog)}
                    className="hidden"
                  />
                  {checked && <CheckCircle className="w-3.5 h-3.5" />}
                  {prog}
                </label>
              );
            })}
          </div>

          {formData.programas_sociais.includes('Outro') && (
            <div className="pt-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Qual outro programa social?
              </label>
              <input
                type="text"
                value={formData.outro_programa_social}
                onChange={(e) =>
                  setFormData({ ...formData, outro_programa_social: e.target.value })
                }
                placeholder="Ex: Auxílio Gás, Aluguel Social, Tarifa Social de Energia"
                className="w-full px-3.5 py-2 bg-white rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Moradia e Infraestrutura Básica */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-6">
        <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
          <Home className="w-5 h-5 text-blue-600" />
          Moradia e Infraestrutura Básica
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Tipo de Moradia */}
          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Tipo de Moradia
            </label>
            <select
              value={formData.tipo_moradia}
              onChange={(e) => setFormData({ ...formData, tipo_moradia: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {TIPOS_MORADIA.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </div>

          {/* Água */}
          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Droplet className="w-3.5 h-3.5 text-blue-500" />
              Água Encanada
            </label>
            <select
              value={formData.agua_regularidade}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  agua_regularidade: e.target.value as 'Regular' | 'Irregular'
                })
              }
              className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="Regular">Regular (Rede pública)</option>
              <option value="Irregular">Irregular (Poço/Carro-pipa/Gato)</option>
            </select>
          </div>

          {/* Energia */}
          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Energia Elétrica
            </label>
            <select
              value={formData.energia_regularidade}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  energia_regularidade: e.target.value as 'Regular' | 'Irregular'
                })
              }
              className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="Regular">Regular (Relógio próprio)</option>
              <option value="Irregular">Irregular (Ligação clandestina)</option>
            </select>
          </div>

          {/* Serviços Básicos Gerais */}
          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Serviços Básicos Gerais
            </label>
            <select
              value={formData.servicos_basicos_gerais}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  servicos_basicos_gerais: e.target.value as
                    | 'Sim'
                    | 'Parcialmente'
                    | 'Irregular'
                })
              }
              className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="Sim">Sim (Completos)</option>
              <option value="Parcialmente">Parcialmente</option>
              <option value="Irregular">Irregular / Ausente</option>
            </select>
          </div>

          {/* Observações de Moradia */}
          <div className="md:col-span-12">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Observações Relevantes de Moradia
            </label>
            <textarea
              rows={2}
              value={formData.observacoes_moradia}
              onChange={(e) =>
                setFormData({ ...formData, observacoes_moradia: e.target.value })
              }
              placeholder="Ex: Área de risco, umidade/infiltração, ausência de saneamento, fossa séptica, terreno de invasão..."
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
