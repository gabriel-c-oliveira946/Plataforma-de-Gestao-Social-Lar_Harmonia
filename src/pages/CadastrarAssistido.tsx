import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase/client';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Briefcase,
  Home,
  HeartPulse,
  GraduationCap,
  Save,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  LayoutDashboard,
  Clock
} from 'lucide-react';
import {
  CadastroFormData,
  INITIAL_CADASTRO_FORM
} from '../types/cadastro';
import { formatCPF, formatRG } from '../utils/masks';
import { TabIdentificacao } from '../components/cadastro/TabIdentificacao';
import { TabTrabalhoRenda } from '../components/cadastro/TabTrabalhoRenda';
import { TabMoradiaFamilia } from '../components/cadastro/TabMoradiaFamilia';
import { TabVulnerabilidades } from '../components/cadastro/TabVulnerabilidades';
import { TabMotivacoes } from '../components/cadastro/TabMotivacoes';

export default function CadastrarAssistido() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Estado estritamente local em memória das 5 abas
  const [activeTab, setActiveTab] = useState<number>(1);
  const [formData, setFormData] = useState<CadastroFormData>(INITIAL_CADASTRO_FORM);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [successData, setSuccessData] = useState<{
    nome: string;
    cpf: string;
    oficina: string;
  } | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState<number>(4);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-redirecionamento com contagem regressiva ao cadastrar com sucesso
  useEffect(() => {
    if (!successData) return;
    const timer = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [successData, navigate]);

  // Foto do Assistido
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('O arquivo selecionado deve ser uma imagem válida (JPG, PNG ou WEBP).');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setErrorMsg('A imagem é muito grande. Escolha uma foto de até 8MB.');
      return;
    }
    setFotoFile(file);
    const previewUrl = URL.createObjectURL(file);
    setFotoPreview(previewUrl);
    setErrorMsg(null);
  };

  const handleRemoveFoto = () => {
    setFotoFile(null);
    if (fotoPreview && fotoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(fotoPreview);
    }
    setFotoPreview(null);
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

  const handleResetForm = () => {
    setFormData(INITIAL_CADASTRO_FORM);
    handleRemoveFoto();
    setActiveTab(1);
    setSuccess(false);
    setSuccessData(null);
    setRedirectCountdown(4);
    setErrorMsg(null);
  };

  // Botão "Próximo" / Enter em Abas 1 a 4: APENAS avança a aba sem chamar o Supabase
  const handleNextTab = () => {
    if (activeTab === 1 && !formData.nome_completo.trim()) {
      setErrorMsg('Por favor, informe o Nome Completo antes de prosseguir.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setErrorMsg(null);
    setActiveTab((prev) => Math.min(5, prev + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Submissão ao Supabase: EXCLUSIVAMENTE na Aba 5
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Se estiver em abas anteriores e o usuário pressionou Enter, avança sem chamar o banco
    if (activeTab < 5) {
      handleNextTab();
      return;
    }

    // Prevenção contra múltiplos cliques
    if (submitting) return;

    if (!formData.nome_completo.trim()) {
      setActiveTab(1);
      setErrorMsg('O campo "Nome Completo" é obrigatório.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      // 1. Processar Foto se houver arquivo
      let finalFotoUrl: string | null = null;
      if (fotoFile) {
        try {
          const fileExt = fotoFile.name.split('.').pop() || 'jpg';
          const cleanName = formData.nome_completo
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '_')
            .slice(0, 20);
          const fileName = `${Date.now()}_${cleanName}.${fileExt}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('fotos_assistidos')
            .upload(fileName, fotoFile, {
              cacheControl: '3600',
              upsert: true
            });

          if (!uploadError && uploadData) {
            const { data: publicUrlData } = supabase.storage
              .from('fotos_assistidos')
              .getPublicUrl(fileName);
            finalFotoUrl = publicUrlData.publicUrl;
          } else {
            finalFotoUrl = await convertFileToBase64(fotoFile);
          }
        } catch {
          finalFotoUrl = await convertFileToBase64(fotoFile);
        }
      }

      // 2. Formatar Profissão e Histórico de Trabalho (Aba 2)
      let profissaoFinal = '';
      if (formData.atividade_remunerada === 'Sim') {
        const ocup = formData.ocupacao_atual.trim() || 'Atividade Remunerada';
        const diasList =
          (formData.dias_semana_trabalho_array || []).length > 0
            ? formData.dias_semana_trabalho_array.join(', ')
            : formData.dias_semana_trabalho?.trim() || 'Não informado';
        const turno = formData.turno_trabalho || 'Manhã';
        profissaoFinal = `Ocupação: ${ocup} | Dias: ${diasList} | Turno: ${turno}`;
        if (formData.trabalhou_anteriormente === 'Sim' && formData.area_trabalho_anterior.trim()) {
          profissaoFinal += ` | Trabalho anterior: ${formData.area_trabalho_anterior.trim()}`;
        }
      } else {
        const partes: string[] = ['Sem ocupação formal no momento'];
        if (formData.desemprego_circunstancia.trim()) {
          partes.push(`Causa/Justificativa: ${formData.desemprego_circunstancia.trim()}`);
        }
        if (formData.trabalhou_anteriormente === 'Sim') {
          partes.push(
            `Já trabalhou anteriormente: Sim (${formData.area_trabalho_anterior.trim() || 'Área não informada'})`
          );
        } else {
          partes.push('Já trabalhou anteriormente: Não');
        }
        profissaoFinal = partes.join(' | ');
      }

      // 3. Programas Sociais Array (TEXT[])
      let programasSociaisArray = formData.programas_sociais.filter(Boolean);
      if (
        programasSociaisArray.includes('Outro') &&
        formData.outro_programa_social.trim()
      ) {
        programasSociaisArray = programasSociaisArray.map((p) =>
          p === 'Outro' ? `Outro: ${formData.outro_programa_social.trim()}` : p
        );
      }

      // 4. Formatar Saúde da Família (Seção 11) - Array TEXT[]
      const saudeFamiliaItens: string[] = [];
      if (formData.saude_doenca_cronica) {
        const p = formData.saude_doenca_cronica_parentesco.trim();
        const m = formData.saude_doenca_cronica_medicamento.trim();
        const info = p || m ? `${p || 'Assistido/Familiar'} (Med/Tratamento: ${m || 'Em uso'})` : (formData.saude_doenca_cronica_detalhe || 'Sim');
        saudeFamiliaItens.push(`Doença Crônica: ${info}`);
      }
      if (formData.saude_dependencia_quimica) {
        const p = formData.saude_dependencia_quimica_parentesco.trim();
        const m = formData.saude_dependencia_quimica_medicamento.trim();
        const info = p || m ? `${p || 'Familiar'} (${m || 'Sem acompanhamento especificado'})` : (formData.saude_dependencia_quimica_detalhe || 'Sim');
        saudeFamiliaItens.push(`Dependência Química: ${info}`);
      }
      if (formData.saude_mental) {
        const p = formData.saude_mental_parentesco.trim();
        const m = formData.saude_mental_medicamento.trim();
        const info = p || m ? `${p || 'Assistido/Familiar'} (${m || 'Acompanhamento em curso'})` : (formData.saude_mental_detalhe || 'Sim');
        saudeFamiliaItens.push(`Saúde Mental: ${info}`);
      }
      if (formData.saude_deficiencia) {
        const p = formData.saude_deficiencia_parentesco.trim();
        const m = formData.saude_deficiencia_medicamento.trim();
        const info = p || m ? `${p || 'Assistido/Familiar'} (${m || 'PcD / Síndrome'})` : (formData.saude_deficiencia_detalhe || 'Sim');
        saudeFamiliaItens.push(`Deficiência/Síndrome: ${info}`);
      }
      if (formData.saude_outra_situacao) {
        const p = formData.saude_outra_situacao_parentesco.trim();
        const m = formData.saude_outra_situacao_medicamento.trim();
        const info = p || m ? `${p || 'Familiar'} (${m || 'Situação relevante'})` : (formData.saude_outra_situacao_detalhe || 'Sim');
        saudeFamiliaItens.push(`Outra Situação de Saúde: ${info}`);
      }
      const doencasCronicasFamiliaArray: string[] =
        saudeFamiliaItens.length > 0
          ? saudeFamiliaItens
          : ['Nenhuma condição registrada'];

      // 5. Tipos de Deficiência (TEXT[])
      const tiposDeficienciaArray: string[] = formData.saude_deficiencia
        ? [formData.saude_deficiencia_medicamento.trim() || formData.saude_deficiencia_parentesco.trim() || 'PcD / Síndrome familiar']
        : ['Nenhuma'];

      // 6. Cursos Anteriores (TEXT[])
      let cursosAnterioresArray: string[] = [];
      if (
        formData.participou_cursos_anteriores === 'Sim' &&
        formData.cursos_anteriores_detalhes.trim()
      ) {
        cursosAnterioresArray = [formData.cursos_anteriores_detalhes.trim()];
      } else {
        cursosAnterioresArray = ['Não participou de cursos anteriores'];
      }

      // 7. Expectativa de Curso e Percepção da FLH (Seção 12)
      const expectativasList: string[] = [];
      if (formData.curso_e_preferencia === 'Sim') {
        expectativasList.push('Curso de preferência do assistido');
      } else if (formData.curso_preferencia_outro.trim()) {
        expectativasList.push(`Preferência alternativa: ${formData.curso_preferencia_outro.trim()}`);
      }

      if (formData.o_que_pretende_fazer.length > 0) {
        let pretencoes = [...formData.o_que_pretende_fazer];
        if (pretencoes.includes('Outro') && formData.o_que_pretende_outro.trim()) {
          pretencoes = pretencoes.map((p) =>
            p === 'Outro' ? `Outro: ${formData.o_que_pretende_outro.trim()}` : p
          );
        }
        expectativasList.push(`Pretende: ${pretencoes.join(', ')}`);
      }

      if (formData.representacao_flh_familia.trim()) {
        expectativasList.push(`Significado FLH: ${formData.representacao_flh_familia.trim()}`);
      }

      if (formData.percepcao_flh_hoje && formData.percepcao_flh_hoje.length > 0) {
        let percs = [...formData.percepcao_flh_hoje];
        if (percs.includes('Outro') && formData.percepcao_flh_outro.trim()) {
          percs = percs.map((p) =>
            p === 'Outro' ? `Outro: ${formData.percepcao_flh_outro.trim()}` : p
          );
        }
        expectativasList.push(`Percepção FLH: ${percs.join(', ')}`);
      }

      if (formData.nao_tem_interesse_outras_oficinas) {
        expectativasList.push('Sem interesse em outras oficinas');
      } else if (formData.interesse_outras_oficinas.trim()) {
        expectativasList.push(`Outras oficinas de interesse: ${formData.interesse_outras_oficinas.trim()}`);
      }

      if (formData.data_saida) {
        expectativasList.push(`Data de Saída: ${formData.data_saida}`);
      }

      const expectativaCursoFinal =
        expectativasList.length > 0 ? expectativasList.join(' | ') : null;

      // 8. Moradia Detalhada e Faixa de Renda Exata (Aba 3)
      const moradiaDescPartes = [formData.tipo_moradia || 'Não informado'];
      moradiaDescPartes.push(`Água: ${formData.agua_regularidade}`);
      moradiaDescPartes.push(`Energia: ${formData.energia_regularidade}`);
      if (formData.servicos_basicos_gerais) {
        moradiaDescPartes.push(`Serviços Básicos Gerais: ${formData.servicos_basicos_gerais}`);
      }
      if (formData.quantidade_filhos !== '' && Number(formData.quantidade_filhos) >= 0) {
        moradiaDescPartes.push(`Filhos: ${formData.quantidade_filhos}`);
      }

      // Armazena a string exata da Faixa de Renda selecionada
      const faixaRendaString = formData.faixa_renda || 'Sem Renda (R$ 0)';
      moradiaDescPartes.push(`Faixa de Renda: ${faixaRendaString}`);

      if (formData.observacoes_moradia.trim()) {
        moradiaDescPartes.push(`Obs: ${formData.observacoes_moradia.trim()}`);
      }
      const tipoMoradiaFinal = moradiaDescPartes.join(' | ');

      // Mapeamento numérico seguro para a coluna numeric do Supabase
      let rendaNumerica = 0;
      if (faixaRendaString === 'Sem Renda (R$ 0)') rendaNumerica = 0;
      else if (faixaRendaString === 'Até R$ 600') rendaNumerica = 600;
      else if (faixaRendaString === 'De R$ 601 a R$ 1.200') rendaNumerica = 1200;
      else if (faixaRendaString === 'De R$ 1.201 a R$ 2.000') rendaNumerica = 2000;
      else if (faixaRendaString === 'De R$ 2.001 a R$ 3.500') rendaNumerica = 3500;
      else if (faixaRendaString === 'De R$ 3.501 a R$ 5.000') rendaNumerica = 5000;
      else if (faixaRendaString === 'Acima de R$ 5.000') rendaNumerica = 6000;
      else rendaNumerica = Number(formData.renda_aproximada_valor) || 0;

      // 9. Composição Familiar
      const finalComposicaoFamiliar =
        formData.mora_sozinho || formData.em_situacao_rua || formData.composicao_familiar === ''
          ? 1
          : Math.max(1, Number(formData.composicao_familiar));

      // 10. Sanitização de CPF e RG
      const cleanCpf = formData.cpf.trim() ? formatCPF(formData.cpf).slice(0, 14) : null;
      const cleanRg = formData.rg.trim() ? formatRG(formData.rg) : null;

      // 11. Sanitizador universal estrito para campos TEXT[] do banco
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

      // 12. Obter usuário autenticado atual via Supabase Auth
      let authUserId: string | null = null;
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user?.id) {
          authUserId = authData.user.id;
        }
      } catch {
        authUserId = null;
      }

      // Montagem do Payload consolidando 100% dos dados das 5 abas mantidos em memória local (useState)
      const payload: Record<string, any> = {
        // Aba 1 - Identificação e Contato
        nome_completo: formData.nome_completo.trim(),
        rg: cleanRg,
        cpf: cleanCpf,
        data_nascimento: formData.data_nascimento || null,
        idade: formData.idade === '' ? null : Number(formData.idade),
        raca_cor: formData.raca_cor || 'Não informado',
        telefone: formData.telefone.trim() || null,
        endereco: formData.endereco.trim() || null,
        bairro: formData.bairro.trim() || null,
        escolaridade: formData.escolaridade,
        estado_civil: formData.estado_civil,
        possui_cadastro_flh: formData.possui_cadastro_flh,
        possui_cras: formData.possui_cras,
        bairro_cras: formData.possui_cras ? formData.bairro_cras.trim() || null : null,
        data_ingresso: formData.data_ingresso || new Date().toISOString().split('T')[0],
        foto_url: finalFotoUrl,

        // Aba 2 - Trabalho, Renda e Programas Sociais
        atividade_remunerada: formData.atividade_remunerada,
        profissao: profissaoFinal,
        renda_familiar_aproximada: rendaNumerica,
        beneficios_sociais: sanitizeStringArray(programasSociaisArray, ['Nenhum']),

        // Aba 3 - Moradia, Composição Familiar e Infraestrutura
        composicao_familiar: finalComposicaoFamiliar,
        acesso_internet: formData.acesso_internet,
        tipo_moradia: tipoMoradiaFinal,
        servicos_basicos_regulares: formData.servicos_basicos_gerais === 'Sim',

        // Aba 4 - Vulnerabilidades e Saúde da Família (Seção 11)
        dificuldades_enfrentadas: sanitizeStringArray(formData.dificuldades_familia, ['Nenhuma']),
        rede_apoio: formData.rede_apoio_principal,
        fatores_risco_evasao: sanitizeStringArray(formData.fatores_risco_evasao, ['Nenhum']),
        possui_deficiencia: formData.saude_deficiencia,
        tipos_deficiencia: sanitizeStringArray(tiposDeficienciaArray, ['Nenhuma']),
        doencas_cronicas_familia: sanitizeStringArray(doencasCronicasFamiliaArray, ['Nenhuma condição registrada']),
        servicos_acompanhamento: sanitizeStringArray(formData.servicos_flh_utilizados, ['Nenhum / Nunca utilizou']),

        // Aba 5 - Motivações, Percepção da FLH e Expectativas (Seção 12)
        motivo_busca: formData.motivo_busca_momento.trim() || null,
        expectativa_curso: expectativaCursoFinal,
        objetivo_profissional_3_meses:
          formData.objetivo_profissional_3_meses.trim() || null,
        curso_pretendido: formData.oficina_pretendida,
        cursos_anteriores: sanitizeStringArray(cursosAnterioresArray, ['Não participou de cursos anteriores']),
        status_curso: formData.status_acompanhamento || formData.status_atendimento || 'Ativo / Em Acompanhamento'
      };

      if (authUserId) {
        payload.criado_por = authUserId;
        payload.atualizado_por = authUserId;
      }

      // Execução única e exclusiva na Aba 5
      const { error } = await supabase.from('assistidos').insert([payload]);

      if (error) {
        throw error;
      }

      setSuccessData({
        nome: formData.nome_completo.trim(),
        cpf: formData.cpf.trim() || 'Não informado',
        oficina: formData.oficina_pretendida || 'Geral'
      });
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Erro ao salvar cadastro:', err);
      if (err.message?.includes('assistidos_cpf_key')) {
        setErrorMsg('Este CPF já está cadastrado no sistema. Verifique os registros no Painel Geral para evitar duplicidades.');
      } else {
        setErrorMsg(
          err.message ||
            'Não foi possível registrar o cadastro no momento. Por favor, verifique os campos e tente novamente.'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Configuração das 5 Abas do Formulário Oficial FLH
  const tabsConfig = [
    {
      id: 1,
      title: 'Identificação e Contato',
      shortTitle: '1. Identificação',
      description: 'Foto, dados civis e CRAS',
      icon: User
    },
    {
      id: 2,
      title: 'Trabalho, Renda e Programas Sociais',
      shortTitle: '2. Trabalho & Renda',
      description: 'Ocupação, dias, faixa de renda e benefícios',
      icon: Briefcase
    },
    {
      id: 3,
      title: 'Moradia, Composição Familiar e Infraestrutura',
      shortTitle: '3. Moradia & Família',
      description: 'Composição, filhos, internet e água/energia',
      icon: Home
    },
    {
      id: 4,
      title: 'Vulnerabilidades e Saúde da Família',
      shortTitle: '4. Saúde & Vulnerabilidades',
      description: 'Seção 11: Condições crônicas, remédios e apoio',
      icon: HeartPulse
    },
    {
      id: 5,
      title: 'Motivações, Percepção da FLH e Expectativas',
      shortTitle: '5. Motivações & FLH',
      description: 'Seção 12: Oficinas, percepção da FLH e 3 meses',
      icon: GraduationCap
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20 pt-6 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb e Título */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400 mb-1">
              <Link to="/dashboard" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition">
                Início
              </Link>
              <span>/</span>
              <span className="text-gray-800 dark:text-slate-200 font-medium">Novo Cadastro</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight">
              Avaliação Socioeconômica e Pedagógica
            </h1>
            <p className="text-gray-600 dark:text-slate-400 text-sm mt-1">
              Formulário Oficial de Acolhimento em 5 Etapas - Fundação Lar Harmonia
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition shadow-2xs"
            >
              <LayoutDashboard className="w-4 h-4 text-gray-500 dark:text-slate-400" />
              Painel Geral
            </Link>
          </div>
        </div>

        {/* Modal de Sucesso em Destaque */}
        {successData && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 text-center shadow-2xl border border-gray-100 dark:border-slate-700 animate-in zoom-in-95 space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight">
                  Ficha Cadastrada com Sucesso!
                </h3>
                <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
                  Todas as 5 áreas da avaliação socioeconômica e pedagógica foram consolidadas e salvas com sucesso no banco de dados.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-slate-700/60 rounded-2xl p-4 border border-gray-200/80 dark:border-slate-600 text-left space-y-2 text-xs">
                <div>
                  <span className="text-gray-400 dark:text-slate-400 block font-semibold">Assistido(a):</span>
                  <span className="font-bold text-gray-900 dark:text-white text-sm">{successData.nome}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200/50 dark:border-slate-600">
                  <div>
                    <span className="text-gray-400 dark:text-slate-400 block font-semibold">CPF:</span>
                    <span className="font-medium text-gray-800 dark:text-slate-200">{successData.cpf}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-400 dark:text-slate-400 block font-semibold">Oficina Vinculada:</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">{successData.oficina}</span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-gray-400 dark:text-slate-400 flex items-center justify-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                Redirecionando para o Dashboard em <strong className="text-emerald-700 dark:text-emerald-400 font-bold">{redirectCountdown}s</strong>...
              </div>

              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Ver no Dashboard Agora
                </button>

                <button
                  type="button"
                  onClick={handleResetForm}
                  className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  Cadastrar Novo Assistido
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Card de Erro */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-2xl shadow-xs flex items-center justify-between text-red-800 dark:text-red-300 animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium">{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="text-xs text-red-600 dark:text-red-400 font-bold hover:underline ml-4 cursor-pointer"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Abas e Barra de Progresso em 5 Etapas com Rolagem Suave no Mobile */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs mb-8 overflow-x-auto whitespace-nowrap scrollbar-thin">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 dark:divide-slate-700 min-w-[340px] sm:min-w-0">
            {tabsConfig.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              const isPast = activeTab > tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setActiveTab(tab.id);
                  }}
                  className={`p-3.5 text-left transition flex items-center gap-3 cursor-pointer ${
                    isActive
                      ? 'bg-emerald-50/90 dark:bg-emerald-950/50 border-b-2 lg:border-b-0 lg:border-l-4 border-emerald-600 dark:border-emerald-500'
                      : 'hover:bg-gray-50 dark:hover:bg-slate-750'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-xs transition ${
                      isActive
                        ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-xs'
                        : isPast
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="w-4 h-4" /> : <TabIcon className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400">
                      Etapa {tab.id}
                    </span>
                    <span
                      className={`block text-xs font-bold truncate ${
                        isActive ? 'text-emerald-900 dark:text-emerald-300' : 'text-gray-700 dark:text-slate-200'
                      }`}
                    >
                      {tab.shortTitle}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Formulário Principal com as 5 Abas */}
        <form onSubmit={handleSubmit}>
          {activeTab === 1 && (
            <TabIdentificacao
              formData={formData}
              setFormData={setFormData}
              fotoPreview={fotoPreview}
              onFileSelect={handleFileSelect}
              onRemoveFoto={handleRemoveFoto}
            />
          )}

          {activeTab === 2 && (
            <TabTrabalhoRenda formData={formData} setFormData={setFormData} />
          )}

          {activeTab === 3 && (
            <TabMoradiaFamilia formData={formData} setFormData={setFormData} />
          )}

          {activeTab === 4 && (
            <TabVulnerabilidades formData={formData} setFormData={setFormData} />
          )}

          {activeTab === 5 && (
            <TabMotivacoes formData={formData} setFormData={setFormData} />
          )}

          {/* Botões de Navegação Inferior */}
          <div className="mt-8 flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200 dark:border-slate-700">
            <div>
              {activeTab > 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab((prev) => Math.max(1, prev - 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition shadow-2xs cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar para Etapa {activeTab - 1}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Limpar Formulário
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {activeTab < 5 ? (
                <button
                  type="button"
                  onClick={handleNextTab}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Próximo (Aba {activeTab + 1})
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting || !!successData}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 disabled:bg-emerald-400 text-white rounded-xl text-sm font-bold transition shadow-md cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {submitting ? 'Salvando Cadastro...' : 'Concluir e Cadastrar Assistido'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
