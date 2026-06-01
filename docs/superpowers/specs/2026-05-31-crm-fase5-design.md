# CRM — Fase 5: Suporte

**Data:** 2026-05-31
**Escopo:** Fase 5 de 6 do projeto CRM completo
**Depende de:** Fase 2 (Contatos, Empresas), Fase 4 (Users via Tasks pattern)
**Stack:** Next.js 14 + Express/Node.js + PostgreSQL + Prisma + Turborepo

---

## Contexto

A Fase 5 implementa o módulo de **Suporte ao Cliente** — tickets de atendimento com Kanban por status (Aberto / Em andamento / Resolvido), categorias, prioridade, responsável e thread de comentários. Tickets podem ser vinculados opcionalmente a Contatos e Empresas existentes no CRM.

---

## 1. Modelo de Dados

### Novos modelos Prisma

```prisma
model Ticket {
  id          String         @id @default(cuid())
  number      Int            @unique @default(autoincrement())
  title       String
  description String?
  status      TicketStatus   @default(OPEN)
  priority    TicketPriority @default(MEDIUM)
  category    TicketCategory @default(OTHER)
  resolution  String?

  assignee    User?          @relation(fields: [assigneeId], references: [id])
  assigneeId  String?

  contact     Contact?       @relation(fields: [contactId], references: [id], onDelete: SetNull)
  contactId   String?
  company     Company?       @relation(fields: [companyId], references: [id], onDelete: SetNull)
  companyId   String?

  comments    TicketComment[]
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
}

model TicketComment {
  id        String   @id @default(cuid())
  body      String
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
  ticket    Ticket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  ticketId  String
  createdAt DateTime @default(now())
}

enum TicketStatus   { OPEN  IN_PROGRESS  RESOLVED }
enum TicketPriority { HIGH  MEDIUM  LOW }
enum TicketCategory { BUG  QUESTION  REQUEST  OTHER }
```

### Relacionamentos

- **Ticket → User (assignee):** opcional. Ticket pode existir sem responsável.
- **Ticket → Contact:** opcional. `onDelete: SetNull`.
- **Ticket → Company:** opcional. `onDelete: SetNull`.
- **TicketComment → Ticket:** obrigatório. `onDelete: Cascade` — comentários deletados junto com o ticket.
- **TicketComment → User (author):** obrigatório. Todo comentário tem um autor.
- **`number`**: inteiro autoincrement para exibir como `#304`. Mais legível que cuid.
- **`resolution`**: campo de texto opcional, preenchido quando `status = RESOLVED`.

### Relações inversas nos modelos existentes

- `User`: adicionar `tickets Ticket[]` e `ticketComments TicketComment[]`
- `Contact`: adicionar `tickets Ticket[]`
- `Company`: adicionar `tickets Ticket[]`

### Seed

4 tickets de exemplo:

| # | Título | Status | Priority | Category | Vínculo |
|---|--------|--------|----------|----------|---------|
| 1 | Erro no módulo de pagamento | IN_PROGRESS | HIGH | BUG | Tech Solutions |
| 2 | Dúvida sobre fatura de março | OPEN | MEDIUM | QUESTION | GlobalCorp |
| 3 | Solicitação de novo usuário | OPEN | LOW | REQUEST | StartupXYZ |
| 4 | Acesso bloqueado | RESOLVED | HIGH | BUG | Mega Ind. |

2 comentários no ticket #1.

---

## 2. Backend API

Dois routers registrados em `apps/api/src/app.ts`, protegidos por `authenticate`.

### `/api/tickets` — Tickets

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/tickets` | Lista tickets. Sem `?status`: retorna agrupado por status (Kanban). Com `?status=X`: retorna lista paginada |
| POST | `/api/tickets` | Cria ticket (`title` obrigatório) |
| GET | `/api/tickets/:id` | Busca ticket com `comments`, `assignee`, `contact`, `company` |
| PUT | `/api/tickets/:id` | Atualiza qualquer campo incl. `status` e `resolution` |
| DELETE | `/api/tickets/:id` | Deleta ticket (comentários em cascade) |

**Formato de resposta — GET sem `?status` (Kanban):**
```json
{
  "data": [
    { "status": "OPEN",        "tickets": [ { "id": "...", "number": 2, ... } ] },
    { "status": "IN_PROGRESS", "tickets": [ { "id": "...", "number": 1, ... } ] },
    { "status": "RESOLVED",    "tickets": [ { "id": "...", "number": 4, ... } ] }
  ]
}
```

A ordem das colunas é sempre: `OPEN → IN_PROGRESS → RESOLVED`.

**Formato de resposta — GET com `?status=X` (lista paginada):**
```json
{
  "data": [ ... ],
  "meta": { "total": 2, "page": 1, "limit": 20, "totalPages": 1 }
}
```

**Filtros combinados (AND):**

| Parâmetro | Valores |
|-----------|---------|
| `status` | `OPEN\|IN_PROGRESS\|RESOLVED` |
| `priority` | `HIGH\|MEDIUM\|LOW` |
| `category` | `BUG\|QUESTION\|REQUEST\|OTHER` |
| `assigneeId` | ID do usuário |
| `page` | número (default: 1) |
| `limit` | número (default: 20, máximo: 100) |

**Ticket include padrão (em todas as respostas):**
```typescript
const TICKET_INCLUDE = {
  assignee: { select: { id: true, name: true } },
  contact:  { select: { id: true, name: true } },
  company:  { select: { id: true, name: true } },
  comments: {
    include: { author: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' },
  },
}
```

### `/api/tickets/:id/comments` — Comentários

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/tickets/:id/comments` | Cria comentário. `body` obrigatório. `authorId` = usuário do JWT |
| DELETE | `/api/tickets/:id/comments/:commentId` | Deleta comentário |

---

## 3. Frontend

### Rotas

```
apps/web/app/(protected)/
  suporte/
    page.tsx                    ← Board Kanban
    tickets/
      novo/
        page.tsx                ← Formulário de criação
      [id]/
        page.tsx                ← Detalhe + thread de comentários
```

### Componentes

```
apps/web/components/support/
  ticket-board.tsx    ← 3 colunas fixas com ticket-cards
  ticket-card.tsx     ← Card: #número, título, badges de categoria/prioridade, assignee
  ticket-form.tsx     ← Formulário de criação
  ticket-detail.tsx   ← Detalhe editável + thread de comentários
  ticket-comment.tsx  ← Comentário individual (autor, data, corpo)
```

### API Client

```
apps/web/lib/api/tickets.ts
```

### UX do Board (`ticket-board.tsx`)

- 3 colunas fixas: **Aberto** (badge azul) | **Em andamento** (badge âmbar) | **Resolvido** (badge verde)
- Cada coluna mostra o número de tickets no header
- Card (`ticket-card.tsx`) exibe: `#número`, título (truncado), badge de categoria, badge de prioridade, nome do assignee (ou "Sem responsável")
- Clicar no card → navega para `/suporte/tickets/[id]`
- Botão `+ Novo Ticket` no canto superior direito → `/suporte/tickets/novo`
- Estado vazio por coluna: "Nenhum ticket aberto"

### UX do Detalhe (`ticket-detail.tsx`)

- Header: `#número` + título + dropdown de status
- Campo de resolução aparece **somente** quando `status = RESOLVED`
- Campos editáveis: título, descrição, prioridade, categoria, responsável, contato, empresa
- Botão "Salvar" submete o formulário
- Botão "🗑️ Excluir" com confirmação

**Thread de comentários** (abaixo do formulário):
- Lista de `TicketComment` ordenados por `createdAt ASC`
- Cada comentário mostra: avatar inicial do autor, nome, data relativa e corpo
- Textarea + botão "Comentar" para adicionar novo comentário
- Botão de deletar no hover de cada comentário

### UX do Formulário de Criação (`ticket-form.tsx`)

Campos:
- **Título** (obrigatório)
- **Descrição** — textarea
- **Prioridade** — select: Alta / Média / Baixa
- **Categoria** — select: Bug / Dúvida / Solicitação / Outro
- **Responsável** — select de usuários (via `/api/tasks/users-list`, reutilizando o endpoint existente)
- **Contato** — select opcional
- **Empresa** — select opcional

### Sidebar

O item "Suporte 🎧" deixa de ser placeholder:
- Link direto → `/suporte`

### Dashboard

O card "Tickets em Aberto" passa a usar dado real: contagem de tickets com `status = OPEN` **ou** `status = IN_PROGRESS` (ou seja, todos os não-resolvidos).

---

## 4. Tipos Compartilhados

Novos tipos em `packages/shared/src/types/ticket.ts`:

```typescript
export type TicketStatus   = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'
export type TicketPriority = 'HIGH' | 'MEDIUM' | 'LOW'
export type TicketCategory = 'BUG' | 'QUESTION' | 'REQUEST' | 'OTHER'

export interface TicketComment {
  id: string
  body: string
  authorId: string
  author: { id: string; name: string }
  ticketId: string
  createdAt: string
}

export interface Ticket {
  id: string
  number: number
  title: string
  description: string | null
  status: TicketStatus
  priority: TicketPriority
  category: TicketCategory
  resolution: string | null
  assigneeId: string | null
  assignee: { id: string; name: string } | null
  contactId: string | null
  contact: { id: string; name: string } | null
  companyId: string | null
  company: { id: string; name: string } | null
  comments: TicketComment[]
  createdAt: string
  updatedAt: string
}

export interface CreateTicketDto {
  title: string
  description?: string
  priority?: TicketPriority
  category?: TicketCategory
  assigneeId?: string
  contactId?: string
  companyId?: string
}

export type UpdateTicketDto = Partial<CreateTicketDto> & {
  status?: TicketStatus
  resolution?: string
}

export interface TicketsGroupedByStatus {
  status: TicketStatus
  tickets: Ticket[]
}
```

---

## 5. Mapa de Arquivos

```
packages/shared/src/types/
  ticket.ts              (novo)
  index.ts               (modificado)

packages/db/prisma/
  schema.prisma          (Ticket, TicketComment + enums)
  seed.ts                (4 tickets, 2 comentários)

apps/api/src/
  controllers/tickets.controller.ts    (novo)
  routes/tickets.ts                    (novo)
  app.ts                               (modificado)

apps/web/
  lib/api/tickets.ts                   (novo)
  components/support/
    ticket-board.tsx                   (novo)
    ticket-card.tsx                    (novo)
    ticket-form.tsx                    (novo)
    ticket-detail.tsx                  (novo)
    ticket-comment.tsx                 (novo)
  app/(protected)/
    suporte/page.tsx                   (novo)
    suporte/tickets/novo/page.tsx      (novo)
    suporte/tickets/[id]/page.tsx      (novo)
  components/sidebar.tsx               (modificado)
  app/(protected)/dashboard/page.tsx   (modificado)
```
