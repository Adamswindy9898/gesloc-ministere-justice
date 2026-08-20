'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getDossiers } from '@/lib/dossiers'
import { BadgeStatut, BadgeDelai } from '@/components/ui/BadgeStatut'
import type { Dossier, StatutDossier } from '@/types'

const FILTRES: { label: string; valeur: StatutDossier | 'tous' }[] = [
  { label: 'Tous', valeur: 'tous' },
  { label: 'Reçus', valeur: 'receptionne' },
  { label: 'Imputés', valeur: 'impute' },
  { label: 'En cours', valeur: 'en_cours' },
  { label: 'Traités', valeur: 'traite' },
  { label: 'Archivés', valeur: 'archive' },
]

export default function DossiersCPM() {
  const [dossiers, setDossiers] = useState<Dossier[]>([])
  const [filtre, setFiltre] = useState<StatutDossier | 'tous'>('tous')
  const [recherche, setRecherche] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDossiers('CPM').then(d => { setDossiers(d); setLoading(false) })
  }, [])

  const filtres = dossiers
    .filter(d => filtre === 'tous' || d.statut === filtre)
    .filter(d =>
      recherche === '' ||
      d.code.toLowerCase().includes(recherche.toLowerCase()) ||
      d.direction.toLowerCase().includes(recherche.toLowerCase()) ||
      d.description?.toLowerCase().includes(recherche.toLowerCase())
    )

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dossiers CPM</h1>
          <p className="text-gray-500 text-sm mt-1">{dossiers.length} dossier(s) au total</p>
        </div>
        <Link
          href="/cpm/dossiers/nouveau"
          className="bg-green-700 hover:bg-green-800 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
        >
          + Nouveau dossier
        </Link>
      </div>

      {/* Filtres + recherche */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-4 p-4">
        <div className="flex flex-wrap gap-2 mb-3">
          {FILTRES.map(f => (
            <button
              key={f.valeur}
              onClick={() => setFiltre(f.valeur)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filtre === f.valeur
                  ? 'bg-green-700 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
          placeholder="Rechercher par code, direction, description..."
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
        />
      </div>

      {/* Table des dossiers */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Chargement...</p>
          </div>
        ) : filtres.length === 0 ? (
          <div className="p-12 text-center">
            <span className="text-4xl mb-3 block">📂</span>
            <p className="text-gray-500 text-sm">Aucun dossier trouvé</p>
            <Link href="/cpm/dossiers/nouveau" className="mt-3 inline-block text-green-600 text-sm hover:underline">
              Créer le premier dossier →
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Code</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Direction</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Procédure</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Statut</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Délai</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Agent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtres.map(d => (
                <tr key={d.id} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-4 py-3">
                    <Link href={`/cpm/dossiers/${d.id}`} className="font-mono font-semibold text-green-700 hover:underline">
                      {d.code}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{d.direction}</td>
                  <td className="px-4 py-3 text-gray-600">{d.typeProcedure?.replace(/_/g, ' ') ?? '—'}</td>
                  <td className="px-4 py-3"><BadgeStatut statut={d.statut} /></td>
                  <td className="px-4 py-3"><BadgeDelai couleur={d.couleurDelai ?? 'vert'} /></td>
                  <td className="px-4 py-3 text-gray-600">{d.agentEnChargeNom ?? d.agentRecepteurNom}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
