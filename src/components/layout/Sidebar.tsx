'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { signOut } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

interface NavItem {
  href: string
  label: string
  icon: string
  badge?: boolean
}

const CPM_NAV: NavItem[] = [
  { href: '/cpm', label: 'Tableau de bord', icon: '📊' },
  { href: '/cpm/dossiers', label: 'Dossiers', icon: '📁' },
  { href: '/cpm/messagerie', label: 'Messagerie DAGE', icon: '💬', badge: true },
  { href: '/cpm/documents', label: 'Générer documents', icon: '📄' },
  { href: '/cpm/mame', label: 'Assistant Mame', icon: '🤖' },
]

const DAGE_NAV: NavItem[] = [
  { href: '/dage', label: 'Tableau de bord', icon: '📊' },
  { href: '/dage/dossiers', label: 'Dossiers', icon: '📁' },
  { href: '/dage/dossiers/nouveau', label: 'Nouveau dossier', icon: '📥' },
  { href: '/dage/messagerie', label: 'Messagerie CPM', icon: '💬', badge: true },
]

function getRoleLabel(role: string | undefined) {
  switch (role) {
    case 'coordonnateur_CPM': return '👑 Coordonnatrice CPM'
    case 'agent_CPM': return 'Agent CPM'
    case 'admin_DAGE': return '👑 Admin DAGE'
    case 'agent_DAGE': return 'Agent DAGE'
    default: return 'Agent'
  }
}

export default function Sidebar() {
  const { profile } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [messagesNonLus, setMessagesNonLus] = useState(0)

  const isCPM = profile?.role === 'agent_CPM' || profile?.role === 'coordonnateur_CPM'
  const nav = isCPM ? CPM_NAV : DAGE_NAV

  // Compter les messages non lus
  useEffect(() => {
    if (!profile) return

    const compterNonLus = async () => {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('lu', false)
        .neq('expediteur_id', profile.id)
      setMessagesNonLus(count ?? 0)
    }

    compterNonLus()

    // Écoute temps réel des nouveaux messages
    const channel = supabase
      .channel('notif-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' },
        () => compterNonLus()
      )
      .subscribe()

    return () => { channel.unsubscribe() }
  }, [profile])

  // Remettre à zéro quand on ouvre la messagerie
  useEffect(() => {
    if (pathname.includes('messagerie')) {
      setMessagesNonLus(0)
    }
  }, [pathname])

  async function handleSignOut() {
    await signOut()
    router.push('/login')
  }

  return (
    <aside className="w-64 min-h-screen bg-green-900 text-white flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-green-700">
        <div className="flex items-center gap-3">
          <span className="text-2xl">&#9878;</span>
          <div>
            <p className="font-bold text-sm leading-tight">GESLOC</p>
            <p className="text-green-300 text-xs">Ministère de la Justice</p>
          </div>
        </div>
      </div>

      {/* Profil */}
      {profile && (
        <div className="px-6 py-4 border-b border-green-700 bg-green-800/50">
          <p className="font-semibold text-sm truncate">{profile.display_name}</p>
          <p className="text-green-300 text-xs mt-0.5">{getRoleLabel(profile.role)}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-yellow-500 text-green-900 font-semibold'
                  : 'text-green-100 hover:bg-green-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-base">{item.icon}</span>
                {item.label}
              </div>
              {/* Badge notification */}
              {item.badge && messagesNonLus > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {messagesNonLus > 9 ? '9+' : messagesNonLus}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Déconnexion */}
      <div className="px-3 py-4 border-t border-green-700">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-green-200 hover:bg-green-700 transition-colors"
        >
          <span>🚪</span>
          Se déconnecter
        </button>
      </div>
    </aside>
  )
}
