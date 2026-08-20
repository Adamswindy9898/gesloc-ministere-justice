'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { creerDossierDAGE } from '@/lib/dossiers'
import { DIRECTIONS_MINISTERE } from '@/types'

const TYPES_DOSSIER = [
  'Marché public (Travaux)',
  'Marché public (Fournitures)',
  'Marché public (Services)',
  'Marché public (Prestations intellectuelles)',
  'Demande de matériel / équipement',
  'Courrier administratif',
  'Dossier budgétaire',
  'Autre',
]

export default function NouveauDossierDAGE() {
  const router = useRouter()
  const { profile } = useAuth()

  const [typeDossier, setTypeDossier] = useState('')
  const [direction, setDirection] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!profile) return
    if (!typeDossier || !direction || !deadline) {
      setErreur('Veuillez remplir tous les champs obligatoires.')
      return
    }
    setLoading(true)
    setErreur('')
    try {
      const id = await creerDossierDAGE({
        typeDossier,
        direction,
        description,
        deadline: new Date(deadline),
        agentId: profile.id,
        agentNom: profile.display_name,
      })
      router.push(`/dage/dossiers/${id}`)
    } catch {
      setErreur('Erreur lors de la création. Vérifiez votre connexion Supabase.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-sm mb-2">
          ← Retour
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Enregistrer un dossier</h1>
        <p className="text-gray-500 text-sm mt-1">Le code sera généré automatiquement</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">

        {/* Type de dossier */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type de dossier <span className="text-red-500">*</span>
          </label>
          <select
            value={typeDossier}
            onChange={(e) => setTypeDossier(e.target.value)}
            required
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 text-gray-900 text-sm"
          >
            <option value="">Sélectionner un type...</option>
            {TYPES_DOSSIER.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Direction concernée */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Direction concernée <span className="text-red-500">*</span>
          </label>
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
            required
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 text-gray-900 text-sm"
          >
            <option value="">Sélectionner une direction...</option>
            {DIRECTIONS_MINISTERE.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Date limite */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date limite de traitement <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            required
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 text-gray-900"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 text-gray-900 text-sm resize-none"
            placeholder="Décrivez brièvement le dossier..."
          />
        </div>

        {erreur && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg">
            {erreur}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-colors"
        >
          {loading ? 'Enregistrement...' : 'Enregistrer le dossier'}
        </button>
      </form>
    </div>
  )
}
