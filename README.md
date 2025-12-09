# Finance Dashboard (Minha Carteira) 🚧 EM DESENVOLVIMENTO

> **Status do Projeto:** 🚧 Desenvolvimento ativo  
> Este é um projeto em construção. Funcionalidades estão sendo implementadas progressivamente.

Sistema completo de gestão financeira pessoal desenvolvido com NestJS (Backend) e React (Frontend), permitindo o controle de entradas, saídas, orçamentos e geração de relatórios.

## 📋 Visão Geral

Este projeto é uma aplicação full-stack para gestão financeira pessoal, composta por:

- **API REST** desenvolvida com NestJS ⚙️ Em desenvolvimento
- **Interface Web** desenvolvida com React e TypeScript 📱 Planejado
- **Banco de Dados** PostgreSQL com Prisma ORM 🗄️ Em desenvolvimento
- **Autenticação** JWT com Passport 🔐 Em desenvolvimento

## 🎯 Roadmap de Desenvolvimento

### Backend (API) - 🚧 Em andamento
- [x] Configuração inicial do projeto NestJS
- [x] Configuração do Prisma e banco de dados
- [x] Módulo de autenticação (JWT)
- [x] Módulo de entradas (Gains)
- [x] Módulo de despesas (Expenses) com suporte a parcelas
- [x] Módulo de orçamentos (Budgets)
- [x] Módulo de relatórios (PDF e Excel)
- [ ] Testes unitários
- [ ] Documentação com Swagger
- [ ] Rate limiting
- [ ] Refresh tokens

### Frontend (Web) - 📋 Planejado
- [ ] Configuração inicial React + TypeScript
- [ ] Sistema de autenticação
- [ ] Dashboard com gráficos
- [ ] CRUD de entradas e despesas
- [ ] Gerenciamento de orçamentos
- [ ] Geração de relatórios
- [ ] Tema claro/escuro

## 🚀 Tecnologias

### Backend (API)
- **NestJS** - Framework Node.js progressivo
- **TypeScript** - Superset do JavaScript
- **Prisma** - ORM moderno para TypeScript
- **PostgreSQL** - Banco de dados relacional
- **JWT** - Autenticação baseada em tokens
- **Passport** - Middleware de autenticação (Local e JWT strategies)
- **bcryptjs** - Hash de senhas
- **class-validator** - Validação de DTOs
- **PDFKit** - Geração de relatórios em PDF
- **XLSX** - Geração de relatórios em Excel

### Frontend (Web) - Planejado
- **React** - Biblioteca JavaScript para interfaces
- **TypeScript** - Tipagem estática
- **Styled Components** - CSS-in-JS
- **React Router DOM** - Roteamento
- **Axios** - Cliente HTTP
- **Recharts** - Bibliotecas de gráficos

## 📁 Estrutura do Projeto

```
finance-dashboard/
├── api/                    # Backend (NestJS) 🚧
│   ├── prisma/            # Configuração do banco de dados
│   │   ├── schema.prisma  # Schema do Prisma
│   │   └── seed.ts        # Seed do banco de dados
│   ├── src/
│   │   ├── auth/          # Módulo de autenticação ✅
│   │   ├── gains/         # Módulo de entradas ✅
│   │   ├── expenses/      # Módulo de despesas ✅
│   │   ├── budgets/       # Módulo de orçamentos ✅
│   │   ├── reports/       # Módulo de relatórios ✅
│   │   ├── prisma/        # Serviço Prisma ✅
│   │   ├── app.module.ts  # Módulo principal
│   │   └── main.ts        # Entry point
│   └── package.json
│
└── web/                   # Frontend (React) 📋 Planejado
    └── ...
```

## 🗄️ Modelos de Dados (Prisma Schema)

### User (Usuário)
- `id` - Identificador único
- `email` - Email único do usuário
- `password` - Senha criptografada
- `name` - Nome do usuário
- `createdAt` - Data de criação
- `updatedAt` - Data de atualização

### Gain (Entrada)
- `id` - Identificador único
- `description` - Descrição da entrada
- `amount` - Valor da entrada
- `type` - Tipo da entrada
- `frequency` - Frequência (recorrente/eventual)
- `date` - Data da entrada
- `userId` - ID do usuário (FK)

### Expense (Despesa)
- `id` - Identificador único
- `description` - Descrição da despesa
- `amount` - Valor da despesa
- `type` - Tipo da despesa
- `frequency` - Frequência (recorrente/eventual)
- `date` - Data da despesa
- `isInstallment` - Se é parcelada
- `installmentGroupId` - ID do grupo de parcelas
- `installmentNumber` - Número da parcela
- `installmentTotal` - Total de parcelas
- `originalAmount` - Valor original (para parcelas)

### Budget (Orçamento)
- `id` - Identificador único
- `description` - Descrição do orçamento
- `amount` - Valor do orçamento
- `type` - Tipo do orçamento
- `month` - Mês do orçamento
- `year` - Ano do orçamento
- `userId` - ID do usuário (FK)
- Constraint único: `userId`, `type`, `month`, `year`

## 📊 Funcionalidades Implementadas

### 🔐 Autenticação
- ✅ Login com email e senha
- ✅ Registro de novos usuários
- ✅ Validação de token JWT
- ✅ Proteção de rotas com Guards

### 📈 Entradas (Gains)
- ✅ CRUD completo
- ✅ Listagem filtrada por usuário
- ✅ Validação de dados

### 💸 Despesas (Expenses)
- ✅ CRUD completo
- ✅ **Suporte a parcelas** - Criação automática de despesas parceladas
- ✅ Agrupamento de parcelas
- ✅ Validação de dados

### 💰 Orçamentos (Budgets)
- ✅ CRUD completo
- ✅ Prevenção de duplicação
- ✅ Status de orçamento (comparação com gastos reais)
- ✅ Filtro por mês e ano

### 📊 Relatórios
- ✅ Geração de relatórios em PDF
- ✅ Geração de relatórios em Excel
- ✅ Filtro por período
- ✅ Agregações e estatísticas

## 🔧 Configuração e Execução

### Pré-requisitos
- Node.js (v18 ou superior)
- PostgreSQL (v14 ou superior)
- npm ou yarn

### Backend (API)

1. Instalar dependências:
```bash
cd api
npm install
```

2. Configurar variáveis de ambiente:
```bash
cp env.example .env
```

3. Configurar o arquivo `.env`:
```env
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
DATABASE_URL=postgresql://user:password@localhost:5432/database?schema=public
```

4. Configurar banco de dados:
```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

5. Executar em desenvolvimento:
```bash
npm run start:dev
```

A API estará disponível em `http://localhost:3001/api`

## 📝 Scripts Disponíveis

### Backend
- `npm run start:dev` - Inicia em modo desenvolvimento com hot-reload
- `npm run build` - Compila o projeto
- `npm run start:prod` - Inicia em modo produção
- `npm run prisma:generate` - Gera o cliente Prisma
- `npm run prisma:migrate` - Cria uma nova migração
- `npm run prisma:studio` - Abre o Prisma Studio
- `npm run prisma:seed` - Popula o banco de dados
- `npm run lint` - Executa o linter
- `npm run format` - Formata o código com Prettier

## 🔒 Segurança

- ✅ Autenticação JWT
- ✅ Hash de senhas com bcryptjs
- ✅ Validação de dados com class-validator
- ✅ Guards de autenticação nas rotas protegidas
- ✅ CORS configurado
- ✅ Proteção contra SQL injection (Prisma)

## 📄 Licença

MIT

## 👤 Autor

Desenvolvido como projeto pessoal de gestão financeira.

---

**⚠️ Nota:** Este projeto está em desenvolvimento ativo. Funcionalidades podem estar incompletas ou sujeitas a mudanças.
