import { supabase } from './supabase'
import type { Dossier, CategorieMarche, TypeProcedure, StatutDossier } from '@/types'

// Récupérer les agents d'un service (CPM ou DAGE)
export async function getAgentsService(service: 'CPM' | 'DAGE'): Promise<{ id: string; display_name: string; role: string }[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, role')
    .eq('service', service)
    .order('display_name')
  if (error || !data) return []
  return data
}

// Calcul automatique du type de procédure selon catégorie + montant (FCFA TTC)
export function calculerTypeProcedure(categorie: CategorieMarche, montant: number): TypeProcedure {
  if (categorie === 'T') {
    if (montant < 5_000_000) return 'DRP_simple'
    if (montant < 25_000_000) return 'DRP_restreinte'
    if (montant < 70_000_000) return 'DRP_competition_ouverte'
    return 'AO_ouvert'
  }
  if (categorie === 'F' || categorie === 'S') {
    if (montant < 3_000_000) return 'DRP_simple'
    if (montant < 15_000_000) return 'DRP_restreinte'
    if (montant < 50_000_000) return 'DRP_competition_ouverte'
    return 'AO_ouvert'
  }
  // C — Prestations intellectuelles
  if (montant < 5_000_000) return 'DRP_simple'
  if (montant < 25_000_000) return 'DRP_restreinte'
  if (montant < 50_000_000) return 'DRP_competition_ouverte'
  return 'AO_ouvert'
}

// Abréviation d'une direction pour le code
function abrevDirection(direction: string): string {
  const match = direction.match(/\(([^)]+)\)/)
  if (match) return match[1]
  return direction.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 5)
}

// Prochain numéro de séquence pour un préfixe donné
async function getProchainNumero(espace: string, prefixe: string): Promise<number> {
  const { count } = await supabase
    .from('dossiers')
    .select('*', { count: 'exact', head: true })
    .eq('espace', espace)
    .eq('prefixe_code', prefixe)
  return (count ?? 0) + 1
}

// Crée un dossier CPM
export async function creerDossierCPM(data: {
  categorie: CategorieMarche
  direction: string
  montant: number
  typeProcedure: TypeProcedure
  description: string
  deadline: Date
  agentId: string
  agentNom: string
}): Promise<string> {
  const abrev = abrevDirection(data.direction)
  const prefixe = `${data.categorie}_${abrev}`
  const num = await getProchainNumero('CPM', prefixe)
  const code = `${prefixe}_${num}`

  const { data: row, error } = await supabase.from('dossiers').insert({
    code,
    prefixe_code: prefixe,
    espace: 'CPM',
    type_dossier: data.categorie,
    categorie: data.categorie,
    direction: data.direction,
    montant: data.montant,
    type_procedure: data.typeProcedure,
    statut: 'receptionne' as StatutDossier,
    agent_recepteur_id: data.agentId,
    agent_recepteur_nom: data.agentNom,
    agent_en_charge_id: null,
    agent_en_charge_nom: null,
    deadline: data.deadline.toISOString(),
    description: data.description,
    couleur_delai: 'vert',
  }).select('id').single()

  if (error) throw error

  // Enregistre la première étape d'historique
  await supabase.from('historique').insert({
    dossier_id: row.id,
    etape: 'Dossier réceptionné',
    agent_id: data.agentId,
    agent_nom: data.agentNom,
  })

  return row.id
}

// Crée un dossier DAGE
export async function creerDossierDAGE(data: {
  typeDossier: string
  direction: string
  description: string
  deadline: Date
  agentId: string
  agentNom: string
}): Promise<string> {
  const abrev = abrevDirection(data.direction)
  const prefixe = `DAGE_${abrev}`
  const num = await getProchainNumero('DAGE', prefixe)
  const code = `${prefixe}_${num}`

  const { data: row, error } = await supabase.from('dossiers').insert({
    code,
    prefixe_code: prefixe,
    espace: 'DAGE',
    type_dossier: data.typeDossier,
    direction: data.direction,
    statut: 'receptionne' as StatutDossier,
    agent_recepteur_id: data.agentId,
    agent_recepteur_nom: data.agentNom,
    agent_en_charge_id: null,
    agent_en_charge_nom: null,
    deadline: data.deadline.toISOString(),
    description: data.description,
    couleur_delai: 'vert',
  }).select('id').single()

  if (error) throw error

  await supabase.from('historique').insert({
    dossier_id: row.id,
    etape: 'Dossier enregistré',
    agent_id: data.agentId,
    agent_nom: data.agentNom,
  })

  return row.id
}

// Imputer un dossier à un agent
export async function imputerDossier(
  dossierId: string,
  agentId: string,
  agentNom: string,
  imputeParId: string,
  imputeParNom: string,
): Promise<void> {
  await supabase.from('dossiers').update({
    agent_en_charge_id: agentId,
    agent_en_charge_nom: agentNom,
    statut: 'impute',
  }).eq('id', dossierId)

  await supabase.from('historique').insert({
    dossier_id: dossierId,
    etape: `Dossier imputé à ${agentNom}`,
    agent_id: imputeParId,
    agent_nom: imputeParNom,
  })
}

// Changer le statut d'un dossier
export async function changerStatut(
  dossierId: string,
  nouveauStatut: StatutDossier,
  agentId: string,
  agentNom: string,
  commentaire?: string,
): Promise<void> {
  await supabase.from('dossiers').update({ statut: nouveauStatut }).eq('id', dossierId)
  await supabase.from('historique').insert({
    dossier_id: dossierId,
    etape: `Statut : ${nouveauStatut}`,
    agent_id: agentId,
    agent_nom: agentNom,
    commentaire: commentaire ?? null,
  })
}

// Récupérer tous les dossiers d'un espace
export async function getDossiers(espace: 'CPM' | 'DAGE'): Promise<Dossier[]> {
  const { data, error } = await supabase
    .from('dossiers')
    .select('*, historique(*)')
    .eq('espace', espace)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as Dossier[]
}

// Récupérer un dossier par ID
export async function getDossier(id: string): Promise<Dossier | null> {
  const { data, error } = await supabase
    .from('dossiers')
    .select('*, historique(*)')
    .eq('id', id)
    .single()
  if (error || !data) return null
  return data as unknown as Dossier
}

// Uploader un document sur un dossier
export async function uploaderDocument(
  dossierId: string,
  file: File,
  agentId: string,
  agentNom: string,
): Promise<void> {
  const ext = file.name.split('.').pop()
  const path = `dossiers/${dossierId}/${Date.now()}_${file.name}`

  const { error: uploadError } = await supabase.storage
    .from('gesloc-documents')
    .upload(path, file)
  if (uploadError) throw uploadError

  const { data: urlData } = supabase.storage.from('gesloc-documents').getPublicUrl(path)

  // Récupérer les documents existants
  const { data: dossier } = await supabase
    .from('dossiers')
    .select('documents')
    .eq('id', dossierId)
    .single()

  const docs = dossier?.documents ?? []
  docs.push({
    id: Date.now().toString(),
    nom: file.name,
    url: urlData.publicUrl,
    type: file.type,
    uploadePar: agentNom,
    uploadeLe: new Date().toISOString(),
  })

  await supabase.from('dossiers').update({ documents: docs }).eq('id', dossierId)

  await supabase.from('historique').insert({
    dossier_id: dossierId,
    etape: `Document ajouté : ${file.name}`,
    agent_id: agentId,
    agent_nom: agentNom,
  })
}

// Calcul de la couleur de délai
export function getCouleurDelai(deadline: string | Date): 'vert' | 'orange' | 'rouge' {
  const d = typeof deadline === 'string' ? new Date(deadline) : deadline
  const diff = d.getTime() - Date.now()
  const jours = diff / (1000 * 60 * 60 * 24)
  if (jours < 0) return 'rouge'
  if (jours < 2) return 'orange'
  return 'vert'
}
