'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { creerDossierCPM, calculerTypeProcedure } from '@/lib/dossiers'
import { DIRECTIONS_MINISTERE, CATEGORIE_LABELS, PROCEDURE_LABELS } from '@/types'
import type { CategorieMarche, TypeProcedure } from '@/types'

const PROCEDURES_MANUELLES: TypeProcedure[] = ['AMI', 'entente_directe', 'marche_clientele']

export default function NouveauDossierCPM() {
  const router = useRouter()
  const { profile } = useAuth()

  const [categorie, setCategorie] = useState<CategorieMarche | ''>('')
  const [direction, setDirection] = useState('')
  const [montant, setMontant] = useState('')
  const [typeProcedure, setTypeProcedure] = useState<TypeProcedure | ''>('')
  const [procedureManuelle, setProcedureManuelle] = useState(false)
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState('')

  // Calcul automatique quand catégorie + montant sont remplis
  function handleMontantChange(val: string) {
    setMontant(val)
    if (categorie && val && !procedureManuelle) {
      const proc = calculerTypeProcedure(categorie as CategorieMarche, Number(val))
      setTypeProcedure(proc)
    }
  }

  function handleCategorieChange(val: CategorieMarche | '') {
    setCategorie(val)
    if (val && montant && !procedureManuelle) {
      const proc = calculerTypeProcedure(val as CategorieMarche, Number(montant))
      setTypeProcedure(proc)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!profile) return
    if (!categorie || !direction || !montant || !typeProcedure || !deadline) {
      setErreur('Veuillez remplir tous les champs obligatoires.')
      return
    }
    setLoading(true)
    setErreur('')
    try {
      const id = await creerDossierCPM({
        categorie: categorie as CategorieMarche,
        direction,
        montant: Number(montant),
        typeProcedure: typeProcedure as TypeProcedure,
        description,
        deadline: new Date(deadline),
        agentId: profile.id,
        agentNom: profile.display_name,
      })
      router.push(`/cpm/dossiers/${id}`)
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
        <h1 className="text-2xl font-bold text-gray-800">Nouveau dossier CPM</h1>
        <p className="text-gray-500 text-sm mt-1">Le code sera généré automatiquement</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">

        {/* Catégorie */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Catégorie du marché <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(Object.entries(CATEGORIE_LABELS) as [CategorieMarche, string][]).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => handleCategorieChange(key)}
                className={`py-2 rounded-lg border text-sm font-medium transition-colors ${
                  categorie === key
                    ? 'bg-green-700 text-white border-green-700'
                    : 'border-gray-200 text-gray-600 hover:border-green-400'
                }`}
              >
                <span className="block text-lg font-bold">{key}</span>
                <span className="text-xs">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Direction */}
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

        {/* Montant */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Montant TTC (FCFA) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={montant}
            onChange={(e) => handleMontantChange(e.target.value)}
            required
            min="0"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 text-gray-900"
            placeholder="ex: 25000000"
          />
        </div>

        {/* Type de procédure — calculé auto ou manuel */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-gray-700">
              Type de procédure <span className="text-red-500">*</span>
            </label>
            <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
              <input
                type="checkbox"
                checked={procedureManuelle}
                onChange={(e) => {
                  setProcedureManuelle(e.target.checked)
                  setTypeProcedure('')
                }}
                className="rounded"
              />
              Choisir manuellement
            </label>
          </div>

          {!procedureManuelle ? (
            <div className={`px-4 py-3 rounded-lg text-sm font-medium border ${
              typeProcedure
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-gray-50 border-gray-200 text-gray-400'
            }`}>
              {typeProcedure
                ? `✓ ${PROCEDURE_LABELS[typeProcedure as TypeProcedure]}`
                : 'Calculé automatiquement selon catégorie + montant'}
            </div>
          ) : (
            <select
              value={typeProcedure}
              onChange={(e) => setTypeProcedure(e.target.value as TypeProcedure)}
              required
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 text-gray-900 text-sm"
            >
              <option value="">Sélectionner...</option>
              {PROCEDURES_MANUELLES.map((p) => (
                <option key={p} value={p}>{PROCEDURE_LABELS[p]}</option>
              ))}
            </select>
          )}
        </div>

        {/* Deadline */}
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
            Description du dossier
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
          {loading ? 'Enregistrement...' : 'Créer le dossier'}
        </button>
      </form>
    </div>
  )
}
