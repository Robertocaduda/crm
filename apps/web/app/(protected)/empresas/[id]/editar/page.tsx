import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import CompanyForm from '@/components/companies/company-form'
import type { Company } from '@crm/shared'

export default async function EditarEmpresaPage({ params }: { params: { id: string } }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value
  if (!token) redirect('/login')

  const res = await fetch(`${process.env.API_URL}/api/companies/${params.id}`, {
    headers: { Cookie: `access_token=${token}` },
    cache: 'no-store',
  })
  if (!res.ok) redirect('/empresas')

  const { data }: { data: Company } = await res.json()
  return <CompanyForm initial={data} />
}
