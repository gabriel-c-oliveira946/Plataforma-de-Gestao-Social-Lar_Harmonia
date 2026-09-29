import { supabase } from '../lib/supabase/client';
import { Assistido } from '../components/VerFichaModal';

const LOCAL_STORAGE_KEY = 'lar_harmonia_assistidos_store';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function isValidUUID(str?: string): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

// Dados iniciais representativos e realistas da Fundação Lar Harmonia
export const INITIAL_ASSISTIDOS: Assistido[] = [
  {
    id: 'ass-001',
    nome_completo: 'Maria Aparecida Santos de Jesus',
    rg: '12.345.678-90',
    cpf: '123.456.789-01',
    data_nascimento: '1985-04-12',
    idade: 41,
    raca_cor: 'Parda',
    telefone: '(71) 98765-4321',
    endereco: 'Rua das Mangueiras, 45, Casa B',
    bairro: 'Pituaçu',
    escolaridade: 'Ensino Fundamental Incompleto',
    estado_civil: 'Solteira',
    possui_cadastro_flh: true,
    possui_cras: true,
    bairro_cras: 'CRAS Boca do Rio',
    composicao_familiar: 4,
    quantidade_filhos: 3,
    atividade_remunerada: 'Sim',
    profissao: 'Diarista autônoma (3x por semana)',
    acesso_internet: 'Sim, dados móveis no celular',
    tipo_moradia: 'Alugada',
    servicos_basicos_regulares: true,
    dificuldades_enfrentadas: ['Instabilidade de renda'],
    rede_apoio: 'Igreja / Vizinhos',
    fatores_risco_evasao: ['Nenhum'],
    possui_deficiencia: false,
    tipos_deficiencia: ['Nenhuma'],
    doencas_cronicas_familia: ['Hipertensão'],
    servicos_acompanhamento: ['Ambulatório', 'Psicologia'],
    beneficios_sociais: ['Bolsa Família'],
    renda_familiar_aproximada: 1350,
    motivo_busca: 'Capacitação profissional para geração de renda própria e autonomia financeira',
    expectativa_curso: 'Aprender técnicas de modelagem e costura para abrir pequeno ateliê em casa',
    objetivo_profissional_3_meses: 'Comprar máquina de costura e aceitar encomendas no bairro',
    curso_pretendido: 'Costura e Modelagem Criativa',
    cursos_anteriores: ['Não participou de cursos anteriores'],
    status_curso: 'Ativo / Em Acompanhamento',
    data_ingresso: new Date(Date.now() - 135 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    created_at: new Date(Date.now() - 135 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'ass-002',
    nome_completo: 'Carlos Eduardo Oliveira dos Santos',
    rg: '23.456.789-01',
    cpf: '234.567.890-12',
    data_nascimento: '1998-08-23',
    idade: 27,
    raca_cor: 'Preta',
    telefone: '(71) 99123-4567',
    endereco: 'Travessa Santa Luzia, 12',
    bairro: 'Bairro da Paz',
    escolaridade: 'Ensino Médio Completo',
    estado_civil: 'Solteiro',
    possui_cadastro_flh: false,
    possui_cras: false,
    bairro_cras: null,
    composicao_familiar: 3,
    quantidade_filhos: 0,
    atividade_remunerada: 'Não',
    profissao: 'Desempregado',
    acesso_internet: 'Sim, banda larga residencial',
    tipo_moradia: 'Própria',
    servicos_basicos_regulares: true,
    dificuldades_enfrentadas: ['Desemprego'],
    rede_apoio: 'Família',
    fatores_risco_evasao: ['Transporte'],
    possui_deficiencia: false,
    tipos_deficiencia: ['Nenhuma'],
    doencas_cronicas_familia: ['Nenhuma condição registrada'],
    servicos_acompanhamento: ['SAC'],
    beneficios_sociais: ['Nenhum'],
    renda_familiar_aproximada: 800,
    motivo_busca: 'Inserção no mercado formal de trabalho através de tecnologia',
    expectativa_curso: 'Dominar ferramentas de informática, planilhas e atendimento ao cliente',
    objetivo_profissional_3_meses: 'Conseguir vaga de jovem aprendiz ou assistente administrativo',
    curso_pretendido: 'Informática Básica e Administrativa',
    cursos_anteriores: ['Não participou de cursos anteriores'],
    status_curso: 'Ativo / Em Acompanhamento',
    data_ingresso: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'ass-003',
    nome_completo: 'Francisca Pereira de Lima',
    rg: '34.567.890-12',
    cpf: '345.678.901-23',
    data_nascimento: '1979-11-05',
    idade: 46,
    raca_cor: 'Parda',
    telefone: '(71) 98888-7766',
    endereco: 'Avenida São Jorge, 102',
    bairro: 'São Cristóvão',
    escolaridade: 'Ensino Fundamental Completo',
    estado_civil: 'Casada',
    possui_cadastro_flh: true,
    possui_cras: true,
    bairro_cras: 'CRAS Itapuã',
    composicao_familiar: 5,
    quantidade_filhos: 3,
    atividade_remunerada: 'Sim',
    profissao: 'Vendedora de bolos caseiros',
    acesso_internet: 'Sim, Wi-Fi comunitário',
    tipo_moradia: 'Cedida',
    servicos_basicos_regulares: true,
    dificuldades_enfrentadas: ['Cuidado com dependentes'],
    rede_apoio: 'Família e Vizinhos',
    fatores_risco_evasao: ['Nenhum'],
    possui_deficiencia: false,
    tipos_deficiencia: ['Nenhuma'],
    doencas_cronicas_familia: ['Diabetes tipo 2'],
    servicos_acompanhamento: ['Ambulatório', 'Programas Sociais'],
    beneficios_sociais: ['Bolsa Família'],
    renda_familiar_aproximada: 1900,
    motivo_busca: 'Aperfeiçoamento na área de panificação e confeitaria',
    expectativa_curso: 'Aprender técnicas profissionais de massas e decoração para aumentar vendas | [Avaliação 4 Meses - 2026-08-15] Status: Concluiu Oficina | Impacto: Aumentou Renda em Casa | Depoimento: Conseguiu triplicar as encomendas de doces e salgados para festas no bairro.',
    objetivo_profissional_3_meses: 'Formalizar como MEI e criar catálogo digital',
    curso_pretendido: 'Confeitaria e Panificação Artesanal',
    cursos_anteriores: ['Confeitaria Básica'],
    status_curso: 'Concluído',
    data_ingresso: new Date(Date.now() - 160 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    created_at: new Date(Date.now() - 160 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'ass-004',
    nome_completo: 'Antônio Marcos Ferreira',
    rg: '45.678.901-23',
    cpf: '456.789.012-34',
    data_nascimento: '1992-02-18',
    idade: 34,
    raca_cor: 'Preta',
    telefone: '(71) 99444-3322',
    endereco: 'Rua da Paz, 88',
    bairro: 'Itapuã',
    escolaridade: 'Ensino Médio Incompleto',
    estado_civil: 'Divorciado',
    possui_cadastro_flh: true,
    possui_cras: false,
    bairro_cras: null,
    composicao_familiar: 2,
    quantidade_filhos: 1,
    atividade_remunerada: 'Sim',
    profissao: 'Ajudante geral',
    acesso_internet: 'Sim, dados móveis',
    tipo_moradia: 'Alugada',
    servicos_basicos_regulares: true,
    dificuldades_enfrentadas: ['Instabilidade financeira'],
    rede_apoio: 'Amigos',
    fatores_risco_evasao: ['Horário flexível'],
    possui_deficiencia: false,
    tipos_deficiencia: ['Nenhuma'],
    doencas_cronicas_familia: ['Nenhuma condição registrada'],
    servicos_acompanhamento: ['Psicologia'],
    beneficios_sociais: ['Nenhum'],
    renda_familiar_aproximada: 1100,
    motivo_busca: 'Aprender profissão de barbeiro para atuar profissionalmente',
    expectativa_curso: 'Adquirir prática em cortes modernos e atendimento ao cliente',
    objetivo_profissional_3_meses: 'Alugar cadeira em barbearia ou atender em domicílio',
    curso_pretendido: 'Barbearia e Corte Masculino',
    cursos_anteriores: ['Não participou de cursos anteriores'],
    status_curso: 'Ativo / Em Acompanhamento',
    data_ingresso: new Date(Date.now() - 125 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    created_at: new Date(Date.now() - 125 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'ass-005',
    nome_completo: 'Luciana Barbosa da Silva',
    rg: '56.789.012-34',
    cpf: '567.890.123-45',
    data_nascimento: '1990-09-14',
    idade: 35,
    raca_cor: 'Branca',
    telefone: '(71) 98111-2233',
    endereco: 'Rua Direta de Nova Brasília, 340',
    bairro: 'Nova Brasília',
    escolaridade: 'Ensino Médio Completo',
    estado_civil: 'Casada',
    possui_cadastro_flh: false,
    possui_cras: true,
    bairro_cras: 'CRAS Pau da Lima',
    composicao_familiar: 4,
    quantidade_filhos: 2,
    atividade_remunerada: 'Não',
    profissao: 'Dona de casa',
    acesso_internet: 'Sim, Wi-Fi',
    tipo_moradia: 'Própria',
    servicos_basicos_regulares: true,
    dificuldades_enfrentadas: ['Cuidados com a família'],
    rede_apoio: 'Família',
    fatores_risco_evasao: ['Nenhum'],
    possui_deficiencia: false,
    tipos_deficiencia: ['Nenhuma'],
    doencas_cronicas_familia: ['Nenhuma condição registrada'],
    servicos_acompanhamento: ['Jurídico', 'Ambulatório'],
    beneficios_sociais: ['Bolsa Família'],
    renda_familiar_aproximada: 2100,
    motivo_busca: 'Capacitação na área de cuidados e saúde preventiva',
    expectativa_curso: 'Tornar-se cuidadora de idosos profissional certificada',
    objetivo_profissional_3_meses: 'Conseguir contratação com carteira assinada ou plantões',
    curso_pretendido: 'Cuidador de Idosos e Primeiros Socorros',
    cursos_anteriores: ['Primeiros Socorros Básico'],
    status_curso: 'Ativo / Em Acompanhamento',
    data_ingresso: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  }
];

function getStoredAssistidos(): Assistido[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Erro ao ler localStorage de assistidos:', err);
  }
  saveStoredAssistidos(INITIAL_ASSISTIDOS);
  return INITIAL_ASSISTIDOS;
}

function saveStoredAssistidos(items: Assistido[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn('Erro ao salvar no localStorage de assistidos:', err);
  }
}

export const assistidosService = {
  // 1. Obter todos os assistidos com fallback seguro
  async getAll(): Promise<Assistido[]> {
    try {
      const hasUrl = typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL;
      if (hasUrl) {
        const { data, error } = await supabase
          .from('assistidos')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          saveStoredAssistidos(data);
          return data;
        }
      }
    } catch (err) {
      console.warn('Supabase não acessível, utilizando banco de dados local com sucesso:', err);
    }
    return getStoredAssistidos();
  },

  // 2. Inserir novo assistido
  async insert(item: Record<string, any>): Promise<Assistido> {
    const isProvidedIdValid = isValidUUID(item.id);
    const generatedId = generateUUID();
    const newId = isProvidedIdValid ? item.id : generatedId;
    const nowIso = new Date().toISOString();
    const fullRecord: Assistido = {
      ...(item as Assistido),
      id: newId,
      created_at: item.created_at || nowIso,
      updated_at: item.updated_at || nowIso,
      nome_completo: item.nome_completo || ''
    };

    const hasUrl = typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL;
    if (hasUrl) {
      // Cria o payload limpo para o Supabase
      const supabasePayload: Record<string, any> = { ...fullRecord };
      // Se não for um UUID válido fornecido explicitamente, omitimos o campo 'id'
      // para permitir que o PostgreSQL gere o UUID automaticamente via gen_random_uuid()
      if (!isProvidedIdValid) {
        delete supabasePayload.id;
      }

      const { data, error } = await supabase.from('assistidos').insert([supabasePayload]).select();
      if (error) {
        console.error('Erro ao inserir assistido no Supabase:', error);
        throw new Error(error.message || 'Erro ao registrar assistido no Supabase.');
      }
      if (data && data[0]) {
        const current = getStoredAssistidos();
        saveStoredAssistidos([data[0], ...current.filter((a) => a.id !== data[0].id)]);
        return data[0];
      }
    }

    // Salva localmente caso não haja conexão/URL do Supabase configurada
    const current = getStoredAssistidos();
    const updated = [fullRecord, ...current.filter((a) => a.id !== fullRecord.id)];
    saveStoredAssistidos(updated);
    return fullRecord;
  },

  // 3. Atualizar assistido existente
  async update(id: string, updates: Record<string, any>): Promise<Assistido> {
    const nowIso = new Date().toISOString();
    let updatedRecord: Assistido | null = null;

    try {
      const hasUrl = typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL;
      if (hasUrl && isValidUUID(id)) {
        const { data, error } = await supabase
          .from('assistidos')
          .update({ ...updates, updated_at: nowIso })
          .eq('id', id)
          .select();

        if (!error && data && data[0]) {
          updatedRecord = data[0];
        }
      }
    } catch (err) {
      console.warn('Supabase indisponível no update, atualizando localmente:', err);
    }

    const current = getStoredAssistidos();
    const existing = current.find((a) => a.id === id);
    if (!updatedRecord) {
      updatedRecord = {
        ...(existing || ({} as Assistido)),
        ...updates,
        id,
        updated_at: nowIso
      } as Assistido;
    }

    const newStore = current.map((a) => (a.id === id ? updatedRecord! : a));
    saveStoredAssistidos(newStore);
    return updatedRecord;
  },

  // 4. Excluir assistido
  async delete(id: string): Promise<void> {
    const hasUrl = typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL;
    if (hasUrl) {
      const { error } = await supabase.from('assistidos').delete().eq('id', id);
      if (error) {
        console.error('Erro ao excluir assistido no Supabase:', error);
        throw new Error(error.message);
      }
    }

    // Apenas remova o registro do localStorage se o Supabase confirmar a exclusão com sucesso.
    const current = getStoredAssistidos();
    saveStoredAssistidos(current.filter((a) => a.id !== id));
  }
};
