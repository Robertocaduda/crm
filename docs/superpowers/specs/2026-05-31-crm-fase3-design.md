# CRM — Fase 3: Pipeline de Vendas

**Data:** 2026-05-31
**Escopo:** Fase 3 de 6 do projeto CRM completo
**Depende de:** Fase 2 (Contatos, Empresas, Tags)
**Stack:** Next.js 14 + Express/Node.js + PostgreSQL + Prisma + Turborepo

---

## Contexto

A Fase 2 entregou o núcleo de dados do CRM (Contatos, Empresas, Tags). A Fase 3 implementa o **Pipeline de Vendas** — o módulo comercial onde negociações (deals) são criadas, acompanhadas por estágios configuráveis e finalizadas como ganhas ou perdidas.

O pipeline se integra diretamente com os dados da Fase 2: cada deal pode ser vinculado a um Contato e/ou Empresa.

---

## 1. Modelo de Dados

### Novos modelos Prisma

```prisma
model PipelineStage {
  id        String   @id @default(cuid())
  name      String
  order     Int
  color     String
  deals     Deal[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Deal {
  id              String        @id @default(cuid())
  title           String
  value           Decimal?
  probability     Int?
  expectedCloseAt DateTime?
  notes           String?
  status          DealStatus    @default(OPEN)
  stage           PipelineStage @relation(fields: [stageId], references: [id])
  stageId         String
  contact         Contact?      @relation(fields: [contactId], references: [id], onDelete: SetNull)
  contactId       String?
  company         Company?      @relation(fields: [companyId], references: [id], onDelete: SetNull)
  companyId       String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}

enum DealStatus {
  OPEN
  WON
  LOST
}
```

### Relacionamentos

- **Deal → PipelineStage:** obrigatório. Todo deal pertence a um estágio.
- **Deal → Contact:** opcional. `onDelete: SetNull` — se o contato for deletado, o deal permanece.
- **Deal → Company:** opcional. `onDelete: SetNull` — mesma regra.
- **DealStatus:** deals `WON` e `LOST` mantêm o `stageId` do estágio em que estavam no momento do fechamento. Apenas o `status` muda.

### Seed

3 estágios padrão criados no seed:

| order | name | color |
|-------|------|-------|
| 1 | Prospecção | #6366f1 |
| 2 | Proposta | #f59e0b |
| 3 | Fechamento | #22c55e |

5 deals de exemplo distribuídos entre os estágios, com status `OPEN`, vinculados a contatos e empresas do seed da Fase 2.

---

## 2. Backend API

Dois novos routers registrados em `apps/api/src/app.ts`, ambos protegidos por `authenticate`.

### `/api/pipeline/stages` — Estágios

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/pipeline/stages` | Lista todos os estágios ordenados por `order` |
| POST | `/api/pipeline/stages` | Cria novo estágio (name, color obrigatórios) |
| PUT | `/api/pipeline/stages/:id` | Atualiza name e/ou color |
| PUT | `/api/pipeline/stages/reorder` | Recebe array de `{ id, order }` e atualiza todos em transação — deve ser registrado **antes** de `/:id` no router para evitar conflito de rota |
| DELETE | `/api/pipeline/stages/:id` | Deleta estágio — retorna 409 se houver deals vinculados |

### `/api/pipeline/deals` — Negociações

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/pipeline/deals` | Equivalente a `?status=OPEN` (default) |
| GET | `/api/pipeline/deals?status=OPEN` | Retorna deals agrupados por estágio (para o Kanban) |
| GET | `/api/pipeline/deals?status=WON` | Lista paginada de deals ganhos |
| GET | `/api/pipeline/deals?status=LOST` | Lista paginada de deals perdidos |
| POST | `/api/pipeline/deals` | Cria deal (title e stageId obrigatórios) |
| GET | `/api/pipeline/deals/:id` | Busca deal individual com contact, company e stage |
| PUT | `/api/pipeline/deals/:id` | Atualiza qualquer campo, incluindo stageId e status |
| DELETE | `/api/pipeline/deals/:id` | Deleta deal |

**Formato de resposta do `GET /deals?status=OPEN`:**
```json
{
  "data": [
    {
      "stage": { "id": "...", "name": "Prospecção", "color": "#6366f1", "order": 1 },
      "deals": [ { "id": "...", "title": "...", "value": 15000, ... } ]
    }
  ]
}
```

**Formato de resposta do `GET /deals?status=WON|LOST`:**
```json
{
  "data": [ ... ],
  "meta": { "total": 12, "page": 1, "limit": 20, "totalPages": 1 }
}
```

---

## 3. Frontend

### Rotas

```
apps/web/app/(protected)/
  pipeline/
    page.tsx                   ← Board principal (Kanban + toggle Lista)
    historico/
      page.tsx                 ← Deals ganhos e perdidos
    deals/
      novo/
        page.tsx               ← Formulário de criação
      [id]/
        page.tsx               ← Formulário de edição
  configuracoes/
    pipeline/
      page.tsx                 ← Gerenciamento de estágios
```

### Componentes

```
apps/web/components/pipeline/
  deal-board.tsx       ← Colunas do Kanban, agrupa deals por estágio
  deal-card.tsx        ← Card individual: título, empresa/contato, valor, dropdown de estágio
  deal-table.tsx       ← View de lista com colunas (título, estágio, valor, previsão, contato)
  deal-form.tsx        ← Formulário compartilhado (criação e edição)
  stage-manager.tsx    ← CRUD de estágios com reordenação por botões ↑↓
  history-table.tsx    ← Tabela paginada de deals WON/LOST com badge de status
```

### API Clients

```
apps/web/lib/api/
  pipeline-stages.ts
  pipeline-deals.ts
```

### UX do Board

- Toggle **Board / Lista** no canto superior direito da página `/pipeline`
- No modo **Board:** colunas por estágio, cards com título, valor, empresa/contato e dropdown para trocar de estágio
- No modo **Lista:** tabela com colunas: Título | Estágio | Valor | Probabilidade | Previsão | Contato/Empresa | Ações
- Marcar como **Ganho** ou **Perdido** via botões no formulário de edição — ao confirmar, o deal sai do board e vai para `/pipeline/historico`
- A tela de **Histórico** exibe deals WON e LOST em abas separadas, com paginação

### Sidebar

O item "Pipeline 💼" deixa de ser placeholder:
- Link principal → `/pipeline`
- Sub-item "Histórico" → `/pipeline/historico`
- Sub-item "Configurações" → `/configuracoes/pipeline`

### Dashboard

O card "Negociações Abertas" passa a usar dado real: `count` de deals com `status = OPEN`.

---

## 4. Tipos Compartilhados

Novos tipos em `packages/shared/src/types/`:

```typescript
// pipeline-stage.ts
export interface PipelineStage {
  id: string
  name: string
  order: number
  color: string
  createdAt: string
  updatedAt: string
}

export interface CreatePipelineStageDto {
  name: string
  color: string
}

export interface UpdatePipelineStageDto {
  name?: string
  color?: string
}

export interface ReorderStagesDto {
  stages: { id: string; order: number }[]
}

// deal.ts
export type DealStatus = 'OPEN' | 'WON' | 'LOST'

export interface Deal {
  id: string
  title: string
  value: number | null
  probability: number | null
  expectedCloseAt: string | null
  notes: string | null
  status: DealStatus
  stageId: string
  stage: { id: string; name: string; color: string }
  contactId: string | null
  contact: { id: string; name: string } | null
  companyId: string | null
  company: { id: string; name: string } | null
  createdAt: string
  updatedAt: string
}

export interface CreateDealDto {
  title: string
  stageId: string
  value?: number
  probability?: number
  expectedCloseAt?: string
  notes?: string
  contactId?: string
  companyId?: string
}

export type UpdateDealDto = Partial<CreateDealDto> & { status?: DealStatus }

export interface DealsGroupedByStage {
  stage: PipelineStage
  deals: Deal[]
}
```

---

## 5. Mapa de Arquivos

```
packages/shared/src/types/
  pipeline-stage.ts    (novo)
  deal.ts              (novo)
  index.ts             (modificado — exporta novos tipos)

packages/db/prisma/
  schema.prisma        (PipelineStage, Deal, DealStatus adicionados)
  seed.ts              (3 estágios + 5 deals de exemplo)

apps/api/src/
  controllers/
    pipeline-stages.controller.ts  (novo)
    pipeline-deals.controller.ts   (novo)
  routes/
    pipeline-stages.ts             (novo)
    pipeline-deals.ts              (novo)
  app.ts                           (registra novos routers)

apps/web/
  lib/api/
    pipeline-stages.ts  (novo)
    pipeline-deals.ts   (novo)
  components/pipeline/
    deal-board.tsx      (novo)
    deal-card.tsx       (novo)
    deal-table.tsx      (novo)
    deal-form.tsx       (novo)
    stage-manager.tsx   (novo)
    history-table.tsx   (novo)
  app/(protected)/
    pipeline/page.tsx                    (novo)
    pipeline/historico/page.tsx          (novo)
    pipeline/deals/novo/page.tsx         (novo)
    pipeline/deals/[id]/page.tsx         (novo)
    configuracoes/pipeline/page.tsx      (novo)
  components/
    sidebar.tsx          (modificado)
  app/(protected)/dashboard/page.tsx     (modificado)
```
