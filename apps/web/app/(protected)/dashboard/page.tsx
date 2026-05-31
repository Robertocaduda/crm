import { cookies } from 'next/headers'
import FunnelChart from '@/components/dashboard/funnel-chart'
import ActivityFeed from '@/components/dashboard/activity-feed'
import DealsList from '@/components/dashboard/deals-list'
import UpcomingTasks from '@/components/dashboard/upcoming-tasks'
import KpiCard from '@/components/dashboard/kpi-card'
import {
  MOCK_FUNNEL,
  MOCK_ACTIVITIES,
  MOCK_DEALS,
  MOCK_TASKS,
} from '@/lib/mock-data'

async function getContactCount(): Promise<number> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('access_token')?.value
    if (!token) return 0
    const res = await fetch(`${process.env.API_URL}/api/contacts?limit=1`, {
      headers: { Cookie: `access_token=${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return 0
    const data = await res.json()
    return data.meta?.total ?? 0
  } catch {
    return 0
  }
}

export default async function DashboardPage() {
  const contactCount = await getContactCount()

  const kpis = [
    { id: 'contacts', label: 'Total de Contatos', value: contactCount.toLocaleString('pt-BR'), change: 'dados reais', trend: 'up' as const, icon: '👥' },
    { id: 'deals', label: 'Negociações Abertas', value: '47', change: '↑ 5 esta semana', trend: 'up' as const, icon: '💼' },
    { id: 'revenue', label: 'Receita Prevista', value: 'R$ 218k', change: '↓ 3% vs mês anterior', trend: 'down' as const, icon: '💰' },
    { id: 'tickets', label: 'Tickets em Aberto', value: '23', change: '↑ 2 hoje', trend: 'up' as const, icon: '🎧' },
  ]

  return (
    <div className="p-5 space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-xs text-amber-800">
        ⚠️ <strong>Contatos: dados reais.</strong> Demais módulos serão ativados nas próximas fases.
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
        <UpcomingTasks tasks={MOCK_TASKS} />
      </div>
    </div>
  )
}
