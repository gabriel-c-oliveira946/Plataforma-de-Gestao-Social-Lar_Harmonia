import React, { useRef } from 'react';
import {
  User,
  Calendar,
  Phone,
  Home,
  Building2,
  Camera,
  Trash2,
  UploadCloud,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  CadastroFormData,
  ESCOLARIDADES,
  ESTADOS_CIVIS,
  RACAS_OPCOES,
  STATUS_ACOMPANHAMENTO_OPCOES
} from '../../types/cadastro';
import { formatCPF, formatRG, formatTelefone, handleIntegerKeyDown } from '../../utils/masks';

interface TabIdentificacaoProps {
  formData: CadastroFormData;
  setFormData: React.Dispatch<React.SetStateAction<CadastroFormData>>;
  fotoPreview: string | null;
  onFileSelect: (file: File) => void;
  onRemoveFoto: () => void;
}

export const TabIdentificacao: React.FC<TabIdentificacaoProps> = ({
  formData,
  setFormData,
  fotoPreview,
  onFileSelect,
  onRemoveFoto
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSituacaoRuaChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      em_situacao_rua: checked,
      endereco: checked ? 'Em situação de rua' : prev.endereco === 'Em situação de rua' ? '' : prev.endereco,
      bairro: checked ? 'Sem moradia fixa' : prev.bairro === 'Sem moradia fixa' ? '' : prev.bairro,
      tipo_moradia: checked ? 'Em situação de rua' : prev.tipo_moradia,
      mora_sozinho: checked ? true : prev.mora_sozinho,
      composicao_familiar: checked ? 1 : prev.composicao_familiar
    }));
  };

  const handleDataNascimento = (dateVal: string) => {
    let calculatedAge = formData.idade;
    if (dateVal) {
      const birth = new Date(dateVal);
      if (!isNaN(birth.getTime())) {
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
          age--;
        }
        if (age >= 0 && age <= 125) {
          calculatedAge = age;
        }
      }
    }
    setFormData((prev) => ({
      ...prev,
      data_nascimento: dateVal,
      idade: calculatedAge
    }));
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Box de Foto do Assistido */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs transition-colors">
        <h3 className="text-base font-bold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Camera className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          Foto do Assistido <span className="text-xs font-normal text-gray-500 dark:text-slate-400">(Opcional)</span>
        </h3>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group shrink-0">
            <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-dashed border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 flex items-center justify-center shadow-inner">
              {fotoPreview ? (
                <img
                  src={fotoPreview}
                  alt="Pré-visualização do Assistido"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-3">
                  <User className="w-10 h-10 text-gray-300 dark:text-slate-500 mx-auto" />
                  <span className="text-[11px] text-gray-400 dark:text-slate-400 block mt-1">Sem foto</span>
                </div>
              )}
            </div>

            {fotoPreview && (
              <button
                type="button"
                onClick={onRemoveFoto}
                className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full shadow-md transition cursor-pointer"
                title="Remover foto"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <p className="text-xs text-gray-600 dark:text-slate-300">
              Selecione uma foto recente do assistido ou capture com a câmera do celular/computador.
            </p>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onFileSelect(f);
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                {fotoPreview ? 'Trocar Imagem' : 'Carregar Imagem'}
              </button>
              {fotoPreview && (
                <button
                  type="button"
                  onClick={onRemoveFoto}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl text-xs font-medium transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remover
                </button>
              )}
            </div>
            <p className="text-[11px] text-gray-400 dark:text-slate-500">Formatos aceitos: JPG, PNG, WEBP (até 8MB).</p>
          </div>
        </div>
      </div>

      {/* Dados Pessoais e Civis */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs space-y-6 transition-colors">
        <h3 className="text-base font-bold text-gray-900 dark:text-slate-100 border-b border-gray-100 dark:border-slate-700 pb-3 flex items-center gap-2">
          <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          Dados Pessoais e Documentação
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5">
          {/* Nome Completo */}
          <div className="md:col-span-8">
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Nome Completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.nome_completo}
              onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
              placeholder="Ex: Maria dos Santos Silva"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
            />
          </div>

          {/* Data de Nascimento */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-gray-500 dark:text-slate-400" />
              Nascimento
            </label>
            <input
              type="date"
              value={formData.data_nascimento}
              onChange={(e) => handleDataNascimento(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition"
            />
          </div>

          {/* Idade */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Idade
            </label>
            <input
              type="number"
              min="0"
              max="125"
              value={formData.idade}
              onKeyDown={handleIntegerKeyDown}
              onChange={(e) =>
                setFormData({ ...formData, idade: e.target.value.replace(/\D/g, '') })
              }
              placeholder="Anos"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition"
            />
          </div>

          {/* CPF com máscara */}
          <div className="md:col-span-4">
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              CPF <span className="text-[11px] font-normal text-gray-400 dark:text-slate-400">(Opcional)</span>
            </label>
            <input
              type="text"
              maxLength={14}
              value={formData.cpf}
              onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
              placeholder="000.000.000-00"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition"
            />
          </div>

          {/* RG */}
          <div className="md:col-span-4">
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              RG / Documento <span className="text-[11px] font-normal text-gray-400 dark:text-slate-400">(Opcional)</span>
            </label>
            <input
              type="text"
              maxLength={15}
              value={formData.rg}
              onChange={(e) => setFormData({ ...formData, rg: formatRG(e.target.value) })}
              placeholder="Número do RG"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition"
            />
          </div>

          {/* Telefone */}
          <div className="md:col-span-4">
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-gray-500 dark:text-slate-400" />
              Telefone / WhatsApp
            </label>
            <input
              type="text"
              maxLength={15}
              value={formData.telefone}
              onChange={(e) =>
                setFormData({ ...formData, telefone: formatTelefone(e.target.value) })
              }
              placeholder="(00) 00000-0000"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition"
            />
          </div>

          {/* Escolaridade */}
          <div className="md:col-span-4">
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Escolaridade
            </label>
            <select
              value={formData.escolaridade}
              onChange={(e) => setFormData({ ...formData, escolaridade: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition bg-white dark:bg-slate-700"
            >
              {ESCOLARIDADES.map((esc) => (
                <option key={esc} value={esc}>
                  {esc}
                </option>
              ))}
            </select>
          </div>

          {/* Estado Civil */}
          <div className="md:col-span-4">
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Estado Civil
            </label>
            <select
              value={formData.estado_civil}
              onChange={(e) => setFormData({ ...formData, estado_civil: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition bg-white dark:bg-slate-700"
            >
              {ESTADOS_CIVIS.map((ec) => (
                <option key={ec} value={ec}>
                  {ec}
                </option>
              ))}
            </select>
          </div>

          {/* Raça / Cor */}
          <div className="md:col-span-4">
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Raça / Cor
            </label>
            <select
              value={formData.raca_cor}
              onChange={(e) => setFormData({ ...formData, raca_cor: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition bg-white dark:bg-slate-700"
            >
              {RACAS_OPCOES.map((raca) => (
                <option key={raca} value={raca}>
                  {raca}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Endereço e Moradia */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs space-y-6 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-slate-700 pb-3">
          <h3 className="text-base font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
            <Home className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Endereço e Localização
          </h3>

          <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-900 dark:text-amber-300 text-xs font-semibold cursor-pointer select-none hover:bg-amber-100 dark:hover:bg-amber-900/60 transition">
            <input
              type="checkbox"
              checked={formData.em_situacao_rua}
              onChange={(e) => handleSituacaoRuaChange(e.target.checked)}
              className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
            />
            Em situação de rua / Sem moradia fixa
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5">
          <div className="md:col-span-8">
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Endereço / Logradouro <span className="text-[11px] font-normal text-gray-400 dark:text-slate-400">(Opcional)</span>
            </label>
            <input
              type="text"
              disabled={formData.em_situacao_rua}
              value={formData.endereco}
              onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
              placeholder={formData.em_situacao_rua ? 'Em situação de rua' : 'Rua, Avenida, Número, Complemento'}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition ${
                formData.em_situacao_rua
                  ? 'bg-gray-100 dark:bg-slate-700/50 border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 cursor-not-allowed'
                  : 'border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500'
              }`}
            />
          </div>

          <div className="md:col-span-4">
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Bairro <span className="text-[11px] font-normal text-gray-400 dark:text-slate-400">(Opcional)</span>
            </label>
            <input
              type="text"
              disabled={formData.em_situacao_rua}
              value={formData.bairro}
              onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
              placeholder={formData.em_situacao_rua ? 'Sem moradia fixa' : 'Bairro / Comunidade'}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition ${
                formData.em_situacao_rua
                  ? 'bg-gray-100 dark:bg-slate-700/50 border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 cursor-not-allowed'
                  : 'border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Cadastros Prévios (FLH e CRAS) */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs space-y-6 transition-colors">
        <h3 className="text-base font-bold text-gray-900 dark:text-slate-100 border-b border-gray-100 dark:border-slate-700 pb-3 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          Vínculos e Cadastros Institucionais
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Cadastro FLH */}
          <div className="p-4 bg-gray-50 dark:bg-slate-700/60 border border-gray-200 dark:border-slate-600 rounded-xl space-y-3">
            <span className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
              Possui cadastro prévio no Lar Harmonia (FLH)?
            </span>
            <div className="flex gap-4">
              <label className="inline-flex items-center gap-2 text-sm text-gray-800 dark:text-slate-200 font-medium cursor-pointer">
                <input
                  type="radio"
                  name="possui_cadastro_flh"
                  checked={formData.possui_cadastro_flh}
                  onChange={() => setFormData({ ...formData, possui_cadastro_flh: true })}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                Sim
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-gray-800 dark:text-slate-200 font-medium cursor-pointer">
                <input
                  type="radio"
                  name="possui_cadastro_flh"
                  checked={!formData.possui_cadastro_flh}
                  onChange={() => setFormData({ ...formData, possui_cadastro_flh: false })}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                Não
              </label>
            </div>
          </div>

          {/* Cadastro CRAS */}
          <div className="p-4 bg-gray-50 dark:bg-slate-700/60 border border-gray-200 dark:border-slate-600 rounded-xl space-y-3">
            <span className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
              Possui cadastro no CRAS?
            </span>
            <div className="flex gap-4">
              <label className="inline-flex items-center gap-2 text-sm text-gray-800 dark:text-slate-200 font-medium cursor-pointer">
                <input
                  type="radio"
                  name="possui_cras"
                  checked={formData.possui_cras}
                  onChange={() => setFormData({ ...formData, possui_cras: true })}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                Sim
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-gray-800 dark:text-slate-200 font-medium cursor-pointer">
                <input
                  type="radio"
                  name="possui_cras"
                  checked={!formData.possui_cras}
                  onChange={() =>
                    setFormData({ ...formData, possui_cras: false, bairro_cras: '' })
                  }
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                Não
              </label>
            </div>

            {formData.possui_cras && (
              <div className="pt-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Qual o bairro / unidade do CRAS?
                </label>
                <input
                  type="text"
                  value={formData.bairro_cras}
                  onChange={(e) => setFormData({ ...formData, bairro_cras: e.target.value })}
                  placeholder="Ex: CRAS Piatã / Itapuã"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 rounded-lg border border-gray-300 dark:border-slate-600 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Período de Acolhimento e Status no Lar Harmonia */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs space-y-5 transition-colors">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700 pb-3">
          <h3 className="text-base font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Ingresso, Período de Acolhimento e Status FLH
          </h3>
          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
            Aba 1 • Gestão Temporal
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5">
          {/* Data de Ingresso / Entrada */}
          <div className="md:col-span-4">
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <span>Data de Ingresso / Entrada</span>
              <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.data_ingresso || ''}
              onChange={(e) => setFormData({ ...formData, data_ingresso: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-700 rounded-xl border border-gray-300 dark:border-slate-600 text-sm font-semibold text-gray-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1">
              Preenchida por padrão com a data atual. Permite alteração manual para datas passadas (digitalização de fichas antigas).
            </p>
          </div>

          {/* Status do Acompanhamento */}
          <div className="md:col-span-4">
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Status do Acompanhamento <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.status_acompanhamento || 'Ativo / Em Acompanhamento'}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status_acompanhamento: e.target.value as any,
                  status_atendimento: e.target.value
                })
              }
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-700 rounded-xl border border-gray-300 dark:border-slate-600 text-sm font-semibold text-gray-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              {STATUS_ACOMPANHAMENTO_OPCOES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1">
              Situação da matrícula/atendimento do assistido na instituição.
            </p>
          </div>

          {/* Data de Saída / Desligamento */}
          <div className="md:col-span-4">
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Data de Saída / Desligamento</span>
              <span className="text-[10px] text-gray-400 dark:text-slate-400 font-normal lowercase">(opcional)</span>
            </label>
            <input
              type="date"
              value={formData.data_saida || ''}
              onChange={(e) => setFormData({ ...formData, data_saida: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-700 rounded-xl border border-gray-300 dark:border-slate-600 text-sm font-semibold text-gray-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1">
              Informe quando houver conclusão, evasão ou encerramento do acompanhamento.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
