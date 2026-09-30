import React from 'react';
import { Assistido } from '../types/assistido';
import {
  User,
  HeartPulse,
  Briefcase,
  Home,
  AlertTriangle,
  GraduationCap,
  Calendar,
  Phone,
  MapPin,
  Pill,
  FileText
} from 'lucide-react';

export interface CondicaoSaudeImpressao {
  id: string;
  categoria: string;
  quemPossui: string;
  nomeDoenca: string;
  medicamento: string;
  observacoes: string;
  original: string;
}

export interface FichaAssistidoProps {
  assistido: Assistido;
  dataEmissao?: string;
}

export const parseCondicoesSaudeParaImpressao = (rawSaude?: string[] | string | null): CondicaoSaudeImpressao[] => {
  if (!rawSaude) return [];
  const itemsRaw = Array.isArray(rawSaude)
    ? rawSaude
    : typeof rawSaude === 'string'
    ? [rawSaude]
    : [];

  const condicoes: CondicaoSaudeImpressao[] = [];

  itemsRaw.forEach((item, index) => {
    if (!item || typeof item !== 'string' || !item.trim()) return;

    let categoria = 'Condição de Saúde';
    let content = item.trim();

    if (item.startsWith('Doença Crônica:')) {
      categoria = 'Doença Crônica';
      content = item.replace('Doença Crônica:', '').trim();
    } else if (item.startsWith('Dependência Química:')) {
      categoria = 'Dependência Química';
      content = item.replace('Dependência Química:', '').trim();
    } else if (item.startsWith('Saúde Mental:')) {
      categoria = 'Saúde Mental / Psíquica';
      content = item.replace('Saúde Mental:', '').trim();
    } else if (item.startsWith('Deficiência/Síndrome:') || item.startsWith('Deficiência:')) {
      categoria = 'Deficiência / Síndrome';
      content = item.replace(/Deficiência(\/Síndrome)?:/, '').trim();
    } else if (item.startsWith('Outra Situação de Saúde:')) {
      categoria = 'Outra Situação de Saúde';
      content = item.replace('Outra Situação de Saúde:', '').trim();
    }

    let nomeDoenca = '';
    let quemPossui = 'O próprio assistido';
    let medicamento = '';
    let observacoes = '';

    if (content.includes('|')) {
      const parts = content.split('|').map((p) => p.trim());
      parts.forEach((p) => {
        if (p.startsWith('Doença:') || p.startsWith('Doenca:')) {
          nomeDoenca = p.replace(/^Doen[cç]a:\s*/i, '').trim();
        } else if (p.startsWith('Paciente:')) {
          quemPossui = p.replace(/^Paciente:\s*/i, '').trim();
        } else if (
          p.startsWith('Med/Tratamento:') ||
          p.startsWith('Med:') ||
          p.startsWith('Medicamento:') ||
          p.startsWith('Tratamento:')
        ) {
          medicamento = p.replace(/^(Med\/Tratamento|Med|Medicamento|Tratamento):\s*/i, '').trim();
        } else if (
          p.startsWith('Obs:') ||
          p.startsWith('Observacao:') ||
          p.startsWith('Observação:')
        ) {
          observacoes = p.replace(/^(Obs|Observacao|Observação):\s*/i, '').trim();
        } else if (p && p !== 'Sim' && p !== 'Não') {
          if (!nomeDoenca) nomeDoenca = p;
        }
      });
    } else {
      const match = content.match(/^([^(]+)\s*\(([^)]+)\)/);
      if (match) {
        quemPossui = match[1].trim();
        medicamento = match[2].replace(/^(Med\/Tratamento|Med|Tratamento):\s*/i, '').trim();
      } else if (content !== 'Sim' && content !== 'Não') {
        if (
          content.includes('Assistido') ||
          content.includes('Mãe') ||
          content.includes('Filho') ||
          content.includes('Pai') ||
          content.includes('Espos') ||
          content.includes('Cônjuge')
        ) {
          quemPossui = content;
        } else {
          nomeDoenca = content;
        }
      }
    }

    condicoes.push({
      id: `cond_${index}_${Date.now()}`,
      categoria,
      quemPossui: quemPossui || 'O próprio assistido',
      nomeDoenca: nomeDoenca || categoria,
      medicamento: medicamento || 'Não informado / Sem medicação contínua',
      observacoes: observacoes || 'Sem observações adicionais',
      original: item
    });
  });

  return condicoes;
};

export const FichaAssistido: React.FC<FichaAssistidoProps> = ({
  assistido,
  dataEmissao = new Date().toLocaleDateString('pt-BR')
}) => {
  const condicoesSaude = parseCondicoesSaudeParaImpressao(assistido.doencas_cronicas_familia);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Não informada';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="ficha-assistido-container bg-white text-slate-900 font-sans p-6 text-xs leading-relaxed max-w-4xl mx-auto">
      {/* CABEÇALHO INSTITUCIONAL */}
      <div className="print-section border-b-2 border-slate-900 pb-3 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-700 text-white flex items-center justify-center font-black text-xl tracking-tighter">
            FLH
          </div>
          <div>
            <h1 className="text-base font-bold uppercase tracking-wider text-slate-950">
              Fundação Lar Harmonia
            </h1>
            <p className="text-[11px] text-slate-600 font-medium">
              Ficha de Acolhimento e Cadastro Social do Assistido
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="inline-block px-2.5 py-0.5 border border-slate-900 font-mono text-[10px] font-bold rounded">
            ID: {assistido.id ? assistido.id.slice(0, 8).toUpperCase() : 'NOVO'}
          </span>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Emissão: {dataEmissao}
          </p>
        </div>
      </div>

      {/* 1. DADOS CIVIS E IDENTIFICAÇÃO */}
      <div className="print-section mb-3.5">
        <h2 className="text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-900 px-2 py-1 border-l-4 border-indigo-700 mb-1.5 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-indigo-700" />
          1. Identificação Civil e Contato
        </h2>

        <div className="flex gap-4 border border-slate-200 p-2.5 rounded text-[11px]">
          {assistido.foto_url && (
            <div className="w-20 h-24 rounded border border-slate-300 overflow-hidden shrink-0 bg-slate-50 flex items-center justify-center">
              <img
                src={assistido.foto_url}
                alt={assistido.nome}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 flex-1">
            <div className="col-span-2">
              <span className="text-slate-500 block text-[10px]">Nome Completo:</span>
              <strong className="text-slate-950 text-xs">{assistido.nome || 'Não informado'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Status de Acompanhamento:</span>
              <span className="font-semibold text-indigo-700">
                {assistido.status_acompanhamento || 'Ativo / Em Acompanhamento'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px]">CPF:</span>
              <span className="font-mono">{assistido.cpf || 'Não informado'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">RG:</span>
              <span className="font-mono">{assistido.rg || 'Não informado'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Data de Nascimento / Idade:</span>
              <span>
                {formatDate(assistido.data_nascimento)}
                {assistido.idade ? ` (${assistido.idade} anos)` : ''}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px]">Telefone / Contato:</span>
              <span>{assistido.telefone || 'Não informado'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Escolaridade:</span>
              <span>{assistido.escolaridade || 'Não informada'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Estado Civil / Raça:</span>
              <span>
                {assistido.estado_civil || 'Não informado'} | {assistido.raca_cor || 'Não informada'}
              </span>
            </div>

            <div className="col-span-2">
              <span className="text-slate-500 block text-[10px]">Endereço Completo:</span>
              <span>
                {assistido.em_situacao_rua
                  ? 'Pessoa em Situação de Rua / Sem Moradia Fixa'
                  : assistido.endereco
                  ? `${assistido.endereco} - ${assistido.bairro || 'Sem Bairro'}`
                  : 'Não informado'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Cadastro FLH / CRAS:</span>
              <span>
                FLH: {assistido.possui_cadastro_flh ? 'Sim' : 'Não'} | CRAS:{' '}
                {assistido.possui_cras ? `Sim (${assistido.bairro_cras || 'Bairro'})` : 'Não'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. TRABALHO, RENDA E BENEFÍCIOS */}
      <div className="print-section mb-3.5">
        <h2 className="text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-900 px-2 py-1 border-l-4 border-indigo-700 mb-1.5 flex items-center gap-1.5">
          <Briefcase className="w-3.5 h-3.5 text-indigo-700" />
          2. Trabalho, Renda e Benefícios
        </h2>

        <div className="grid grid-cols-3 gap-2 border border-slate-200 p-2.5 rounded text-[11px]">
          <div className="col-span-2">
            <span className="text-slate-500 block text-[10px]">Atividade e Ocupação:</span>
            <strong className="text-slate-950">
              {assistido.profissao ||
                (assistido.atividade_remunerada === 'Aposentado(a) / Pensionista'
                  ? 'Aposentado(a) / Pensionista'
                  : assistido.atividade_remunerada === 'Sim'
                  ? 'Realiza atividade remunerada'
                  : 'Sem ocupação formal')}
            </strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">Renda Familiar Estimada:</span>
            <span>
              {assistido.renda_familiar_faixa ||
                (assistido.renda_familiar_aproximada
                  ? `R$ ${assistido.renda_familiar_aproximada}`
                  : 'Sem renda informada')}
            </span>
          </div>

          <div className="col-span-3">
            <span className="text-slate-500 block text-[10px]">Programas e Benefícios Sociais:</span>
            <span>
              {Array.isArray(assistido.beneficios_sociais) && assistido.beneficios_sociais.length > 0
                ? assistido.beneficios_sociais.join(', ')
                : 'Nenhum benefício social registrado'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. MORADIA E COMPOSIÇÃO FAMILIAR */}
      <div className="print-section mb-3.5">
        <h2 className="text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-900 px-2 py-1 border-l-4 border-indigo-700 mb-1.5 flex items-center gap-1.5">
          <Home className="w-3.5 h-3.5 text-indigo-700" />
          3. Moradia e Composição Familiar
        </h2>

        <div className="grid grid-cols-3 gap-2 border border-slate-200 p-2.5 rounded text-[11px]">
          <div>
            <span className="text-slate-500 block text-[10px]">Tipo de Moradia:</span>
            <span>{assistido.tipo_moradia || 'Não informado'}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">Composição Familiar:</span>
            <span>
              {assistido.composicao_familiar
                ? `${assistido.composicao_familiar} pessoa(s) no domicílio`
                : 'Não informada'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">Quantidade de Filhos:</span>
            <span>
              {assistido.quantidade_filhos !== undefined && assistido.quantidade_filhos !== null
                ? `${assistido.quantidade_filhos} filho(s)`
                : 'Não informado'}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px]">Infraestrutura (Água / Luz / Saneamento):</span>
            <span>
              {assistido.em_situacao_rua || assistido.tipo_moradia?.includes('Rua')
                ? 'Não se aplica (Situação de Rua)'
                : assistido.servicos_basicos_regulares
                ? 'Serviços Regulares'
                : 'Irregulares / Parciais'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">Acesso à Internet:</span>
            <span>{assistido.acesso_internet || 'Não informado'}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">Rede de Apoio:</span>
            <span>{assistido.rede_apoio || 'Não informada'}</span>
          </div>
        </div>
      </div>

      {/* 4. VULNERABILIDADES E SAÚDE FAMILIAR (DETALHADA) */}
      <div className="print-section mb-3.5">
        <h2 className="text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-900 px-2 py-1 border-l-4 border-rose-600 mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
            4. Vulnerabilidades e Saúde Familiar
          </span>
          <span className="text-[10px] font-semibold text-slate-600">
            {condicoesSaude.length > 0
              ? `${condicoesSaude.length} condição(ões) cadastrada(s)`
              : 'Nenhuma patologia registrada'}
          </span>
        </h2>

        {/* Tabela Formatada e Limpa de Condições de Saúde */}
        {condicoesSaude.length > 0 ? (
          <div className="border border-slate-300 rounded overflow-hidden mb-2">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold">
                  <th className="py-1.5 px-2.5 w-1/4">Categoria & Diagnóstico</th>
                  <th className="py-1.5 px-2.5 w-1/5">Quem Possui</th>
                  <th className="py-1.5 px-2.5 w-1/4">Medicamento / Tratamento</th>
                  <th className="py-1.5 px-2.5">Observações & Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {condicoesSaude.map((cond, i) => (
                  <tr key={cond.id || i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="py-1.5 px-2.5 align-top">
                      <span className="font-bold text-slate-950 block">{cond.nomeDoenca}</span>
                      <span className="text-[10px] text-rose-700 font-medium">{cond.categoria}</span>
                    </td>
                    <td className="py-1.5 px-2.5 align-top">
                      <span className="font-semibold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[10px] inline-block">
                        {cond.quemPossui}
                      </span>
                    </td>
                    <td className="py-1.5 px-2.5 align-top text-slate-800">
                      {cond.medicamento}
                    </td>
                    <td className="py-1.5 px-2.5 align-top text-slate-700">
                      {cond.observacoes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-2 border border-slate-200 rounded text-[11px] text-slate-600 bg-slate-50 mb-2">
            Nenhuma condição crônica, dependência, sofrimento mental ou deficiência declarada.
          </div>
        )}

        {/* Informações adicionais de vulnerabilidade */}
        <div className="grid grid-cols-2 gap-2 border border-slate-200 p-2 rounded text-[11px] bg-slate-50/30">
          <div>
            <span className="text-slate-500 block text-[10px]">Dificuldades Enfrentadas:</span>
            <span className="font-medium text-slate-900">
              {Array.isArray(assistido.dificuldades_enfrentadas) && assistido.dificuldades_enfrentadas.length > 0
                ? assistido.dificuldades_enfrentadas.join(', ')
                : 'Nenhuma dificuldade registrada'}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px]">Fatores de Risco de Evasão:</span>
            <span className="font-medium text-slate-900">
              {Array.isArray(assistido.fatores_risco_evasao) && assistido.fatores_risco_evasao.length > 0
                ? assistido.fatores_risco_evasao.join(', ')
                : 'Nenhum identificado'}
            </span>
          </div>
        </div>
      </div>

      {/* 5. MOTIVAÇÕES E OFICINAS FLH */}
      <div className="print-section mb-4">
        <h2 className="text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-900 px-2 py-1 border-l-4 border-indigo-700 mb-1.5 flex items-center gap-1.5">
          <GraduationCap className="w-3.5 h-3.5 text-indigo-700" />
          5. Motivações e Oficinas na Fundação Lar Harmonia
        </h2>

        <div className="grid grid-cols-2 gap-2 border border-slate-200 p-2.5 rounded text-[11px]">
          <div>
            <span className="text-slate-500 block text-[10px]">Oficina / Curso Vinculado:</span>
            <strong className="text-indigo-950 font-bold">
              {assistido.curso_pretendido || 'Acompanhamento Geral FLH'}
            </strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">Data de Ingresso:</span>
            <span>{formatDate(assistido.data_ingresso || assistido.created_at)}</span>
          </div>

          <div className="col-span-2">
            <span className="text-slate-500 block text-[10px]">Motivo da Busca & Expectativas:</span>
            <span>{assistido.motivo_busca || assistido.expectativa_curso || 'Não informado'}</span>
          </div>

          {assistido.objetivo_profissional_3_meses && (
            <div className="col-span-2">
              <span className="text-slate-500 block text-[10px]">Objetivo Profissional (3 Meses):</span>
              <span>{assistido.objetivo_profissional_3_meses}</span>
            </div>
          )}
        </div>
      </div>

      {/* ASSINATURAS E RESPONSÁVEIS */}
      <div className="print-section pt-4 mt-6 border-t border-slate-300">
        <div className="grid grid-cols-2 gap-10 text-center text-[10px]">
          <div>
            <div className="border-b border-slate-400 w-4/5 mx-auto mb-1"></div>
            <p className="font-semibold text-slate-900">
              {assistido.nome || 'Assinatura do Assistido(a)'}
            </p>
            <p className="text-slate-500">Assistido(a) / Responsável Legal</p>
          </div>

          <div>
            <div className="border-b border-slate-400 w-4/5 mx-auto mb-1"></div>
            <p className="font-semibold text-slate-900">Assistente Social / FLH</p>
            <p className="text-slate-500">Fundação Lar Harmonia</p>
          </div>
        </div>
      </div>
    </div>
  );
};
