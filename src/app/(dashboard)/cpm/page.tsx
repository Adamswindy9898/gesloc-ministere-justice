'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { getDossiers } from '@/lib/dossiers'
import { envoyerMessageAuto } from '@/lib/messagerie'
import type { Dossier } from '@/types'

export default function CPMDashboard() {
  const { profile } = useAuth()
  const [dossiers, setDossiers] = useState<Dossier[]>([])

  const greeting = new Date().getHours() < 12 ? 'Bonjour' : 'Bonsoir'

  useEffect(() => {
    if (!profile) return
    getDossiers('CPM').then(async (data) => {
      setDossiers(data)

      // Alerte automatique pour les dossiers en retard
      const enRetard = data.filter(d =>
        d.statut !== 'archive' && d.statut !== 'traite' &&
        new Date(d.deadline) < new Date()
      )
      if (enRetard.length > 0) {
        await envoyerMessageAuto({
          expediteurId: profile.id,
          expediteurNom: 'Système GESLOC',
          expediteurRole: profile.role,
          contenu: `⚠️ ${enRetard.length} dossier(s) CPM ont dépassé leur deadline : ${enRetard.map(d => d.code).join(', ')}`,
        })
      }
    })
  }, [profile])

  const stats = [
    { label: 'Dossiers reçus', value: dossiers.length, icon: '📁', color: 'bg-blue-50 border-blue-200', textColor: 'text-blue-700' },
    { label: 'En cours', value: dossiers.filter(d => d.statut === 'en_cours' || d.statut === 'impute').length, icon: '⚙️', color: 'bg-yellow-50 border-yellow-200', textColor: 'text-yellow-700' },
    { label: 'En retard', value: dossiers.filter(d => d.couleurDelai === 'rouge' && d.statut !== 'archive').length, icon: '🔴', color: 'bg-red-50 border-red-200', textColor: 'text-red-700' },
    { label: 'Traités', value: dossiers.filter(d => d.statut === 'traite' || d.statut === 'archive').length, icon: '✅', color: 'bg-green-50 border-green-200', textColor: 'text-green-700' },
  ]

  const recents = dossiers.slice(0, 5)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* En-tête */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {greeting}, {profile?.display_name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className={`border rounded-xl p-4 ${stat.color}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{stat.icon}</span>
              <span className={`text-3xl font-bold ${stat.textColor}`}>{stat.value}</span>
            </div>
            <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Dossiers récents */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Dossiers récents</h2>
          <Link href="/cpm/dossiers" className="text-green-600 text-sm hover:underline">
            Voir tout →
          </Link>
        </div>
        {recents.length === 0 ? (
          <div className="p-6 text-center py-12">
            <span className="text-4xl mb-3 block">📂</span>
            <p className="text-gray-500 text-sm">Aucun dossier pour le moment</p>
            <Link href="/cpm/dossiers/nouveau" className="mt-3 inline-block text-green-600 text-sm hover:underline">
              Créer le premier dossier →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recents.map(d => (
              <Link key={d.id} href={`/cpm/dossiers/${d.id}`}
                className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors">
                <div>
                  <span className="font-mono font-semibold text-green-700 text-sm">{d.code}</span>
                  <p className="text-xs text-gray-400 mt-0.5">{d.direction}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    d.couleurDelai === 'rouge' ? 'bg-red-500' :
                    d.couleurDelai === 'orange' ? 'bg-orange-400' : 'bg-green-500'
                  }`} />
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    d.statut === 'archive' ? 'bg-gray-100 text-gray-600' :
                    d.statut === 'traite' ? 'bg-green-100 text-green-700' :
                    d.statut === 'en_cours' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>{d.statut}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
