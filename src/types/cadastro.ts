export interface ItemCondicaoSaude {
  id: string;
  parentesco_tipo: 'assistido' | 'familiar';
  parentesco_nome: string; // Ex: Mãe, Filho, Cônjuge
  nome_doenca: string; // Nome / Descrição da Doença ou Condição
  medicamento: string; // Medicamento / Como Adquire / Tratamento
  observacoes: string; // Explicações e Observações
}

export interface CadastroFormData {
  // Aba 1 - Identificação Civil e Contato
  nome_completo: string;
  data_nascimento: string;
  idade: number | string;
  rg: string;
  cpf: string;
  telefone: string;
  escolaridade: string;
  estado_civil: string;
  raca_cor: string;
  endereco: string;
  bairro: string;
  em_situacao_rua: boolean;
  foto_url: string | null;
  possui_cadastro_flh: boolean;
  possui_cras: boolean;
  bairro_cras: string;
  data_ingresso: string; // Data de Ingresso / Entrada no Lar Harmonia (YYYY-MM-DD)
  status_acompanhamento: 'Ativo / Em Acompanhamento' | 'Concluído' | 'Desistente / Evasão' | 'Pausado';
  data_saida?: string; // Data de Saída / Desligamento (YYYY-MM-DD, opcional)
  motivo_evasao?: string; // Motivo da Evasão / Desistência (opcional / quando evasão)

  // Aba 2 - Trabalho, Renda e Benefícios
  atividade_remunerada: 'Sim' | 'Não' | 'Aposentado(a) / Pensionista' | string;
  ocupacao_atual: string; // Ocupação / Ramo
  turno_trabalho: string; // Manhã, Tarde, Noite, Integral
  dias_semana_trabalho_array: string[]; // ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
  dias_semana_trabalho?: string;
  desemprego_circunstancia: string; // Causa do Desemprego/Sem Renda
  trabalhou_anteriormente: 'Sim' | 'Não';
  area_trabalho_anterior: string;
  faixa_renda: string; // Texto exato da Faixa
  renda_aproximada_valor: number | string;
  programas_sociais: string[];
  outro_programa_social: string;

  // Aba 3 - Moradia e Composição Familiar
  composicao_familiar: number | string; // Pessoas no domicílio (padrão 1)
  mora_sozinho: boolean; // "Mora sozinho / Em situação de rua"
  quantidade_filhos: number | string; // padrão 0
  acesso_internet: 'Sim' | 'Não';
  tipo_moradia: string; // Própria, Cedida, Alugada, Em situação de rua, etc.
  agua_regularidade: 'Regular' | 'Irregular';
  energia_regularidade: 'Regular' | 'Irregular';
  servicos_basicos_gerais: 'Sim' | 'Parcialmente' | 'Irregular';
  observacoes_moradia: string;

  // Aba 4 - Vulnerabilidades e Saúde Familiar
  dificuldades_familia: string[];

  // Listas estruturadas de saúde com suporte a múltiplos itens por categoria
  saude_doencas_cronicas_lista?: ItemCondicaoSaude[];
  saude_dependencia_quimica_lista?: ItemCondicaoSaude[];
  saude_mental_lista?: ItemCondicaoSaude[];
  saude_deficiencia_lista?: ItemCondicaoSaude[];
  saude_outra_situacao_lista?: ItemCondicaoSaude[];

  // Saúde da família com parentesco, diagnóstico, medicamento e observações (legado/fallback)
  saude_doenca_cronica: boolean;
  saude_doenca_cronica_parentesco: string;
  saude_doenca_cronica_nome?: string;
  saude_doenca_cronica_medicamento: string;
  saude_doenca_cronica_obs?: string;
  saude_doenca_cronica_detalhe: string;

  saude_dependencia_quimica: boolean;
  saude_dependencia_quimica_parentesco: string;
  saude_dependencia_quimica_nome?: string;
  saude_dependencia_quimica_medicamento: string;
  saude_dependencia_quimica_obs?: string;
  saude_dependencia_quimica_detalhe: string;

  saude_mental: boolean;
  saude_mental_parentesco: string;
  saude_mental_nome?: string;
  saude_mental_medicamento: string;
  saude_mental_obs?: string;
  saude_mental_detalhe: string;

  saude_deficiencia: boolean;
  saude_deficiencia_parentesco: string;
  saude_deficiencia_nome?: string;
  saude_deficiencia_medicamento: string;
  saude_deficiencia_obs?: string;
  saude_deficiencia_detalhe: string;

  saude_outra_situacao: boolean;
  saude_outra_situacao_parentesco: string;
  saude_outra_situacao_nome?: string;
  saude_outra_situacao_medicamento: string;
  saude_outra_situacao_obs?: string;
  saude_outra_situacao_detalhe: string;

  rede_apoio_principal: string;
  fatores_risco_evasao: string[];
  servicos_flh_utilizados: string[];

  // Aba 5 - Motivações e Percepção da FLH
  motivo_busca_momento: string;
  oficina_pretendida: string;
  curso_e_preferencia: 'Sim' | 'Não';
  curso_preferencia_outro: string;
  o_que_pretende_fazer: string[];
  o_que_pretende_outro: string;
  participou_cursos_anteriores: 'Sim' | 'Não';
  cursos_anteriores_concluiu: 'Sim' | 'Não' | '';
  cursos_anteriores_detalhes: string;
  objetivo_profissional_3_meses: string;
  representacao_flh_familia: string;
  percepcao_flh_hoje: string[]; // Apoio emocional, Apoio material, Referência comunitária, Pouco contato, Outro
  percepcao_flh_outro: string;
  interesse_outras_oficinas: string;
  nao_tem_interesse_outras_oficinas: boolean;
  status_atendimento: string;
}

export const INITIAL_CADASTRO_FORM: CadastroFormData = {
  // Aba 1
  nome_completo: '',
  data_nascimento: '',
  idade: '',
  rg: '',
  cpf: '',
  telefone: '',
  escolaridade: 'Não informado',
  estado_civil: 'Não informado',
  raca_cor: 'Não informado',
  endereco: '',
  bairro: '',
  em_situacao_rua: false,
  foto_url: null,
  possui_cadastro_flh: false,
  possui_cras: false,
  bairro_cras: '',
  data_ingresso: new Date().toISOString().split('T')[0],
  status_acompanhamento: 'Ativo / Em Acompanhamento',
  data_saida: '',
  motivo_evasao: '',

  // Aba 2
  atividade_remunerada: 'Não',
  ocupacao_atual: '',
  turno_trabalho: 'Manhã',
  dias_semana_trabalho_array: [],
  dias_semana_trabalho: '',
  desemprego_circunstancia: '',
  trabalhou_anteriormente: 'Sim',
  area_trabalho_anterior: '',
  faixa_renda: 'Sem Renda (R$ 0)',
  renda_aproximada_valor: 0,
  programas_sociais: ['Nenhum'],
  outro_programa_social: '',

  // Aba 3
  composicao_familiar: 1,
  mora_sozinho: false,
  quantidade_filhos: 0,
  acesso_internet: 'Não',
  tipo_moradia: 'Não informado',
  agua_regularidade: 'Regular',
  energia_regularidade: 'Regular',
  servicos_basicos_gerais: 'Sim',
  observacoes_moradia: '',

  // Aba 4
  dificuldades_familia: ['Nenhuma'],
  saude_doencas_cronicas_lista: [],
  saude_dependencia_quimica_lista: [],
  saude_mental_lista: [],
  saude_deficiencia_lista: [],
  saude_outra_situacao_lista: [],

  saude_doenca_cronica: false,
  saude_doenca_cronica_parentesco: 'O próprio assistido',
  saude_doenca_cronica_nome: '',
  saude_doenca_cronica_medicamento: '',
  saude_doenca_cronica_obs: '',
  saude_doenca_cronica_detalhe: '',

  saude_dependencia_quimica: false,
  saude_dependencia_quimica_parentesco: 'O próprio assistido',
  saude_dependencia_quimica_nome: '',
  saude_dependencia_quimica_medicamento: '',
  saude_dependencia_quimica_obs: '',
  saude_dependencia_quimica_detalhe: '',

  saude_mental: false,
  saude_mental_parentesco: 'O próprio assistido',
  saude_mental_nome: '',
  saude_mental_medicamento: '',
  saude_mental_obs: '',
  saude_mental_detalhe: '',

  saude_deficiencia: false,
  saude_deficiencia_parentesco: 'O próprio assistido',
  saude_deficiencia_nome: '',
  saude_deficiencia_medicamento: '',
  saude_deficiencia_obs: '',
  saude_deficiencia_detalhe: '',

  saude_outra_situacao: false,
  saude_outra_situacao_parentesco: 'O próprio assistido',
  saude_outra_situacao_nome: '',
  saude_outra_situacao_medicamento: '',
  saude_outra_situacao_obs: '',
  saude_outra_situacao_detalhe: '',

  rede_apoio_principal: 'Família',
  fatores_risco_evasao: ['Nenhum'],
  servicos_flh_utilizados: ['Nenhum / Nunca utilizou'],

  // Aba 5
  motivo_busca_momento: '',
  oficina_pretendida: 'Informática',
  curso_e_preferencia: 'Sim',
  curso_preferencia_outro: '',
  o_que_pretende_fazer: ['Buscar emprego com carteira assinada'],
  o_que_pretende_outro: '',
  participou_cursos_anteriores: 'Não',
  cursos_anteriores_concluiu: '',
  cursos_anteriores_detalhes: '',
  objetivo_profissional_3_meses: '',
  representacao_flh_familia: '',
  percepcao_flh_hoje: [],
  percepcao_flh_outro: '',
  interesse_outras_oficinas: '',
  nao_tem_interesse_outras_oficinas: false,
  status_atendimento: 'Em Acompanhamento'
};

export const ESCOLARIDADES = [
  'Não Alfabetizado',
  'Ensino Fundamental Incompleto',
  'Ensino Fundamental Completo',
  'Ensino Médio Incompleto',
  'Ensino Médio Completo',
  'Ensino Superior Incompleto',
  'Ensino Superior Completo',
  'Pós-graduação',
  'Não informado'
];

export const ESTADOS_CIVIS = [
  'Solteiro(a)',
  'Casado(a)',
  'União Estável',
  'Separado(a) / Divorciado(a)',
  'Viúvo(a)',
  'Não informado'
];

export const RACAS_OPCOES = [
  'Não informado',
  'Parda',
  'Preta',
  'Branca',
  'Amarela',
  'Indígena'
];

export const DIAS_SEMANA_OPCOES = [
  'Seg',
  'Ter',
  'Qua',
  'Qui',
  'Sex',
  'Sáb',
  'Dom'
];

export const TURNOS_OPCOES = [
  'Manhã',
  'Tarde',
  'Noite',
  'Integral'
];

export const FAIXAS_RENDA = [
  'Sem Renda (R$ 0)',
  'Até R$ 600',
  'De R$ 601 a R$ 1.200',
  'De R$ 1.201 a R$ 2.000',
  'De R$ 2.001 a R$ 3.500',
  'De R$ 3.501 a R$ 5.000',
  'Acima de R$ 5.000'
];

export const PROGRAMAS_SOCIAIS_OPCOES = [
  'Bolsa Família',
  'BPC',
  'Outro',
  'Nenhum'
];

export const TIPOS_MORADIA = [
  'Própria',
  'Cedida',
  'Alugada',
  'Situação de Rua / Sem Moradia Fixa',
  'Não informado'
];

export const OFICINAS_FLH = [
  'Informática',
  'Corte e Costura',
  'Manicure',
  'Cabeleireiro',
  'Tranças / Design de Unhas',
  'Barbeiro',
  'Massoterapia',
  'Pilates',
  'Crochê / Artesanato',
  'Inglês',
  'Balé / Capoeira',
  'Nenhuma Oficina (Apenas Acompanhamento)'
];

export const REDES_APOIO = [
  'Família',
  'Amigos',
  'Vizinhos',
  'Serviços públicos',
  'Ninguém'
];

export const DIFICULDADES_OPCOES = [
  'Desemprego',
  'Baixa renda',
  'Moradia precária',
  'Acesso limitado a saúde',
  'Sobrecarga de cuidados',
  'Violência',
  'Vínculo familiar rompido / Sem contato',
  'Nenhuma'
];

export const FATORES_EVASAO_OPCOES = [
  'Transporte / Distância',
  'Horário incompatível',
  'Saúde fragilizada',
  'Cuidado infantil / Dependentes',
  'Violência no território',
  'Trabalho / Emprego novo',
  'Nenhum'
];

export const SERVICOS_FLH_OPCOES = [
  'Ambulatório',
  'Psicologia',
  'Jurídico',
  'SAC',
  'Programa Crianças/Adolescentes',
  'Programa Idosos',
  'Nenhum / Nunca utilizou'
];

export const PRETENDER_FAZER_OPCOES = [
  'Buscar emprego com carteira assinada',
  'Iniciar pequeno negócio / Empreender',
  'Aprimorar renda em casa / Bicos',
  'Aprimorar conhecimento pessoal / Hobby',
  'Outro'
];

export const PERCEPCAO_FLH_OPCOES = [
  'Apoio emocional',
  'Apoio material',
  'Referência comunitária',
  'Pouco contato',
  'Outro'
];

export const STATUS_ACOMPANHAMENTO_OPCOES = [
  'Ativo / Em Acompanhamento',
  'Concluído',
  'Desistente / Evasão',
  'Pausado'
] as const;

export interface Avaliacao4MesesData {
  data_avaliacao: string; // YYYY-MM-DD
  status_final_curso: 'Concluiu Oficina' | 'Desistiu (Evasão)' | 'Continua em Acompanhamento';
  motivo_evasao?: string;
  impacto_gerado:
    | 'Conseguiu Emprego'
    | 'Abriu Pequeno Negócio'
    | 'Aumentou Renda em Casa'
    | 'Sem Alteração Renda'
    | 'Outro';
  mudanca_autonomia_qualidade_vida: string; // Depoimento / Observações
}

