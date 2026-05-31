# CRM — Fase 4: Tarefas

**Data:** 2026-05-31
**Escopo:** Fase 4 de 6 do projeto CRM completo
**Depende de:** Fase 2 (Contatos, Empresas), Fase 3 (Pipeline/Deals)
**Stack:** Next.js 14 + Express/Node.js + PostgreSQL + Prisma + Turborepo

---

## Contexto

As fases anteriores entregaram a base de dados do CRM (Contatos, Empresas, Tags) e o módulo comercial (Pipeline de Deals). A Fase 4 implementa o módulo de **Tarefas** — atividades que os usuários precisam executar, vinculadas aos registros existentes do CRM.

Tarefas podem ser recorrentes (diária/semanal/mensal): quando uma tarefa recorrente é concluída, o sistema cria automaticamente a próxima instância com o prazo calculado. Cada tarefa tem um responsável (usuário do sistema) e pode ser vinculada a um Contato, Empresa e/ou Deal.

---

## 1. Modelo de Dados

### Novo modelo Prisma

```prisma
model Task {
  id              String       @id @default(cuid())
  title           String
  notes           String?
  dueAt           DateTime?
  priority        TaskPriority @default(MEDIUM)
  status          TaskStatus   @default(PENDING)
  recurrence      Recurrence   @default(NONE)
  recurrenceEndAt DateTime?

  assignee        User         @relation(fields: [assigneeId], references: [id])
  assigneeId      String

  contact         Contact?     @relation(fields: [contactId], references: [id], onDelete: SetNull)
  contactId       String?
  company         Company?     @relation(fields: [companyId], references: [id], onDelete: SetNull)
  companyId       String?
  deal            Deal?        @relation(fields: [dealId], references: [id], onDelete: SetNull)
  dealId          String?

  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
}

enum TaskPriority {
  HIGH
  MEDIUM
  LOW
}

enum TaskStatus {
  PENDING
  IN_PROGRESS
  DONE
}

enum Recurrence {
  NONE
  DAILY
  WEEKLY
  MONTHLY
}
```

### Relacionamentos

- **Task → User (assignee):** obrigatório. Toda tarefa tem um responsável.
- **Task → Contact:** opcional. `onDelete: SetNull` — tarefa permanece se o contato for deletado.
- **Task → Company:** opcional. `onDelete: SetNull` — mesma regra.
- **Task → Deal:** opcional. `onDelete: SetNull` — mesma regra.

### Lógica de recorrência (lazy generation)

Quando `PUT /api/tasks/:id` recebe `{ status: "DONE" }` e a tarefa tem `recurrence !== NONE`:

1. O backend verifica se `recurrenceEndAt` está definido e não passou ainda.
2. Se válido, cria uma nova tarefa idêntica (`title`, `notes`, `priority`, `recurrence`, `recurrenceEndAt`, `assigneeId`, vínculos) com `status: PENDING` e `dueAt` calculado:
   - `DAILY` → `dueAt + 1 dia`
   - `WEEKLY` → `dueAt + 7 dias`
   - `MONTHLY` → `dueAt + 1 mês`
3. Se `dueAt` for `null` na tarefa original, a nova instância também terá `dueAt: null`.

### Seed

5 tarefas de exemplo distribuídas entre usuários, prioridades e vínculos com os dados da Fase 2 e 3:

| Título | Prioridade | Status | Recorrência | Vínculo |
|--------|-----------|--------|-------------|---------|
| Ligar para Maria Silva | HIGH | PENDING | NONE | Contact: Maria Silva |
| Enviar proposta GlobalCorp | HIGH | PENDING | NONE | Deal: Licença GlobalCorp |
| Follow-up semanal Tech Solutions | MEDIUM | PENDING | WEEKLY | Company: Tech Solutions |
| Atualizar dados StartupXYZ | LOW | DONE | NONE | Company: StartupXYZ |
| Reunião mensal de pipeline | MEDIUM | PENDING | MONTHLY | — |

---

## 2. Backend API

Router `/api/tasks` registrado em `apps/api/src/app.ts`, protegido por `authenticate`.

### Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/tasks` | Lista tarefas com filtros (ver abaixo), paginada |
| POST | `/api/tasks` | Cria tarefa (`title` e `assigneeId` obrigatórios) |
| GET | `/api/tasks/:id` | Busca tarefa individual com assignee, contact, company, deal |
| PUT | `/api/tasks/:id` | Atualiza — dispara criação de recorrência se `status=DONE` |
| DELETE | `/api/tasks/:id` | Deleta tarefa |

### Parâmetros de filtro do GET

| Parâmetro | Valores | Comportamento |
|-----------|---------|---------------|
| `filter` | `today` | `dueAt` entre hoje 00:00 e 23:59 (timezone UTC) |
| `filter` | `week` | `dueAt` nos próximos 7 dias a partir de hoje |
| `filter` | `overdue` | `dueAt` < início do dia de hoje AND `status != DONE` |
| `filter` | `mine` | `assigneeId` = ID do usuário autenticado (extraído do JWT) |
| `status` | `PENDING\|IN_PROGRESS\|DONE` | Filtra por status |
| `priority` | `HIGH\|MEDIUM\|LOW` | Filtra por prioridade |
| `page` | número | Paginação (default: 1) |
| `limit` | número | Itens por página (default: 20, máximo: 100) |

Filtros são combinados com AND. Exemplo: `?filter=today&priority=HIGH` retorna tarefas de hoje com prioridade alta.

### Formato de resposta (GET /tasks)

```json
{
  "data": [
    {
      "id": "...",
      "title": "Ligar para Maria Silva",
      "notes": null,
      "dueAt": "2026-06-01T00:00:00.000Z",
      "priority": "HIGH",
      "status": "PENDING",
      "recurrence": "NONE",
      "recurrenceEndAt": null,
      "assigneeId": "...",
      "assignee": { "id": "...", "name": "Admin" },
      "contactId": "...",
      "contact": { "id": "...", "name": "Maria Silva" },
      "companyId": null,
      "company": null,
      "dealId": null,
      "deal": null,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "meta": { "total": 5, "page": 1, "limit": 20, "totalPages": 1 }
}
```

### Ordenação padrão

Tarefas DONE vão ao final. Dentro de cada grupo: `dueAt ASC` (mais urgentes primeiro), nulos por último.

Implementação via `orderBy`:
```typescript
orderBy: [
  { status: 'asc' },   // DONE vem depois de IN_PROGRESS e PENDING (ordem alfabética)
  { dueAt: 'asc' },
]
```

---

## 3. Frontend

### Rotas

```
apps/web/app/(protected)/
  tarefas/
    page.tsx           ← Lista principal com filtros rápidos
    nova/page.tsx      ← Formulário de criação
    [id]/page.tsx      ← Formulário de edição
```

### Componentes

```
apps/web/components/tasks/
  task-list.tsx    ← Lista paginada com filtros rápidos e checkbox inline
  task-form.tsx    ← Formulário compartilhado (criar e editar)
```

### API Client

```
apps/web/lib/api/tasks.ts
```

### UX da lista (`task-list.tsx`)

**Filtros rápidos** — chips clicáveis no topo:

```
[ Todas ] [ Hoje ] [ Esta semana ] [ Atrasadas ] [ Minhas ]
```

- Apenas um filtro ativo por vez (exclusivo)
- "Todas" é o padrão — mostra TODAS as tarefas (PENDING, IN_PROGRESS e DONE), sem filtro adicional de status
- "Atrasadas" destaca o chip em vermelho

**Linha de tarefa:**
- Checkbox à esquerda — clicar marca como DONE (chama PUT com `{ status: "DONE" }`)
- Título, com texto riscado e opacidade reduzida quando DONE
- Badge de prioridade: 🔴 Alta | 🟡 Média | ⚪ Baixa
- Prazo: vermelho se atrasado, âmbar se é hoje, cinza se futuro
- Nome do responsável
- Vínculo (empresa ou contato, se houver)
- Botão ✏️ para ir à página de edição

**Estados vazios:** mensagem contextual por filtro (ex: "Nenhuma tarefa para hoje" / "Nenhuma tarefa atrasada ✅")

### UX do formulário (`task-form.tsx`)

Campos:
- **Título** (obrigatório)
- **Responsável** — select com usuários do sistema (obrigatório)
- **Prazo** — date input (opcional)
- **Prioridade** — select: Alta / Média / Baixa
- **Status** — select: Pendente / Em andamento / Concluída (só no modo edição)
- **Recorrência** — select: Nenhuma / Diária / Semanal / Mensal
- **Data limite da recorrência** — date input (aparece só quando recorrência ≠ Nenhuma, opcional)
- **Notas** — textarea
- **Vínculo com Contato** — select opcional
- **Vínculo com Empresa** — select opcional
- **Vínculo com Deal** — select opcional

No modo edição: botão "Excluir" (com confirmação).

### Sidebar

O item "Tarefas ✅" deixa de ser placeholder:
- Link principal → `/tarefas`

### Dashboard

O card "Próximas Atividades" (atualmente com dados mockados de `MOCK_TASKS`) passa a usar dados reais: tarefas com `dueAt` nos próximos 7 dias, `status != DONE`, ordenadas por prazo, limitadas a 5 itens.

---

## 4. Tipos Compartilhados

Novos tipos em `packages/shared/src/types/task.ts`:

```typescript
export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW'
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE'
export type Recurrence = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY'

export interface Task {
  id: string
  title: string
  notes: string | null
  dueAt: string | null
  priority: TaskPriority
  status: TaskStatus
  recurrence: Recurrence
  recurrenceEndAt: string | null
  assigneeId: string
  assignee: { id: string; name: string }
  contactId: string | null
  contact: { id: string; name: string } | null
  companyId: string | null
  company: { id: string; name: string } | null
  dealId: string | null
  deal: { id: string; title: string } | null
  createdAt: string
  updatedAt: string
}

export interface CreateTaskDto {
  title: string
  assigneeId: string
  notes?: string
  dueAt?: string
  priority?: TaskPriority
  recurrence?: Recurrence
  recurrenceEndAt?: string
  contactId?: string
  companyId?: string
  dealId?: string
}

export type UpdateTaskDto = Partial<CreateTaskDto> & { status?: TaskStatus }
```

---

## 5. Mapa de Arquivos

```
packages/shared/src/types/
  task.ts              (novo)
  index.ts             (modificado)

packages/db/prisma/
  schema.prisma        (Task, TaskPriority, TaskStatus, Recurrence adicionados)
  seed.ts              (5 tarefas de exemplo)

apps/api/src/
  controllers/tasks.controller.ts   (novo)
  routes/tasks.ts                   (novo)
  app.ts                            (modificado)

apps/web/
  lib/api/tasks.ts                  (novo)
  components/tasks/
    task-list.tsx                   (novo)
    task-form.tsx                   (novo)
  app/(protected)/
    tarefas/page.tsx                (novo)
    tarefas/nova/page.tsx           (novo)
    tarefas/[id]/page.tsx           (novo)
  components/sidebar.tsx            (modificado)
  app/(protected)/dashboard/page.tsx (modificado)
```
