# Plataforma de Gestão Social — Fundação Lar Harmonia

> **Projeto de Extensão Universitária** voltado à digitalização, acolhimento socioeconômico e acompanhamento pedagógico de assistidos da **Fundação Lar Harmonia** (Salvador - BA).

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database_%26_Auth-3FCF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=flat-square&logo=vercel)](https://vercel.com/)

---

## Visão Geral do Projeto

A **Fundação Lar Harmonia** realiza um trabalho essencial de assistência social e capacitação profissional em comunidades de alta vulnerabilidade. Historicamente, o registro de atendimentos e avaliações socioeconômicas era realizado por meio de fichas físicas em papel, gerando gargalos operacionais e risco de perda de histórico.

Este sistema foi desenvolvido para **digitalizar 100% o fluxo de acolhimento**, fornecendo uma plataforma web rápida, segura e adaptada ao uso em computadores e smartphones pela equipe de voluntários, assistentes sociais e diretoria.

---

## 🌐 Ambiente de Demonstração (Demo On-line)

Você pode testar a plataforma interativamente em nosso ambiente de testes:

- 🔗 **Link da Demo:** [Acessar Plataforma Demo](https://lar-harmonia-demo.vercel.app/login)  

> **🔑 Credenciais de Acesso para Testes:**
> - **E-mail:** `visitante@larharmonia.org`
> - **Senha:** `senha123`
>
> *Nota de Privacidade e LGPD: O ambiente público de testes utiliza dados 100% fictícios em um banco isolado. Nenhuma informação real de assistidos ou voluntários é exposta.*

---

## Principais Funcionalidades

### 1. Avaliação Socioeconômica e Pedagógica em 5 Etapas
Formulário dinâmico e guiado que abrange a totalidade do protocolo de triagem oficial da fundação:
1. **Identificação Civil e Contato:** Dados pessoais, foto com corte proporcional e vínculo com CRAS.
2. **Trabalho, Renda e Programas Sociais:** Ocupação formal/informal, aposentadoria/pensionista, faixa de renda e benefícios recebidos.
3. **Moradia e Composição Familiar:** Condições habitacionais, saneamento básico, filhos, acesso à internet e lógica adaptativa para situação de rua.
4. **Vulnerabilidades e Saúde Familiar:** Mapeamento de doenças crônicas, uso de medicação contínua, dependência química, saúde mental, deficiências e responsável pela condição.
5. **Motivações e Percepção da FLH:** Seleção de oficina pretendida, metas para 3 meses e percepção do trabalho comunitário.

### 2. Ficha 360° e Acompanhamento do Assistido
- **Visualização Completa e Edição:** Painel centralizado consolidando todo o histórico do assistido.
- **Lightbox de Foto:** Ampliação da foto do assistido em tela cheia com um toque/clique para facilidade de identificação na recepção.
- **Impressão Formatada:** Exportação da ficha pronta para impressão física ou salvamento em PDF.
- **Avaliação de 4 Meses:** Registro de acompanhamento periódico da evolução pedagógica e social do aluno.

### 3. Gestão de Equipe e Controle de Acesso (RBAC)
- **Perfis de Acesso Granulares:**
  - `Admin` (Diretoria): Acesso total a configurações, relatórios e gestão de equipe.
  - `Serviço Social`: Permissão de cadastrar, editar e realizar avaliações de acompanhamento.
  - `Recepção`: Cadastro inicial e consulta rápida de fichas.
- **Desativação de Acesso:** Bloqueio instantâneo de operadores inativos no Supabase com mensagem personalizada exibida na tela de login.

### 4. Responsividade Mobile-First
Layout adaptado para smartphones com abas de rolagem fluida, cabeçalho compacto e botões otimizados para toque.

---

## Tecnologias Utilizadas

- **Front-end:** React 18, TypeScript, Vite, React Router DOM
- **Estilização & UI:** Tailwind CSS, Lucide React (Ícones)
- **Back-end & Banco de Dados:** Supabase (PostgreSQL, Row Level Security - RLS, Auth)
- **Hospedagem & CI/CD:** Vercel

---

## 🤝 Créditos e Agradecimentos

Projeto desenvolvido no âmbito da extensão universitária em parceria com a **Fundação Lar Harmonia**. Agradecimento especial à diretoria e equipe técnica pelo suporte na validação dos fluxos sociais.


---

