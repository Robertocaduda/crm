'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { apiFetch } from '@/lib/api-client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface SidebarProps {
  user: { name: string; email: string; role: string }
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [contactsOpen, setContactsOpen] = useState(
    pathname.startsWith('/contatos') || pathname.startsWith('/empresas') || pathname.startsWith('/tags')
  )
  const [pipelineOpen, setPipelineOpen] = useState(
    pathname.startsWith('/pipeline') || pathname.startsWith('/configuracoes/pipeline')
  )

  const initials = user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()

  async function handleLogout() {
    try { await apiFetch('/api/auth/logout', { method: 'POST' }) } finally {
      router.push('/login')
      router.refresh()
    }
  }

  const isActive = (href: string) => pathname === href

  return (
    <aside className="w-52 bg-slate-900 flex flex-col flex-shrink-0 h-screen">
      <div className="px-4 py-4 border-b border-slate-800">
        <span className="text-white font-bold text-lg tracking-tight">My<span className="text-indigo-400">CRM</span></span>
      </div>

      <nav className="flex-1 py-2 overflow-y-auto">
        <p className="px-4 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Principal</p>

        <Link href="/dashboard" className={`flex items-center gap-2.5 px-4 py-2 text-[13px] transition-colors relative ${isActive('/dashboard') ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
          {isActive('/dashboard') && <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-indigo-500 rounded-r" />}
          <span className="text-sm w-4 text-center">📊</span> Dashboard
        </Link>

        {/* Contatos group */}
        <button
          onClick={() => setContactsOpen((o) => !o)}
          className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
        >
          <span className="text-sm w-4 text-center">👥</span>
          <span>Contatos</span>
          <span className="ml-auto text-slate-600 text-[10px]">{contactsOpen ? '▾' : '▸'}</span>
        </button>

        {contactsOpen && (
          <div className="ml-4 border-l border-slate-800">
            {[
              { label: 'Pessoas', href: '/contatos', icon: '👤' },
              { label: 'Empresas', href: '/empresas', icon: '🏢' },
              { label: 'Tags', href: '/tags', icon: '🏷️' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 pl-4 pr-4 py-2 text-[12px] transition-colors relative ${pathname.startsWith(item.href) ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-white hover:bg-slate-800/50'}`}
              >
                {pathname.startsWith(item.href) && <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-indigo-500 rounded-r" />}
                <span>{item.icon}</span> {item.label}
              </Link>
            ))}
          </div>
        )}

        {/* Pipeline group */}
        <button
          onClick={() => setPipelineOpen((o) => !o)}
          className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
        >
          <span className="text-sm w-4 text-center">💼</span>
          <span>Pipeline</span>
          <span className="ml-auto text-slate-600 text-[10px]">{pipelineOpen ? '▾' : '▸'}</span>
        </button>

        {pipelineOpen && (
          <div className="ml-4 border-l border-slate-800">
            {[
              { label: 'Negociações', href: '/pipeline', icon: '💼' },
              { label: 'Histórico', href: '/pipeline/historico', icon: '📋' },
              { label: 'Configurações', href: '/configuracoes/pipeline', icon: '⚙️' },
            ].map((item) => {
              const active = pathname.startsWith(item.href) &&
                !(item.href === '/pipeline' && pathname.startsWith('/pipeline/historico'))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 pl-4 pr-4 py-2 text-[12px] transition-colors relative ${active ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-white hover:bg-slate-800/50'}`}
                >
                  {active && <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-indigo-500 rounded-r" />}
                  <span>{item.icon}</span> {item.label}
                </Link>
              )
            })}
          </div>
        )}

        <p className="px-4 py-2 mt-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Outros</p>

        {/* Tarefas — ativo */}
        <Link
          href="/tarefas"
          className={`flex items-center gap-2.5 px-4 py-2 text-[13px] transition-colors relative ${pathname.startsWith('/tarefas') ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
        >
          {pathname.startsWith('/tarefas') && <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-indigo-500 rounded-r" />}
          <span className="text-sm w-4 text-center">✅</span> Tarefas
        </Link>

        {/* Suporte — ativo */}
        <Link
          href="/suporte"
          className={`flex items-center gap-2.5 px-4 py-2 text-[13px] transition-colors relative ${pathname.startsWith('/suporte') ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
        >
          {pathname.startsWith('/suporte') && <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-indigo-500 rounded-r" />}
          <span className="text-sm w-4 text-center">🎧</span> Suporte
        </Link>

        {[
          { label: 'Marketing', icon: '📣', phase: 6 },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2.5 px-4 py-2 text-slate-700 cursor-default select-none">
            <span className="text-sm w-4 text-center">{item.icon}</span>
            <span className="text-[13px]">{item.label}</span>
            <span className="ml-auto text-[9px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-full">Fase {item.phase}</span>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-800 p-3 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">{initials}</div>
        <div className="flex-1 overflow-hidden">
          <p className="text-white text-xs font-medium truncate">{user.name}</p>
          <p className="text-slate-500 text-[10px]">{user.role}</p>
        </div>
        <button onClick={handleLogout} title="Sair" className="text-slate-500 hover:text-white text-xs transition-colors">↩</button>
      </div>
    </aside>
  )
}
