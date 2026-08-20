import { supabase } from './supabase'
import type { Message } from '@/types'

// Récupérer tous les messages (CPM <-> DAGE)
export async function getMessages(): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as unknown as Message[]
}

// Envoyer un message texte
export async function envoyerMessage(data: {
  expediteurId: string
  expediteurNom: string
  expediteurRole: string
  contenu: string
  dossierRef?: string
}): Promise<void> {
  const { error } = await supabase.from('messages').insert({
    expediteur_id: data.expediteurId,
    expediteur_nom: data.expediteurNom,
    expediteur_role: data.expediteurRole,
    contenu: data.contenu,
    type: 'texte',
    lu: false,
    dossier_ref: data.dossierRef ?? null,
  })
  if (error) throw error
}

// Envoyer un message automatique (ex: dossier traité, alerte deadline)
export async function envoyerMessageAuto(data: {
  expediteurId: string
  expediteurNom: string
  expediteurRole: string
  contenu: string
  dossierRef?: string
}): Promise<void> {
  const { error } = await supabase.from('messages').insert({
    expediteur_id: data.expediteurId,
    expediteur_nom: data.expediteurNom,
    expediteur_role: data.expediteurRole,
    contenu: data.contenu,
    type: 'automatique',
    lu: false,
    dossier_ref: data.dossierRef ?? null,
  })
  if (error) throw error
}

// Uploader un fichier (image/PDF/audio) et envoyer le message
export async function envoyerFichier(data: {
  expediteurId: string
  expediteurNom: string
  expediteurRole: string
  file: File
  type: 'image' | 'pdf' | 'audio'
}): Promise<void> {
  const ext = data.file.name.split('.').pop()
  const path = `messagerie/${Date.now()}_${data.expediteurId}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('gesloc-files')
    .upload(path, data.file)
  if (uploadError) throw uploadError

  const { data: urlData } = supabase.storage.from('gesloc-files').getPublicUrl(path)

  const { error } = await supabase.from('messages').insert({
    expediteur_id: data.expediteurId,
    expediteur_nom: data.expediteurNom,
    expediteur_role: data.expediteurRole,
    contenu: null,
    type: data.type,
    file_url: urlData.publicUrl,
    file_name: data.file.name,
    lu: false,
  })
  if (error) throw error
}

// Marquer tous les messages comme lus
export async function marquerTousLus(): Promise<void> {
  await supabase.from('messages').update({ lu: true }).eq('lu', false)
}

// Écouter les nouveaux messages en temps réel
export function ecouterMessages(callback: (msg: Message) => void) {
  return supabase
    .channel('messages-realtime')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload) => callback(payload.new as unknown as Message)
    )
    .subscribe()
}
