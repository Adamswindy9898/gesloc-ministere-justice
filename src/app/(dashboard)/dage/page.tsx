'use client'

import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'

const STATS = [
  { label: 'Dossiers enregistrés', value: '0', icon: '📁', color: 'bg-blue-50 border-blue-200', textColor: 'text-blue-700' },
  { label: 'En cours', value: '0', icon: '⚙️', color: 'bg-yellow-50 border-yellow-200', textColor: 'text-yellow-700' },
  { label: 'En retard', value: '0', icon: '🔴', color: 'bg-red-50 border-red-200', textColor: 'text-red-700' },
  { label: 'Archivés', value: '0', icon: '✅', color: 'bg-green-50 border-green-200', textColor: 'text-green-700' },
]

const ACTIONS = [
  {
    href: '/dage/dossiers/nouveau',
    icon: '📥',
    titre: 'Enregistrer un dossier',
    desc: 'Un dossier arrive → le créer dans le système',
    couleur: 'bg-green-700 hover:bg-green-800 text-white',
  },
  {
    href: '/dage/dossiers',
    icon: '👤',
    titre: 'Imputer un dossier',
    desc: 'Assigner un dossier à un agent DAGE',
    couleur: 'bg-white hover:border-green-400 border border-gray-200 text-gray-800',
  },
  {
    href: '/dage/dossiers?statut=traite',
    icon: '📦',
    titre: 'Archiver un dossier',
    desc: 'Classer un dossier traité avec ses documents',
    couleur: 'bg-white hover:border-green-400 border border-gray-200 text-gray-800',
  },
  {
    href: '/dage/messagerie',
    icon: '💬',
    titre: 'Messagerie CPM',
    desc: 'Échanger avec la Cellule de Passation des Marchés',
    couleur: 'bg-white hover:border-green-400 border border-gray-200 text-gray-800',
  },
]

export default function DAGEDashboard() {
  const { profile } = useAuth()

  const isAdmin = profile?.role === 'admin_DAGE'
  const greeting = new Date().getHours() < 12 ? 'Bonjour' : 'Bonsoir'

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* En-tête */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {greeting}, {profile?.display_name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Espace DAGE — Direction de l&apos;Administration Générale et de l&apos;Équipement
        </p>
        {isAdmin && (
          <span className="inline-block mt-2 px-3 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
            👑 Administrateur DAGE
          </span>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STATS.map((stat) => (
          <div key={stat.label} className={`border rounded-xl p-4 ${stat.color}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{stat.icon}</span>
              <span className={`text-3xl font-bold ${stat.textColor}`}>{stat.value}</span>
            </div>
            <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* 4 actions principales */}
      <h2 className="font-semibold text-gray-700 mb-3">Actions principales</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`rounded-xl p-5 transition-colors block ${action.couleur}`}
          >
            <span className="text-3xl block mb-2">{action.icon}</span>
            <p className="font-semibold text-sm">{action.titre}</p>
            <p className="text-xs mt-1 opacity-70">{action.desc}</p>
          </Link>
        ))}
      </div>

      {/* Dossiers récents */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Dossiers récents</h2>
          <Link href="/dage/dossiers" className="text-green-600 text-sm hover:underline">
            Voir tout →
          </Link>
        </div>
        <div className="p-6 text-center py-12">
          <span className="text-4xl mb-3 block">📂</span>
          <p className="text-gray-500 text-sm">Aucun dossier enregistré</p>
          <Link href="/dage/dossiers/nouveau" className="mt-3 inline-block text-green-600 text-sm hover:underline">
            Enregistrer le premier dossier →
          </Link>
        </div>
      </div>
    </div>
  )
}
