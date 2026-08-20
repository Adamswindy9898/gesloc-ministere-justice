import { supabase } from './supabase'
import type { UserProfile } from '@/types'

// Convertit un matricule en email interne (ex: CPM001 → CPM001@gesloc.sn)
export function matriculeToEmail(matricule: string): string {
  const m = matricule.trim().toUpperCase()
  if (m.includes('@')) return m  // déjà un email
  return `${m}@gesloc.sn`
}

export async function signIn(matricule: string, password: string) {
  const email = matriculeToEmail(matricule)
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  const profile = await getUserProfile(data.user.id)
  return { user: data.user, profile }
}

export async function signOut() {
  await supabase.auth.signOut()
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', uid)
    .single()
  if (error || !data) return null
  return data as UserProfile
}
