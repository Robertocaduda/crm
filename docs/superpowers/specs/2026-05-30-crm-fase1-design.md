# CRM — Fase 1: Fundação + Dashboard MVP

**Data:** 2026-05-30  
**Escopo:** Fase 1 de 6 do projeto CRM completo  
**Stack:** Next.js 14 + Express/Node.js + PostgreSQL + Prisma + Turborepo

---

## Contexto

CRM completo para equipe pequena (1–10 usuários), cobrindo vendas, atendimento e marketing. O projeto é construído em 6 fases independentes. Esta spec cobre apenas a **Fase 1**: setup do monorepo, autenticação e dashboard com dados mockados.

As fases seguintes (Contatos, Pipeline, Tarefas, Suporte, Marketing) cada uma terá seu próprio spec e plano de implementação.

---

## 1. Arquitetura

### Estrutura do monorepo (Turborepo)

```
crm/
├── apps/
│   ├── web/          # Next.js 14 (App Router) — porta 3000
│   └── api/          # Express + Node.js — porta 3001
├── packages/
│   ├── shared/       # Tipos TypeScript compartilhados (interfaces, DTOs, enums)
│   └── db/           # Prisma ORM (schema, migrations, seed)
├── turbo.json
├── docker-compose.yml
└── package.json      # workspace root
```

### Fluxo de dados

```
Browser → Next.js (3000) → Express API (3001) → Prisma → PostgreSQL (5432)
```

- O Next.js é responsável apenas por renderização e chamadas à API via `fetch`
- Toda lógica de negócio fica no Express
- O Prisma Client é instanciado no pacote `packages/db` e importado apenas por `apps/api`
- O pacote `packages/shared` exporta tipos TypeScript que tanto `web` quanto `api` importam — elimina divergência de contrato

### Infraestrutura local

Docker Compose sobe o PostgreSQL. Não há dependência de serviço externo para desenvolvimento.

```yaml
# docker-compose.yml (resumo)
services:
  db:
    image: postgres:16
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: crm_dev
      POSTGRES_USER: crm
      POSTGRES_PASSWORD: crm
```

### Scripts de desenvolvimento

```json
// package.json raiz
"dev": "turbo run dev"           // sobe web + api em paralelo
"db:up": "docker compose up -d"  // sobe PostgreSQL
"db:migrate": "turbo run db:migrate --filter=db"
"db:seed": "turbo run db:seed --filter=db"
```

---

## 2. Autenticação

### Estratégia

JWT com dois tokens armazenados em **cookies httpOnly**:

| Token | Duração | Propósito |
|-------|---------|-----------|
| `access_token` | 15 minutos | Autoriza chamadas à API |
| `refresh_token` | 7 dias | Renova o access token silenciosamente |

Cookies httpOnly previnem acesso via JavaScript (proteção contra XSS). Sem localStorage.

### Fluxo

1. `POST /api/auth/login` — valida e-mail + senha (bcrypt), retorna os dois tokens como cookies
2. Middleware Next.js intercepta respostas `401` e chama `POST /api/auth/refresh` automaticamente
3. `POST /api/auth/logout` — invalida o refresh token no banco e apaga os cookies
4. `GET /api/auth/me` — retorna dados do usuário autenticado

### Schema do banco — tabela `users`

```prisma
model User {
  id           String    @id @default(cuid())
  name         String
  email        String    @unique
  passwordHash String
  role         Role      @default(USER)
  refreshToken String?   // armazena o token ativo para invalidação no logout
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}

enum Role {
  ADMIN
  USER
}
```

### Seed de usuários

O seed cria um usuário ADMIN padrão para desenvolvimento:

```
email: admin@crm.dev
senha: admin123
```

### Decisões de escopo (Fase 1)

- Sem OAuth / login social
- Sem "esqueci minha senha" / e-mail de reset
- Gestão de usuários (convidar/remover) fica para fase posterior
- ADMIN pode acessar todas as funcionalidades; USER também (sem restrições finas por ora)

---

## 3. Layout e Navegação

### Estrutura de páginas

```
/login          → Página de login (pública)
/dashboard      → Dashboard principal (protegida)
/contatos       → Redirecionamento "em breve" (Fase 2)
/pipeline       → Redirecionamento "em breve" (Fase 3)
/tarefas        → Redirecionamento "em breve" (Fase 4)
/suporte        → Redirecionamento "em breve" (Fase 5)
/marketing      → Redirecionamento "em breve" (Fase 6)
```

Rotas protegidas usam middleware Next.js (`middleware.ts`) para redirecionar para `/login` se não houver cookie de sessão válido.

### Sidebar

- Fundo escuro (`#0f172a`)
- Logo do CRM no topo
- Itens de navegação com ícone + label
- Item ativo com destaque em roxo e borda lateral
- Itens de fases futuras visíveis mas desabilitados, com badge "Fase N"
- Rodapé com avatar e nome do usuário logado

### Topbar

- Título da página atual
- Data atual
- Ícones de notificação e configurações (decorativos na Fase 1)

---

## 4. Dashboard

### Propósito

O dashboard da Fase 1 usa **dados mockados via seed** para validar o layout, os KPIs e a navegação antes de construir os módulos reais. Um banner amarelo deixa claro que os dados são de demonstração.

### KPI Cards (4 cards no topo)

| Card | Valor mock | Variação |
|------|-----------|----------|
| Total de Contatos | 1.284 | ↑ 12% este mês |
| Negociações Abertas | 47 | ↑ 5 esta semana |
| Receita Prevista | R$ 218k | ↓ 3% vs mês anterior |
| Tickets em Aberto | 23 | ↑ 2 hoje |

### Componentes do dashboard

**Funil de Vendas** (linha do meio, esquerda)  
Barras horizontais por etapa do pipeline: Prospecção → Qualificação → Proposta → Negociação → Fechamento. Dados numéricos fixos vindos do seed.

**Atividades Recentes** (linha do meio, direita)  
Timeline com 5 atividades recentes mockadas. Cada item tem: cor, texto descritivo e tempo relativo.

**Negociações em Destaque** (linha de baixo, esquerda)  
Lista de 4 negociações com nome, empresa, valor e status (tag colorida).

**Próximas Atividades** (linha de baixo, direita)  
Lista de 4 atividades futuras com nome, data/hora e tipo (Reunião, E-mail, Demo, Tarefa).

### Dados mock

Os dados do dashboard na Fase 1 são **constantes hardcoded nos próprios componentes React** — não há chamada à API nem leitura do banco para renderizá-los. Isso mantém o setup simples e foca na validação do layout.

O banco de dados e o seed (`packages/db/seed.ts`) existem na Fase 1 apenas para suportar a autenticação (tabela `users`). Os dados de negociações, contatos, funil etc. são fictícios no código do componente.

Quando os módulos reais forem construídos (Fases 2–6), cada componente do dashboard será refatorado para consumir a API correspondente.

---

## 5. Fora do Escopo (Fase 1)

- Módulos de Contatos, Pipeline, Tarefas, Suporte, Marketing
- Envio de e-mails
- Permissões granulares por perfil
- Testes automatizados (unitários / E2E)
- Deploy em produção
- "Esqueci minha senha"
- Gestão de usuários pela interface

---

## 6. Critérios de Conclusão da Fase 1

- [ ] Monorepo com Turborepo rodando com `npm run dev`
- [ ] PostgreSQL subindo via Docker Compose
- [ ] Migrations e seed executando sem erros
- [ ] Login e logout funcionando com cookies httpOnly
- [ ] Redirect automático para `/login` em rotas protegidas
- [ ] Dashboard renderizando com dados mock
- [ ] Sidebar com navegação e itens desabilitados para fases futuras
- [ ] Refresh token renovando sessão silenciosamente

---

## Fases Seguintes (para referência)

| Fase | Módulo | Dependência |
|------|--------|-------------|
| 2 | Contatos & Empresas | Fase 1 |
| 3 | Pipeline de Vendas | Fase 2 |
| 4 | Tarefas & Atividades | Fase 2 |
| 5 | Suporte (Tickets) | Fase 2 |
| 6 | Marketing | Fase 2 |
