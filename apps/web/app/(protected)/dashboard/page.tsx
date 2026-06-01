import { cookies } from 'next/headers'
import FunnelChart from '@/components/dashboard/funnel-chart'
import ActivityFeed from '@/components/dashboard/activity-feed'
import DealsList from '@/components/dashboard/deals-list'
import UpcomingTasks from '@/components/dashboard/upcoming-tasks'
import KpiCard from '@/components/dashboard/kpi-card'
import { MOCK_FUNNEL, MOCK_ACTIVITIES, MOCK_DEALS } from '@/lib/mock-data'

async function getContactCount(token: string, apiUrl: string): Promise<number> {
  try {
    const res = await fetch(`${apiUrl}/api/contacts?limit=1`, {
      headers: { Cookie: `access_token=${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return 0
    return (await res.json()).meta?.total ?? 0
  } catch { return 0 }
}

async function getOpenDealsCount(token: string, apiUrl: string): Promise<number> {
  try {
    const res = await fetch(`${apiUrl}/api/pipeline/deals?status=OPEN`, {
      headers: { Cookie: `access_token=${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return 0
    const data = await res.json()
    return (data.data as { deals: unknown[] }[]).reduce((sum, g) => sum + g.deals.length, 0)
  } catch { return 0 }
}

interface UpcomingTask { id: string; title: string; datetime: string; type: string; typeColor: string }

async function getUpcomingTasks(token: string, apiUrl: string): Promise<UpcomingTask[]> {
  try {
    const res = await fetch(`${apiUrl}/api/tasks?filter=week&limit=5`, {
      headers: { Cookie: `access_token=${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return []
    const data = await res.json()

    const PRIORITY_MAP: Record<string, { type: string; typeColor: string }> = {
      HIGH: { type: 'Alta', typeColor: 'bg-red-100 text-red-700' },
      MEDIUM: { type: 'Média', typeColor: 'bg-amber-100 text-amber-700' },
      LOW: { type: 'Baixa', typeColor: 'bg-slate-100 text-slate-500' },
    }

    return (data.data as any[]).map((t) => {
      const p = PRIORITY_MAP[t.priority] ?? { type: 'Média', typeColor: 'bg-amber-100 text-amber-700' }
      const date = t.dueAt
        ? new Date(t.dueAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
        : 'Sem prazo'
      return { id: t.id, title: t.title, datetime: date, type: p.type, typeColor: p.typeColor }
    })
  } catch { return [] }
}

async function getOpenTicketsCount(token: string, apiUrl: string): Promise<number> {
  try {
    const res = await fetch(`${apiUrl}/api/tickets`, {
      headers: { Cookie: `access_token=${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return 0
    const data = await res.json()
    const groups = data.data as { status: string; tickets: unknown[] }[]
    return groups
      .filter(g => g.status === 'OPEN' || g.status === 'IN_PROGRESS')
      .reduce((sum, g) => sum + g.tickets.length, 0)
  } catch { return 0 }
}

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value ?? ''
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001'

  const [contactCount, openDealsCount, upcomingTasks, openTicketsCount] = await Promise.all([
    getContactCount(token, apiUrl),
    getOpenDealsCount(token, apiUrl),
    getUpcomingTasks(token, apiUrl),
    getOpenTicketsCount(token, apiUrl),
  ])

  const kpis = [
    { id: 'contacts', label: 'Total de Contatos', value: contactCount.toLocaleString('pt-BR'), change: 'dados reais', trend: 'up' as const, icon: '👥' },
    { id: 'deals', label: 'Negociações Abertas', value: openDealsCount.toLocaleString('pt-BR'), change: 'dados reais', trend: 'up' as const, icon: '💼' },
    { id: 'revenue', label: 'Receita Prevista', value: 'R$ 218k', change: '↓ 3% vs mês anterior', trend: 'down' as const, icon: '💰' },
    { id: 'tickets', label: 'Tickets em Aberto', value: openTicketsCount.toLocaleString('pt-BR'), change: 'dados reais', trend: 'up' as const, icon: '🎧' },
  ]

  return (
    <div className="p-5 space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-xs text-amber-800">
        ⚠️ <strong>Contatos, Pipeline, Tarefas e Suporte: dados reais.</strong> Marketing será ativado na Fase 6.
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi) => <KpiCard key={kpi.id} {...kpi} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FunnelChart data={MOCK_FUNNEL} />
        <ActivityFeed activities={MOCK_ACTIVITIES} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DealsList deals={MOCK_DEALS} />
        <UpcomingTasks tasks={upcomingTasks} />
      </div>
    </div>
  )
}
