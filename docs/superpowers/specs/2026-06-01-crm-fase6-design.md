# CRM — Fase 6: Marketing (Segmentação de Contatos)

**Data:** 2026-06-01
**Escopo:** Fase 6 de 6 do projeto CRM completo
**Depende de:** Fase 2 (Contatos, Empresas), Fase 1 (Auth/User)
**Stack:** Next.js 14 + Express/Node.js + PostgreSQL + Prisma + Turborepo

---

## Contexto

A Fase 6 implementa o módulo de **Marketing** — especificamente **Segmentação de Contatos** via listas estáticas. Usuários criam listas nomeadas, adicionam contatos a elas individualmente (busca) ou em lote (seleção múltipla na página de Contatos), e consultam a quais listas um contato pertence diretamente na ficha do contato.

Não há envio de email nem integração externa. O módulo é puramente organizacional.

---

## 1. Modelo de Dados

### Novos modelos Prisma

```prisma
model MarketingList {
  id          String                @id @default(cuid())
  name        String
  description String?
  members     MarketingListMember[]
  createdAt   DateTime              @default(now())
  updatedAt   DateTime              @updatedAt
}

model MarketingListMember {
  list      MarketingList @relation(fields: [listId], references: [id], onDelete: Cascade)
  listId    String
  contact   Contact       @relation(fields: [contactId], references: [id], onDelete: Cascade)
  contactId String
  addedAt   DateTime      @default(now())

  @@id([listId, contactId])
}
```

**Chave composta `@@id([listId, contactId])`** impede duplicatas no nível do banco.

**`onDelete: Cascade`** em ambas as relações: excluir uma lista remove todos os membros; excluir um contato remove suas associações.

### Modificação em modelo existente

No modelo `Contact`, adicionar relação inversa:

```prisma
  marketingLists MarketingListMember[]
```

### Seed

3 listas de exemplo com 2–3 membros cada, usando contatos já existentes no seed.

---

## 2. Tipos TypeScript Compartilhados

Novo arquivo `packages/shared/src/types/marketing-list.ts`:

```typescript
export interface MarketingList {
  id: string
  name: string
  description: string | null
  memberCount: number   // calculado via _count no backend
  createdAt: string
  updatedAt: string
}

export interface MarketingListMember {
  contactId: string
  contact: {
    id: string
    name: string
    email: string | null
    company: { id: string; name: string } | null
  }
  addedAt: string
}

export interface CreateMarketingListDto {
  name: string
  description?: string
}

export type UpdateMarketingListDto = Partial<CreateMarketingListDto>

export interface AddMembersDto {
  contactIds: string[]
}
```

Exportar de `packages/shared/src/index.ts`.

---

## 3. Backend — API

### Rotas

```
GET    /api/marketing/lists              → lista todas as listas (com _count de membros)
POST   /api/marketing/lists              → criar lista
GET    /api/marketing/lists/:id          → detalhe da lista (sem membros)
PUT    /api/marketing/lists/:id          → editar nome/descrição
DELETE /api/marketing/lists/:id          → excluir lista (cascade membros)

GET    /api/marketing/lists/:id/members  → contatos da lista (paginado, ?page=&limit=)
POST   /api/marketing/lists/:id/members  → adicionar contatos ({ contactIds: string[] })
DELETE /api/marketing/lists/:id/members/:contactId  → remover contato da lista
```

Todos os endpoints requerem autenticação (`authenticate` middleware).

### Busca de contatos não-membros

`GET /api/contacts?search=...` já existe e é reutilizado pelo `MemberSearch`. O componente mantém em memória a lista de `contactId` já-membros (carregada junto com a página) e **filtra no client-side** antes de exibir as sugestões — contatos já presentes aparecem desabilitados no dropdown. Nenhum endpoint novo é necessário para a busca.

### Erros esperados

- `POST /members` com `contactIds` já na lista: Prisma lança erro por constraint — ignorar duplicatas com `skipDuplicates: true` no `createMany`.
- `DELETE /members/:contactId` inexistente: retornar 404.
- `DELETE /lists/:id` inexistente: retornar 404.

---

## 4. Frontend

### Mapa de arquivos

```
packages/shared/src/types/
  marketing-list.ts              (novo)
  index.ts                       (modificado)

packages/db/prisma/
  schema.prisma                  (modificado)
  seed.ts                        (modificado)

apps/api/src/
  controllers/marketing.controller.ts  (novo)
  routes/marketing.ts                  (novo)
  app.ts                               (modificado)

apps/web/
  lib/api/marketing.ts                 (novo)
  components/marketing/
    list-card.tsx                      (novo)
    list-grid.tsx                      (novo)
    list-form.tsx                      (novo)
    list-detail.tsx                    (novo)
    member-search.tsx                  (novo)
    contact-lists-section.tsx          (novo)
  app/(protected)/
    marketing/page.tsx                 (novo)
    marketing/listas/novo/page.tsx     (novo)
    marketing/listas/[id]/page.tsx     (novo)
  app/(protected)/contatos/
    page.tsx                           (modificado — checkboxes + ação bulk)
    [id]/page.tsx                      (modificado — seção Listas de Marketing)
  components/sidebar.tsx               (modificado — ativar link Marketing)
```

### Páginas

**`/marketing`** — Server Component. Busca todas as listas com `_count`. Renderiza `<ListGrid />` com os cards. Botão "+ Nova Lista" leva a `/marketing/listas/novo`.

**`/marketing/listas/novo`** — Client Component `<ListForm />`. Campos: nome (obrigatório), descrição. Submit → POST `/api/marketing/lists` → redirect para `/marketing/listas/[id]`.

**`/marketing/listas/[id]`** — Server Component busca detalhe da lista + primeiros membros. Passa para `<ListDetail />` (Client Component) que gerencia:
- Tabela paginada de membros com botão ✕ para remover
- `<MemberSearch />`: campo de busca que chama `GET /api/contacts?search=...`, filtra já-membros, exibe dropdown de sugestões, adiciona via `POST /members`

**`/contatos`** — Modificação: adicionar estado de seleção múltipla com checkboxes. Quando ≥1 contato selecionado, barra de ação aparece com "📋 Adicionar à lista". Clicar abre modal com lista de `MarketingList` para escolher. Submit → `POST /api/marketing/lists/:id/members` com os IDs selecionados.

**`/contatos/[id]`** — Modificação: adicionar seção "Listas de Marketing" abaixo das informações existentes. Busca `GET /api/marketing/lists` e filtra quais contêm o contato atual (ou endpoint dedicado). Exibe chips roxos com nome da lista + ✕ para remover.

### Componentes

| Componente | Responsabilidade |
|---|---|
| `ListCard` | Card de uma lista: nome, descrição, contagem, data |
| `ListGrid` | Grid 2-col de `ListCard` + card "+ Nova Lista" |
| `ListForm` | Formulário criar/editar lista |
| `ListDetail` | Tabela de membros + `MemberSearch` + paginação |
| `MemberSearch` | Input com autocomplete de contatos, adiciona ao clicar |
| `ContactListsSection` | Chips de listas na ficha do contato + ação remover |

---

## 5. Fluxos Principais

### Adicionar contato individualmente
1. Usuário acessa `/marketing/listas/[id]`
2. Digita nome no `MemberSearch`
3. API retorna contatos — os já-membros ficam desabilitados
4. Clica no contato → `POST /api/marketing/lists/:id/members` com `{ contactIds: [id] }`
5. Membro aparece na tabela imediatamente (atualização otimista)

### Adicionar em lote da página de Contatos
1. Usuário acessa `/contatos`, ativa checkboxes nos contatos desejados
2. Barra de ação aparece: "N contatos selecionados" + botão "📋 Adicionar à lista"
3. Modal lista todas as `MarketingList` — usuário escolhe uma
4. Submit → `POST /api/marketing/lists/:id/members` com array de IDs
5. Modal fecha, seleção limpa, toast de confirmação

### Ver/remover listas na ficha do contato
1. Usuário acessa `/contatos/[id]`
2. Seção "Listas de Marketing" exibe chips roxos com cada lista
3. Clicar ✕ no chip → `DELETE /api/marketing/lists/:id/members/:contactId`
4. Chip removido otimisticamente

---

## 6. Dashboard

O card "Tickets em Aberto" no dashboard não muda. O marketing não adiciona KPI ao dashboard nesta fase — o módulo é acessado diretamente pelo sidebar.

O sidebar terá o link "Marketing 📣" ativo com o mesmo padrão visual dos outros links.

---

## 7. Seed

```typescript
// 3 listas com contatos dos seeds anteriores
const lista1 = await prisma.marketingList.upsert({ where: { id: 'ml-clientes' }, ... })
const lista2 = await prisma.marketingList.upsert({ where: { id: 'ml-leads' }, ... })
const lista3 = await prisma.marketingList.upsert({ where: { id: 'ml-newsletter' }, ... })
// Adicionar 2-3 contatos a cada lista via MarketingListMember
```

---

## 8. Critérios de Aceite

- [ ] `/marketing` exibe grid de listas com contagem de membros
- [ ] Criar nova lista com nome obrigatório e descrição opcional
- [ ] Editar nome/descrição de uma lista
- [ ] Excluir lista (com confirmação)
- [ ] Adicionar contato individualmente via busca (sem duplicatas)
- [ ] Contatos já-membros aparecem desabilitados na busca
- [ ] Remover contato da lista com botão ✕
- [ ] Selecionar múltiplos contatos em `/contatos` e adicionar à lista
- [ ] Ficha do contato mostra chips das listas com remoção
- [ ] Sidebar: link "Marketing 📣" ativo com highlight
- [ ] TypeScript sem erros em todos os pacotes
