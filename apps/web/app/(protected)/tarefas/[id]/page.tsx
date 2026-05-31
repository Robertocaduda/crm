import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import TaskForm from '@/components/tasks/task-form'
import type { Task } from '@crm/shared'

export default async function EditarTarefaPage({ params }: { params: { id: string } }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value
  if (!token) redirect('/login')

  const res = await fetch(`${process.env.API_URL}/api/tasks/${params.id}`, {
    headers: { Cookie: `access_token=${token}` },
    cache: 'no-store',
  })
  if (!res.ok) redirect('/tarefas')

  const { data }: { data: Task } = await res.json()
  return <TaskForm initial={data} />
}
