import React from 'react';
import {
  HeartPulse,
  AlertTriangle,
  Users2,
  Building,
  CheckCircle,
  HelpCircle,
  FileText
} from 'lucide-react';
import {
  CadastroFormData,
  DIFICULDADES_OPCOES,
  FATORES_EVASAO_OPCOES,
  REDES_APOIO,
  SERVICOS_FLH_OPCOES
} from '../../types/cadastro';

interface TabVulnerabilidadesProps {
  formData: CadastroFormData;
  setFormData: React.Dispatch<React.SetStateAction<CadastroFormData>>;
}

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

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Dificuldades Enfrentadas */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs space-y-6 transition-colors">
        <h3 className="text-base font-bold text-gray-900 dark:text-slate-100 border-b border-gray-100 dark:border-slate-700 pb-3 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          Dificuldades Enfrentadas pela Família
        </h3>

        <p className="text-xs text-gray-500 dark:text-slate-400">
          Marque todas as vulnerabilidades que incidem sobre o núcleo familiar no momento:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {DIFICULDADES_OPCOES.map((dif) => {
            const checked = formData.dificuldades_familia.includes(dif);
            return (
              <label
                key={dif}
                className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold cursor-pointer select-none transition ${
                  checked
                    ? 'bg-amber-500 dark:bg-amber-600 border-amber-600 dark:border-amber-700 text-white shadow-xs'
                    : 'bg-gray-50 dark:bg-slate-700/60 border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700'
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

      {/* Tabela / Bloco de Saúde da Família (Seção 11) */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs space-y-6 transition-colors">
        <h3 className="text-base font-bold text-gray-900 dark:text-slate-100 border-b border-gray-100 dark:border-slate-700 pb-3 flex items-center gap-2">
          <HeartPulse className="w-5 h-5 text-red-600 dark:text-red-400" />
          Saúde Familiar (Seção 11 - Condições, Parentesco e Medicamento/Como adquire)
        </h3>

        <div className="space-y-4">
          {/* 1. Doença Crônica */}
          <div className="p-4 bg-gray-50 dark:bg-slate-700/60 border border-gray-200 dark:border-slate-600 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.saude_doenca_cronica}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      saude_doenca_cronica: e.target.checked
                    })
                  }
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  Doença Crônica (Hipertensão, Diabetes, Cardiopatia, etc.)
                </span>
              </label>
              <span className="text-xs text-gray-400 dark:text-slate-400">
                {formData.saude_doenca_cronica ? 'Registrado' : 'Não se aplica'}
              </span>
            </div>

            {formData.saude_doenca_cronica && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 animate-fadeIn">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Quem possui (Grau de Parentesco):
                  </label>
                  <input
                    type="text"
                    value={formData.saude_doenca_cronica_parentesco}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        saude_doenca_cronica_parentesco: e.target.value,
                        saude_doenca_cronica_detalhe: `${e.target.value} | Med: ${formData.saude_doenca_cronica_medicamento}`
                      })
                    }
                    placeholder="Ex: Mãe / O próprio assistido"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-slate-600 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Medicamento / Como adquire:
                  </label>
                  <input
                    type="text"
                    value={formData.saude_doenca_cronica_medicamento}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        saude_doenca_cronica_medicamento: e.target.value,
                        saude_doenca_cronica_detalhe: `${formData.saude_doenca_cronica_parentesco} | Med: ${e.target.value}`
                      })
                    }
                    placeholder="Ex: Losartana / Posto de Saúde SUS / Farmácia Popular"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-slate-600 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. Dependência Química */}
          <div className="p-4 bg-gray-50 dark:bg-slate-700/60 border border-gray-200 dark:border-slate-600 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.saude_dependencia_quimica}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      saude_dependencia_quimica: e.target.checked
                    })
                  }
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  Dependência Química (Álcool ou outras substâncias)
                </span>
              </label>
              <span className="text-xs text-gray-400 dark:text-slate-400">
                {formData.saude_dependencia_quimica ? 'Registrado' : 'Não se aplica'}
              </span>
            </div>

            {formData.saude_dependencia_quimica && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 animate-fadeIn">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Quem possui (Grau de Parentesco):
                  </label>
                  <input
                    type="text"
                    value={formData.saude_dependencia_quimica_parentesco}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        saude_dependencia_quimica_parentesco: e.target.value,
                        saude_dependencia_quimica_detalhe: `${e.target.value} | Tratamento/Med: ${formData.saude_dependencia_quimica_medicamento}`
                      })
                    }
                    placeholder="Ex: Filho / Cônjuge"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-slate-600 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Medicamento / Como adquire / Acompanhamento:
                  </label>
                  <input
                    type="text"
                    value={formData.saude_dependencia_quimica_medicamento}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        saude_dependencia_quimica_medicamento: e.target.value,
                        saude_dependencia_quimica_detalhe: `${formData.saude_dependencia_quimica_parentesco} | Tratamento/Med: ${e.target.value}`
                      })
                    }
                    placeholder="Ex: CAPS AD / Sem medicação / Em abstinência"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-slate-600 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. Sofrimento Psíquico Grave / Saúde Mental */}
          <div className="p-4 bg-gray-50 dark:bg-slate-700/60 border border-gray-200 dark:border-slate-600 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.saude_mental}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      saude_mental: e.target.checked
                    })
                  }
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  Sofrimento Psíquico Grave / Saúde Mental (Depressão severa, Transtorno Bipolar, Ansiedade grave)
                </span>
              </label>
              <span className="text-xs text-gray-400 dark:text-slate-400">
                {formData.saude_mental ? 'Registrado' : 'Não se aplica'}
              </span>
            </div>

            {formData.saude_mental && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 animate-fadeIn">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Quem possui (Grau de Parentesco):
                  </label>
                  <input
                    type="text"
                    value={formData.saude_mental_parentesco}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        saude_mental_parentesco: e.target.value,
                        saude_mental_detalhe: `${e.target.value} | Med: ${formData.saude_mental_medicamento}`
                      })
                    }
                    placeholder="Ex: Próprio assistido / Filha"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-slate-600 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Medicamento / Como adquire:
                  </label>
                  <input
                    type="text"
                    value={formData.saude_mental_medicamento}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        saude_mental_medicamento: e.target.value,
                        saude_mental_detalhe: `${formData.saude_mental_parentesco} | Med: ${e.target.value}`
                      })
                    }
                    placeholder="Ex: Sertralina / Ambulatório da FLH / Posto SUS"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-slate-600 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 4. Deficiência / Síndrome */}
          <div className="p-4 bg-gray-50 dark:bg-slate-700/60 border border-gray-200 dark:border-slate-600 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.saude_deficiencia}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      saude_deficiencia: e.target.checked
                    })
                  }
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  Deficiência / Síndrome (PcD, TEA, Síndrome de Down, Motora, Visual, Auditiva)
                </span>
              </label>
              <span className="text-xs text-gray-400 dark:text-slate-400">
                {formData.saude_deficiencia ? 'Registrado' : 'Não se aplica'}
              </span>
            </div>

            {formData.saude_deficiencia && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 animate-fadeIn">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Quem possui (Grau de Parentesco):
                  </label>
                  <input
                    type="text"
                    value={formData.saude_deficiencia_parentesco}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        saude_deficiencia_parentesco: e.target.value,
                        saude_deficiencia_detalhe: `${e.target.value} | Detalhe: ${formData.saude_deficiencia_medicamento}`
                      })
                    }
                    placeholder="Ex: Filho / O próprio assistido"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-slate-600 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Tipo de Deficiência / Medicamento / Como adquire:
                  </label>
                  <input
                    type="text"
                    value={formData.saude_deficiencia_medicamento}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        saude_deficiencia_medicamento: e.target.value,
                        saude_deficiencia_detalhe: `${formData.saude_deficiencia_parentesco} | Detalhe: ${e.target.value}`
                      })
                    }
                    placeholder="Ex: Autismo nível 2 / Risperidona - Farmácia SUS"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-slate-600 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 5. Outra Situação de Saúde */}
          <div className="p-4 bg-gray-50 dark:bg-slate-700/60 border border-gray-200 dark:border-slate-600 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.saude_outra_situacao}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      saude_outra_situacao: e.target.checked
                    })
                  }
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  Outra Situação Relevante de Saúde
                </span>
              </label>
              <span className="text-xs text-gray-400 dark:text-slate-400">
                {formData.saude_outra_situacao ? 'Registrado' : 'Não se aplica'}
              </span>
            </div>

            {formData.saude_outra_situacao && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 animate-fadeIn">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Quem possui (Grau de Parentesco):
                  </label>
                  <input
                    type="text"
                    value={formData.saude_outra_situacao_parentesco}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        saude_outra_situacao_parentesco: e.target.value,
                        saude_outra_situacao_detalhe: `${e.target.value} | Med: ${formData.saude_outra_situacao_medicamento}`
                      })
                    }
                    placeholder="Ex: Avô acamado / Sobrinho"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-slate-600 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Condição e Medicamento / Como adquire:
                  </label>
                  <input
                    type="text"
                    value={formData.saude_outra_situacao_medicamento}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        saude_outra_situacao_medicamento: e.target.value,
                        saude_outra_situacao_detalhe: `${formData.saude_outra_situacao_parentesco} | Med: ${e.target.value}`
                      })
                    }
                    placeholder="Ex: Sequelas de AVC / Fisioterapia domiciliar e anticoagulante"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-slate-600 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rede de Apoio e Risco de Evasão */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs space-y-6 transition-colors">
        <h3 className="text-base font-bold text-gray-900 dark:text-slate-100 border-b border-gray-100 dark:border-slate-700 pb-3 flex items-center gap-2">
          <Users2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          Rede de Apoio e Fatores de Risco
        </h3>

        {/* Rede de Apoio Principal */}
        <div className="p-4 bg-gray-50 dark:bg-slate-700/60 border border-gray-200 dark:border-slate-600 rounded-xl space-y-3">
          <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
            Rede de Apoio Principal da Família
          </label>
          <div className="flex flex-wrap gap-3 sm:gap-4">
            {REDES_APOIO.map((apoio) => (
              <label
                key={apoio}
                className="inline-flex items-center gap-2 text-sm text-gray-800 dark:text-slate-200 font-semibold cursor-pointer"
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
        <div className="p-4 bg-gray-50 dark:bg-slate-700/60 border border-gray-200 dark:border-slate-600 rounded-xl space-y-3">
          <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
            Fatores de Risco para Permanência / Evasão das Atividades
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {FATORES_EVASAO_OPCOES.map((fat) => {
              const checked = formData.fatores_risco_evasao.includes(fat);
              return (
                <label
                  key={fat}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold cursor-pointer select-none transition ${
                    checked
                      ? 'bg-rose-500 dark:bg-rose-600 border-rose-600 dark:border-rose-700 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-200 border-gray-200 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-650'
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
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs space-y-6 transition-colors">
        <h3 className="text-base font-bold text-gray-900 dark:text-slate-100 border-b border-gray-100 dark:border-slate-700 pb-3 flex items-center gap-2">
          <Building className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          Serviços da Fundação Lar Harmonia (FLH) Já Utilizados
        </h3>

        <div className="space-y-4">
          <p className="text-xs text-gray-600 dark:text-slate-300">
            Marque todos os setores ou atendimentos da instituição que a família já utilizou:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {SERVICOS_FLH_OPCOES.map((serv) => {
              const checked = formData.servicos_flh_utilizados.includes(serv);
              return (
                <label
                  key={serv}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold cursor-pointer select-none transition ${
                    checked
                      ? 'bg-emerald-600 dark:bg-emerald-500 border-emerald-700 dark:border-emerald-600 text-white shadow-xs'
                      : 'bg-gray-50 dark:bg-slate-700/60 border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700'
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
