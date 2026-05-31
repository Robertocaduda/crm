# CRM — Fase 2: Contatos & Empresas

**Data:** 2026-05-31  
**Escopo:** Fase 2 de 6 do projeto CRM completo  
**Depende de:** Fase 1 (monorepo, autenticação, dashboard)  
**Stack:** Next.js 14 + Express/Node.js + PostgreSQL + Prisma + Turborepo

---

## Contexto

A Fase 1 entregou a fundação: monorepo, autenticação JWT e dashboard com dados mockados. A Fase 2 implementa o núcleo de dados do CRM — **Contatos** (pessoas), **Empresas** (contas) e **Tags** — sobre os quais todas as fases seguintes (Pipeline, Tarefas, Suporte, Marketing) irão operar.

Ao final da Fase 2, o card "Total de Contatos" no dashboard passa a usar dados reais.

---

## 1. Modelo de Dados

### Novos modelos Prisma

```prisma
model Company {
  id        String    @id @default(cuid())
  name      String
  website   String?
  phone     String?
  sector    String?
  notes     String?
  contacts  Contact[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Contact {
  id        String   @id @default(cuid())
  name      String
  email     String?  @unique
  phone     String?
  jobTitle  String?
  notes     String?
  company   Company? @relation(fields: [companyId], references: [id], onDelete: SetNull)
  companyId String?
  tags      Tag[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Tag {
  id       String    @id @default(cuid())
  name     String    @unique
  color    String    // hex: "#6366f1"
  contacts Contact[]
}
```

### Relacionamentos

- **Contact → Company:** opcional (0..1). Um contato pode existir sem empresa. Se a empresa for deletada, `companyId` vira `null` (`onDelete: SetNull`).
- **Company → Contact[]:** uma empresa tem zero ou mais contatos.
- **Contact ↔ Tag:** muitos para muitos. Prisma gera a tabela junction `_ContactToTag` automaticamente. Tags são reutilizáveis entre contatos.

### Decisão de design: Tag como model dedicado

Tags têm nome e cor (hex). Essa abordagem (vs. array de strings) permite:
- Gerenciar tags globalmente (renomear, recolorir, ver contagem de uso)
- Exibir badges coloridos consistentes em toda a interface

---

## 2. API — Endpoints

Todos os endpoints são protegidos pelo middleware `authenticate` (JWT cookie).

### Contatos

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/contacts` | Lista com busca e filtro |
| POST | `/api/contacts` | Cria novo contato |
| GET | `/api/contacts/:id` | Detalhe do contato com tags e empresa |
| PUT | `/api/contacts/:id` | Atualiza contato |
| DELETE | `/api/contacts/:id` | Remove contato |

**Query params de `GET /api/contacts`:**

| Param | Tipo | Descrição |
|-------|------|-----------|
| `search` | string | Busca parcial em `name` e `email` (case-insensitive) |
| `tagId` | string | Filtra contatos que possuem essa tag |
| `page` | number | Página (default: 1) |
| `limit` | number | Itens por página (default: 20, máx: 100) |

**Resposta de `GET /api/contacts`:**
```json
{
  "data": [
    {
      "id": "...",
      "name": "Maria Silva",
      "email": "maria@tech.com",
      "phone": "...",
      "jobTitle": "CEO",
      "company": { "id": "...", "name": "Tech Solutions" },
      "tags": [{ "id": "...", "name": "Cliente", "color": "#6366f1" }],
      "createdAt": "..."
    }
  ],
  "meta": { "total": 47, "page": 1, "limit": 20, "totalPages": 3 }
}
```

### Empresas

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/companies` | Lista com busca opcional (`?search=`) |
| POST | `/api/companies` | Cria nova empresa |
| GET | `/api/companies/:id` | Detalhe com contatos vinculados |
| PUT | `/api/companies/:id` | Atualiza empresa |
| DELETE | `/api/companies/:id` | Remove empresa (contatos mantidos com companyId null) |

### Tags

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/tags` | Lista todas as tags |
| POST | `/api/tags` | Cria nova tag |
| PUT | `/api/tags/:id` | Atualiza nome/cor |
| DELETE | `/api/tags/:id` | Remove tag (desvincula de todos os contatos) |

---

## 3. Interface

### Sidebar — atualização

O item "Contatos" da sidebar vira um grupo colapsável com 3 sub-itens:

```
▾ Contatos
    👥 Pessoas       → /contatos
    🏢 Empresas      → /empresas
    🏷️ Tags          → /tags
```

Os módulos de fases futuras (Pipeline, Tarefas, Suporte, Marketing) continuam visíveis mas desabilitados.

### Rotas do frontend

```
/contatos           → Lista de contatos
/contatos/novo      → Formulário de criação
/contatos/:id/editar → Formulário de edição
/empresas           → Lista de empresas
/empresas/novo      → Formulário de criação
/empresas/:id/editar → Formulário de edição
/tags               → Gerenciamento de tags
```

### Lista de Contatos (`/contatos`)

- **Topbar:** título "Contatos" com contagem total + botão "+ Novo Contato"
- **Busca:** input de texto com debounce de 300ms, busca por nome ou e-mail
- **Filtro por tag:** pills horizontais (Todos + uma pill por tag existente). Clique filtra a lista.
- **Tabela:** colunas — Avatar+Nome+Cargo | Empresa | Tags | E-mail | Ações (editar, excluir)
- **Paginação:** 20 contatos por página, controles de próxima/anterior + números de página
- **Exclusão:** modal de confirmação antes de deletar

### Formulário de Contato (`/contatos/novo`, `/contatos/:id/editar`)

Campos:
- **Nome** (obrigatório)
- **E-mail** (opcional, validado como e-mail único)
- **Telefone** (opcional)
- **Cargo** (opcional)
- **Empresa** (dropdown com busca, opcional)
- **Tags** (multi-select via toggle de pills; botão "+ Nova tag" abre mini-form inline com nome e cor)
- **Notas** (textarea opcional)

### Lista de Empresas (`/empresas`)

- Grid 2 colunas de cards. Cada card: logo (iniciais coloridas), nome, setor, contagem de contatos, site.
- Busca por nome. Filtro por setor (dropdown).
- Ações: editar, excluir (com confirmação).

### Formulário de Empresa (`/empresas/novo`, `/empresas/:id/editar`)

Campos: Nome (obrigatório), Website, Telefone, Setor, Notas.

### Gerenciamento de Tags (`/tags`)

Tabela simples: nome (com badge colorido), ações editar/excluir. Botão "+ Nova Tag" abre form inline com campo de nome e color picker (paleta de 12 cores predefinidas).

---

## 4. Dashboard — atualização

O card "Total de Contatos" deixa de usar dado mockado e passa a chamar `GET /api/contacts?limit=1` e usar o `meta.total` da resposta. Os demais cards do dashboard continuam mockados (serão atualizados nas fases correspondentes).

---

## 5. Estrutura de Arquivos

### Backend (`apps/api/src/`)

```
routes/
  contacts.ts        # router /api/contacts
  companies.ts       # router /api/companies
  tags.ts            # router /api/tags
controllers/
  contacts.controller.ts
  companies.controller.ts
  tags.controller.ts
```

### Frontend (`apps/web/`)

```
app/(protected)/
  contatos/
    page.tsx              # lista
    novo/page.tsx         # formulário criação
    [id]/editar/page.tsx  # formulário edição
  empresas/
    page.tsx
    novo/page.tsx
    [id]/editar/page.tsx
  tags/
    page.tsx
components/
  contacts/
    contact-table.tsx     # tabela com busca e filtro
    contact-form.tsx      # formulário reutilizável
    tag-filter.tsx        # pills de filtro por tag
    delete-modal.tsx      # modal de confirmação
  companies/
    company-grid.tsx      # grid de cards
    company-form.tsx
  tags/
    tag-manager.tsx       # tabela + form inline
```

### Tipos compartilhados (`packages/shared/src/types/`)

```
contact.ts    # Contact, ContactSummary, CreateContactDto, UpdateContactDto
company.ts    # Company, CompanySummary, CreateCompanyDto, UpdateCompanyDto
tag.ts        # Tag, CreateTagDto
pagination.ts # PaginatedResponse<T>, PaginationMeta
```

---

## 6. Fora do Escopo (Fase 2)

- Histórico de interações com contatos (Fase 4)
- Importação via CSV
- Ordenação customizada na lista
- Filtro por empresa na lista de contatos
- Página de detalhe da empresa com lista de contatos vinculados
- Merge/deduplicação de contatos
- Exportação de dados

---

## 7. Critérios de Conclusão

- [ ] Migrations aplicadas (Company, Contact, Tag, junction table)
- [ ] Seed de contatos e empresas de exemplo (mínimo 10 contatos, 4 empresas, 4 tags)
- [ ] CRUD completo de Contatos funcionando via API
- [ ] CRUD completo de Empresas funcionando via API
- [ ] CRUD de Tags funcionando via API
- [ ] Busca por nome/e-mail em Contatos
- [ ] Filtro por tag em Contatos
- [ ] Paginação (20/página)
- [ ] Sidebar atualizada com grupo Contatos
- [ ] Todas as rotas do frontend funcionando
- [ ] Card "Total de Contatos" do dashboard usando dado real
- [ ] Middleware `authenticate` protegendo todos os endpoints
