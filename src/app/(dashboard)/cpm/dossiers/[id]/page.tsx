'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useRef } from 'react'
import { getDossier, imputerDossier, changerStatut, getAgentsService, uploaderDocument } from '@/lib/dossiers'
import { envoyerMessageAuto } from '@/lib/messagerie'
import { exporterTracabilite, genererAccuseReception } from '@/lib/pdf'
import { BadgeStatut, BadgeDelai } from '@/components/ui/BadgeStatut'
import HistoriqueTimeline from '@/components/ui/HistoriqueTimeline'
import { PROCEDURE_LABELS, CATEGORIE_LABELS } from '@/types'
import type { Dossier, StatutDossier } from '@/types'

export default function FicheDossierCPM() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { profile } = useAuth()

  const [dossier, setDossier] = useState<Dossier | null>(null)
  const [loading, setLoading] = useState(true)
  const [agentChoisi, setAgentChoisi] = useState('')
  const [agentsList, setAgentsList] = useState<{ id: string; display_name: string; role: string }[]>([])
  const [actionLoading, setActionLoading] = useState(false)
  const [commentaire, setCommentaire] = useState('')

  const isCoord = profile?.role === 'coordonnateur_CPM'
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadLoading, setUploadLoading] = useState(false)

  useEffect(() => {
    getDossier(id).then(d => { setDossier(d); setLoading(false) })
    // Charger agents CPM + admin DAGE
    Promise.all([
      getAgentsService('CPM'),
      getAgentsService('DAGE'),
    ]).then(([cpmAgents, dageAgents]) => {
      const adminDAGE = dageAgents.filter(a => a.role === 'admin_DAGE')
      setAgentsList([
        ...cpmAgents,
        ...adminDAGE.map(a => ({ ...a, display_name: `${a.display_name} (DAGE)` })),
      ])
    })
  }, [id])

  async function handleImputer() {
    if (!agentChoisi || !profile || !dossier) return
    setActionLoading(true)
    const agent = agentsList.find(a => a.id === agentChoisi)
    await imputerDossier(id, agentChoisi, agent?.display_name ?? agentChoisi, profile.id, profile.display_name)
    const updated = await getDossier(id)
    setDossier(updated)
    setActionLoading(false)
  }

  async function handleStatut(statut: StatutDossier) {
    if (!profile || !dossier) return
    setActionLoading(true)
    await changerStatut(id, statut, profile.id, profile.display_name, commentaire || undefined)

    // Message automatique vers la DAGE quand le dossier est traité
    if (statut === 'traite') {
      await envoyerMessageAuto({
        expediteurId: profile.id,
        expediteurNom: 'Système GESLOC',
        expediteurRole: profile.role,
        contenu: `✅ La CPM a traité le dossier ${dossier.code}. Vous pouvez consulter le résultat dans le système.`,
        dossierRef: dossier.code,
      })
    }

    const updated = await getDossier(id)
    setDossier(updated)
    setCommentaire('')
    setActionLoading(false)
  }

  function handleAccuseReception() {
    if (!dossier) return
    genererAccuseReception({
      code: dossier.code,
      direction: dossier.direction,
      typeDossier: dossier.typeDossier ?? dossier.categorie ?? '',
      deadline: String(dossier.deadline),
      agentRecepteur: dossier.agentRecepteurNom,
      dateReception: (dossier as unknown as { created_at: string }).created_at ?? new Date().toISOString(),
      espace: 'CPM',
    })
  }

  async function handleUploadDocument(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile || !dossier) return
    setUploadLoading(true)
    try {
      await uploaderDocument(id, file, profile.id, profile.display_name)
      const updated = await getDossier(id)
      setDossier(updated)
    } catch {
      alert('Erreur upload. Vérifiez Supabase Storage.')
    } finally {
      setUploadLoading(false)
      e.target.value = ''
    }
  }

  function handleTelechargerTracabilite() {
    if (!dossier) return
    exporterTracabilite({
      code: dossier.code,
      direction: dossier.direction,
      typeDossier: dossier.typeDossier ?? dossier.categorie ?? '',
      statut: dossier.statut,
      deadline: String(dossier.deadline),
      description: dossier.description,
      agentRecepteur: dossier.agentRecepteurNom,
      agentEnCharge: dossier.agentEnChargeNom,
      historique: historique,
    })
  }

  if (loading) return (
    <div className="p-6 flex items-center justify-center min-h-64">
      <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!dossier) return (
    <div className="p-6 text-center text-gray-500">Dossier introuvable.</div>
  )

  const historique = (dossier as unknown as { historique: { id: string; etape: string; agent_nom: string; commentaire?: string; created_at: string }[] }).historique ?? []

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* En-tête */}
      <div className="mb-6">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-sm mb-3 block">
          ← Retour aux dossiers
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 font-mono">{dossier.code}</h1>
            <p className="text-gray-500 text-sm mt-1">{dossier.direction}</p>
          </div>
          <div className="flex items-center gap-3">
            <BadgeDelai couleur={dossier.couleurDelai ?? 'vert'} />
            <BadgeStatut statut={dossier.statut} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Colonne gauche : infos + actions */}
        <div className="lg:col-span-2 space-y-4">

          {/* Informations du dossier */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Informations</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-400 text-xs mb-0.5">Catégorie</p>
                <p className="font-medium text-gray-800">
                  {dossier.categorie ? `${dossier.categorie} — ${CATEGORIE_LABELS[dossier.categorie]}` : '—'}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-0.5">Procédure</p>
                <p className="font-medium text-gray-800">
                  {dossier.typeProcedure ? PROCEDURE_LABELS[dossier.typeProcedure] : '—'}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-0.5">Montant TTC</p>
                <p className="font-medium text-gray-800">
                  {dossier.montant ? `${dossier.montant.toLocaleString('fr-FR')} FCFA` : '—'}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-0.5">Deadline</p>
                <p className="font-medium text-gray-800">
                  {new Date(dossier.deadline).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-0.5">Reçu par</p>
                <p className="font-medium text-gray-800">{dossier.agentRecepteurNom}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-0.5">En charge</p>
                <p className="font-medium text-gray-800">{dossier.agentEnChargeNom ?? 'Non imputé'}</p>
              </div>
            </div>
            {dossier.description && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-gray-400 text-xs mb-1">Description</p>
                <p className="text-sm text-gray-700">{dossier.description}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          {dossier.statut !== 'archive' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h2 className="font-semibold text-gray-800 mb-4">Actions</h2>
              <div className="space-y-4">

                {/* Imputation — coordonnatrice seulement */}
                {isCoord && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Imputer à un agent (CPM ou DAGE)</p>
                    <div className="flex gap-2">
                      <select
                        value={agentChoisi}
                        onChange={e => setAgentChoisi(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                      >
                        <option value="">Sélectionner un agent...</option>
                        <optgroup label="— Agents CPM —">
                          {agentsList.filter(a => !a.display_name.includes('(DAGE)')).map(a => (
                            <option key={a.id} value={a.id}>{a.display_name}</option>
                          ))}
                        </optgroup>
                        <optgroup label="— Admin DAGE —">
                          {agentsList.filter(a => a.display_name.includes('(DAGE)')).map(a => (
                            <option key={a.id} value={a.id}>{a.display_name}</option>
                          ))}
                        </optgroup>
                      </select>
                      <button
                        onClick={handleImputer}
                        disabled={!agentChoisi || actionLoading}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm rounded-lg font-medium transition-colors"
                      >
                        Imputer
                      </button>
                    </div>
                  </div>
                )}

                {/* Commentaire optionnel */}
                <div>
                  <p className="text-sm text-gray-600 mb-2">Commentaire (optionnel)</p>
                  <input
                    type="text"
                    value={commentaire}
                    onChange={e => setCommentaire(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                    placeholder="Ajouter une note..."
                  />
                </div>

                {/* Boutons de changement de statut */}
                <div className="flex flex-wrap gap-2">
                  {dossier.statut !== 'en_cours' && (
                    <button onClick={() => handleStatut('en_cours')} disabled={actionLoading}
                      className="px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm rounded-lg font-medium transition-colors disabled:opacity-50">
                      Marquer En cours
                    </button>
                  )}
                  {dossier.statut !== 'en_attente_info' && (
                    <button onClick={() => handleStatut('en_attente_info')} disabled={actionLoading}
                      className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded-lg font-medium transition-colors disabled:opacity-50">
                      En attente d&apos;info
                    </button>
                  )}
                  {dossier.statut !== 'traite' && (
                    <button onClick={() => handleStatut('traite')} disabled={actionLoading}
                      className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg font-medium transition-colors disabled:opacity-50">
                      ✓ Marquer Traité
                    </button>
                  )}
                  {dossier.statut === 'traite' && (
                    <button onClick={() => handleStatut('archive')} disabled={actionLoading}
                      className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg font-medium transition-colors disabled:opacity-50">
                      📦 Archiver
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Documents officiels */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
            <p className="font-semibold text-gray-800 text-sm">Documents officiels</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={handleAccuseReception}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg font-medium transition-colors">
                🖨️ Accusé de réception
              </button>
              <button onClick={handleTelechargerTracabilite}
                className="flex items-center gap-2 px-3 py-2 bg-green-700 hover:bg-green-800 text-white text-xs rounded-lg font-medium transition-colors">
                📥 Fiche traçabilité
              </button>
              <button onClick={() => fileInputRef.current?.click()} disabled={uploadLoading}
                className="flex items-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white text-xs rounded-lg font-medium transition-colors">
                📎 {uploadLoading ? 'Upload...' : 'Joindre document'}
              </button>
              <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.jpg,.png"
                onChange={handleUploadDocument} className="hidden" />
            </div>
            {(dossier as unknown as { documents: { id: string; nom: string; url: string; uploadePar: string }[] }).documents?.length > 0 && (
              <div className="border-t border-gray-100 pt-3 space-y-2">
                <p className="text-xs text-gray-500 font-medium">Documents joints :</p>
                {(dossier as unknown as { documents: { id: string; nom: string; url: string; uploadePar: string }[] }).documents.map(doc => (
                  <a key={doc.id} href={doc.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-green-700 hover:underline">
                    📄 {doc.nom} <span className="text-gray-400">— {doc.uploadePar}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Colonne droite : historique */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 h-fit">
          <h2 className="font-semibold text-gray-800 mb-4">Historique</h2>
          <HistoriqueTimeline historique={historique} />
        </div>
      </div>
    </div>
  )
}
