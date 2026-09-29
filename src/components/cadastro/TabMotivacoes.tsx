import React from 'react';
import {
  GraduationCap,
  Sparkles,
  Target,
  Heart,
  CheckCircle,
  HelpCircle,
  Clock,
  Compass
} from 'lucide-react';
import {
  CadastroFormData,
  OFICINAS_FLH,
  PRETENDER_FAZER_OPCOES,
  PERCEPCAO_FLH_OPCOES
} from '../../types/cadastro';

interface TabMotivacoesProps {
  formData: CadastroFormData;
  setFormData: React.Dispatch<React.SetStateAction<CadastroFormData>>;
}

export const TabMotivacoes: React.FC<TabMotivacoesProps> = ({
  formData,
  setFormData
}) => {
  const handlePretendeFazerToggle = (item: string) => {
    setFormData((prev) => {
      let list = [...prev.o_que_pretende_fazer];
      if (list.includes(item)) {
        list = list.filter((p) => p !== item);
      } else {
        list.push(item);
      }
      return {
        ...prev,
        o_que_pretende_fazer: list,
        o_que_pretende_outro: list.includes('Outro') ? prev.o_que_pretende_outro : ''
      };
    });
  };

  const handlePercepcaoFlhToggle = (item: string) => {
    setFormData((prev) => {
      let list = [...prev.percepcao_flh_hoje];
      if (list.includes(item)) {
        list = list.filter((p) => p !== item);
      } else {
        list.push(item);
      }
      return {
        ...prev,
        percepcao_flh_hoje: list,
        percepcao_flh_outro: list.includes('Outro') ? prev.percepcao_flh_outro : ''
      };
    });
  };

  const isNenhumaOficina =
    formData.oficina_pretendida === 'Nenhuma Oficina (Apenas Acompanhamento)';

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Oficina Pretendida e Motivo */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-6 transition-colors">
        <h3 className="font-heading text-base font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-3 flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
          Oficina Pretendida e Motivação da Busca
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5">
          {/* Oficina / Curso Pretendido */}
          <div className="md:col-span-6">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Oficina / Curso Pretendido na FLH <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.oficina_pretendida}
              onChange={(e) =>
                setFormData({ ...formData, oficina_pretendida: e.target.value })
              }
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-semibold focus:ring-2 focus:ring-emerald-600 outline-none"
            >
              {OFICINAS_FLH.map((of) => (
                <option key={of} value={of}>
                  {of}
                </option>
              ))}
            </select>
          </div>

          {/* Status Inicial do Atendimento */}
          <div className="md:col-span-6">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              Status Inicial do Atendimento
            </label>
            <select
              value={formData.status_atendimento}
              onChange={(e) =>
                setFormData({ ...formData, status_atendimento: e.target.value })
              }
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-medium focus:ring-2 focus:ring-emerald-600 outline-none"
            >
              <option value="Em Acompanhamento">Em Acompanhamento (Padrão)</option>
              <option value="Concluído / Formado">Concluído / Formado</option>
              <option value="Trancado / Evasão">Trancado / Evasão</option>
              <option value="Desligado">Desligado</option>
            </select>
          </div>

          {/* É o curso de sua preferência? */}
          {!isNenhumaOficina && (
            <div className="md:col-span-12 p-4 bg-slate-50 dark:bg-slate-700/60 rounded-xl border border-slate-200 dark:border-slate-600 space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Esta é a oficina de sua preferência? <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-5">
                <label className="inline-flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200 font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="curso_e_preferencia"
                    value="Sim"
                    checked={formData.curso_e_preferencia === 'Sim'}
                    onChange={() =>
                      setFormData({
                        ...formData,
                        curso_e_preferencia: 'Sim',
                        curso_preferencia_outro: ''
                      })
                    }
                    className="text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  Sim, é minha opção preferida
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200 font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="curso_e_preferencia"
                    value="Não"
                    checked={formData.curso_e_preferencia === 'Não'}
                    onChange={() =>
                      setFormData({ ...formData, curso_e_preferencia: 'Não' })
                    }
                    className="text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  Não, preferia outra
                </label>
              </div>

              {formData.curso_e_preferencia === 'Não' && (
                <div className="pt-2 animate-fadeIn">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Qual outra oficina teria maior preferência?
                  </label>
                  <input
                    type="text"
                    value={formData.curso_preferencia_outro}
                    onChange={(e) =>
                      setFormData({ ...formData, curso_preferencia_outro: e.target.value })
                    }
                    placeholder="Ex: Confeitaria, Eletricista, Estética facial"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-600 text-xs focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                </div>
              )}
            </div>
          )}

          {/* Motivo da busca pela oficina neste momento */}
          <div className="md:col-span-12 space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Motivo da busca pela oficina neste momento (Texto livre)
            </label>
            <textarea
              rows={3}
              value={formData.motivo_busca_momento}
              onChange={(e) =>
                setFormData({ ...formData, motivo_busca_momento: e.target.value })
              }
              placeholder="Ex: Busca qualificação profissional para ingressar no mercado formal de trabalho, gerar renda para sustentar os filhos..."
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-400 text-sm focus:ring-2 focus:ring-emerald-600 outline-none resize-none"
            />
          </div>
        </div>
      </div>

      {/* 2. O que pretende fazer com o aprendizado */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-6 transition-colors">
        <h3 className="font-heading text-base font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
          O que pretende fazer com o aprendizado?
        </h3>

        <div className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Selecione uma ou mais alternativas de objetivos futuros:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {PRETENDER_FAZER_OPCOES.map((opcao) => {
              const checked = formData.o_que_pretende_fazer.includes(opcao);
              return (
                <label
                  key={opcao}
                  className={`flex items-center gap-2.5 p-3 rounded-lg border text-xs font-semibold cursor-pointer select-none transition ${
                    checked
                      ? 'bg-emerald-700 dark:bg-emerald-600 border-emerald-800 dark:border-emerald-700 text-white shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-700/60 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handlePretendeFazerToggle(opcao)}
                    className="hidden"
                  />
                  {checked && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
                  <span>{opcao}</span>
                </label>
              );
            })}
          </div>

          {formData.o_que_pretende_fazer.includes('Outro') && (
            <div className="pt-2 animate-fadeIn">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Especifique o que mais pretende fazer:
              </label>
              <input
                type="text"
                value={formData.o_que_pretende_outro}
                onChange={(e) =>
                  setFormData({ ...formData, o_que_pretende_outro: e.target.value })
                }
                placeholder="Ex: Prestar concurso público, ensinar outras pessoas..."
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-600 text-xs focus:ring-2 focus:ring-emerald-600 outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* 3. Cursos Anteriores e Objetivo Profissional */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-6 transition-colors">
        <h3 className="font-heading text-base font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-3 flex items-center gap-2">
          <Target className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
          Histórico de Cursos e Meta a Curto Prazo (3 Meses)
        </h3>

        {/* Cursos anteriores */}
        <div className="p-4 bg-slate-50 dark:bg-slate-700/60 rounded-xl border border-slate-200 dark:border-slate-600 space-y-3">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Já participou de outros cursos profissionalizantes antes?
          </label>
          <div className="flex gap-5">
            <label className="inline-flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200 font-semibold cursor-pointer">
              <input
                type="radio"
                name="participou_cursos_anteriores"
                value="Sim"
                checked={formData.participou_cursos_anteriores === 'Sim'}
                onChange={() =>
                  setFormData({ ...formData, participou_cursos_anteriores: 'Sim' })
                }
                className="text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              Sim
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200 font-semibold cursor-pointer">
              <input
                type="radio"
                name="participou_cursos_anteriores"
                value="Não"
                checked={formData.participou_cursos_anteriores === 'Não'}
                onChange={() =>
                  setFormData({
                    ...formData,
                    participou_cursos_anteriores: 'Não',
                    cursos_anteriores_detalhes: '',
                    cursos_anteriores_concluiu: ''
                  })
                }
                className="text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              Não
            </label>
          </div>

          {formData.participou_cursos_anteriores === 'Sim' && (
            <div className="pt-2 space-y-3 animate-fadeIn">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Quais cursos realizou? Concluiu? Se não concluiu, por quê?
                </label>
                <textarea
                  rows={2}
                  value={formData.cursos_anteriores_detalhes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cursos_anteriores_detalhes: e.target.value
                    })
                  }
                  placeholder="Ex: Curso de manicure (concluído) / Curso de corte e costura (trancado por falta de passagem de ônibus)..."
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-600 text-xs focus:ring-2 focus:ring-emerald-600 outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Objetivo profissional nos próximos 3 meses */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Qual é o seu objetivo profissional para os próximos 3 meses?
          </label>
          <textarea
            rows={2}
            value={formData.objetivo_profissional_3_meses}
            onChange={(e) =>
              setFormData({ ...formData, objetivo_profissional_3_meses: e.target.value })
            }
            placeholder="Ex: Conseguir os primeiros clientes no bairro, comprar kit básico de ferramentas, enviar currículo atualizado para lojas..."
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-400 text-sm focus:ring-2 focus:ring-emerald-600 outline-none resize-none"
          />
        </div>
      </div>

      {/* 4. Percepção da Fundação Lar Harmonia (Seção 12) */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-6 transition-colors">
        <h3 className="font-heading text-base font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-3 flex items-center gap-2">
          <Heart className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
          Percepção da Fundação Lar Harmonia (Seção 12)
        </h3>

        <div className="space-y-5">
          {/* O que a FLH representa */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              O que a Fundação Lar Harmonia representa para a sua família? (Texto livre)
            </label>
            <textarea
              rows={2}
              value={formData.representacao_flh_familia}
              onChange={(e) =>
                setFormData({ ...formData, representacao_flh_familia: e.target.value })
              }
              placeholder="Ex: Lugar de acolhimento e escuta, esperança de dignidade, suporte nos momentos mais difíceis..."
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-400 text-sm focus:ring-2 focus:ring-emerald-600 outline-none resize-none"
            />
          </div>

          {/* Como você percebe a FLH para sua família hoje? */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Como você percebe a FLH para sua família hoje?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {PERCEPCAO_FLH_OPCOES.map((per) => {
                const checked = formData.percepcao_flh_hoje.includes(per);
                return (
                  <label
                    key={per}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-xs font-semibold cursor-pointer select-none transition ${
                      checked
                        ? 'bg-emerald-700 dark:bg-emerald-600 border-emerald-800 dark:border-emerald-700 text-white shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-700/60 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handlePercepcaoFlhToggle(per)}
                      className="hidden"
                    />
                    {checked && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
                    <span>{per}</span>
                  </label>
                );
              })}
            </div>

            {formData.percepcao_flh_hoje.includes('Outro') && (
              <div className="pt-2 animate-fadeIn">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Qual outra percepção sobre a FLH?
                </label>
                <input
                  type="text"
                  value={formData.percepcao_flh_outro}
                  onChange={(e) =>
                    setFormData({ ...formData, percepcao_flh_outro: e.target.value })
                  }
                  placeholder="Descreva..."
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-600 text-xs focus:ring-2 focus:ring-emerald-600 outline-none"
                />
              </div>
            )}
          </div>

          {/* Tem interesse em outras oficinas? */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Interesse em outras oficinas ou serviços da FLH?
              </label>

              <label className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                <input
                  type="checkbox"
                  checked={formData.nao_tem_interesse_outras_oficinas}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFormData({
                      ...formData,
                      nao_tem_interesse_outras_oficinas: checked,
                      interesse_outras_oficinas: checked ? '' : formData.interesse_outras_oficinas
                    });
                  }}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                Não tenho interesse em outras oficinas
              </label>
            </div>

            <input
              type="text"
              disabled={formData.nao_tem_interesse_outras_oficinas}
              value={formData.interesse_outras_oficinas}
              onChange={(e) =>
                setFormData({ ...formData, interesse_outras_oficinas: e.target.value })
              }
              placeholder={
                formData.nao_tem_interesse_outras_oficinas
                  ? 'Não tenho interesse em outras oficinas no momento'
                  : 'Quais? Ex: Informática avançada, Tranças, Pilates, Apoio psicológico para filhos'
              }
              className={`w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition ${
                formData.nao_tem_interesse_outras_oficinas
                  ? 'bg-slate-100 dark:bg-slate-700/50 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-600'
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
