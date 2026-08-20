'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getMessages, envoyerMessage, envoyerFichier, marquerTousLus, ecouterMessages } from '@/lib/messagerie'
import BulleMessage from '@/components/ui/BulleMessage'
import type { Message } from '@/types'

// Son de notification
function jouerSon() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.3)
  } catch {
    // Navigateur sans AudioContext
  }
}

export default function MessagerieUI() {
  const { profile } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [texte, setTexte] = useState('')
  const [loading, setLoading] = useState(true)
  const [envoi, setEnvoi] = useState(false)
  const [enregistrement, setEnregistrement] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    getMessages().then(m => { setMessages(m); setLoading(false) })
    marquerTousLus()

    // Écoute temps réel
    const channel = ecouterMessages((nouveau) => {
      setMessages(prev => [...prev, nouveau])
      jouerSon()
    })

    return () => { supabaseCleanup(channel) }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function supabaseCleanup(channel: ReturnType<typeof ecouterMessages>) {
    channel.unsubscribe()
  }

  async function handleEnvoyer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!texte.trim() || !profile || envoi) return
    setEnvoi(true)
    await envoyerMessage({
      expediteurId: profile.id,
      expediteurNom: profile.display_name,
      expediteurRole: profile.role,
      contenu: texte.trim(),
    })
    setTexte('')
    setEnvoi(false)
  }

  async function handleFichier(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    const ext = file.name.split('.').pop()?.toLowerCase()
    const type = ext === 'pdf' ? 'pdf' : ['jpg','jpeg','png','gif','webp'].includes(ext ?? '') ? 'image' : null
    if (!type) return
    await envoyerFichier({
      expediteurId: profile.id,
      expediteurNom: profile.display_name,
      expediteurRole: profile.role,
      file,
      type,
    })
    e.target.value = ''
  }

  async function handleVocal() {
    if (!profile) return
    if (enregistrement) {
      mediaRecorderRef.current?.stop()
      setEnregistrement(false)
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = e => chunksRef.current.push(e.data)
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const file = new File([blob], `vocal_${Date.now()}.webm`, { type: 'audio/webm' })
        await envoyerFichier({
          expediteurId: profile.id,
          expediteurNom: profile.display_name,
          expediteurRole: profile.role,
          file,
          type: 'audio',
        })
        stream.getTracks().forEach(t => t.stop())
      }
      mr.start()
      mediaRecorderRef.current = mr
      setEnregistrement(true)
    } catch {
      alert("Impossible d'accéder au microphone.")
    }
  }

  if (!profile) return null

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* En-tête */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-lg">💬</div>
        <div>
          <p className="font-semibold text-gray-800">Messagerie CPM ↔ DAGE</p>
          <p className="text-xs text-gray-400">Échanges officiels entre la CPM et la DAGE</p>
        </div>
      </div>

      {/* Zone des messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <p className="text-4xl mb-3">💬</p>
              <p className="text-gray-500 text-sm">Aucun message pour le moment</p>
              <p className="text-gray-400 text-xs mt-1">Commencez la conversation</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((m, i) => (
              <BulleMessage
                key={(m as unknown as { id: string }).id ?? i}
                message={m}
                estMoi={m.expediteurId === profile.id}
              />
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Barre d'envoi */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        {enregistrement && (
          <div className="flex items-center gap-2 mb-2 text-red-500 text-sm">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            Enregistrement vocal en cours... Cliquez sur 🎤 pour arrêter
          </div>
        )}
        <form onSubmit={handleEnvoyer} className="flex items-center gap-2">
          {/* Fichier */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-gray-400 hover:text-green-600 transition-colors text-xl p-1"
            title="Joindre image ou PDF"
          >
            📎
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={handleFichier}
            className="hidden"
          />

          {/* Vocal */}
          <button
            type="button"
            onClick={handleVocal}
            className={`text-xl p-1 transition-colors ${enregistrement ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-green-600'}`}
            title="Note vocale"
          >
            🎤
          </button>

          {/* Champ texte */}
          <input
            type="text"
            value={texte}
            onChange={e => setTexte(e.target.value)}
            placeholder="Écrire un message..."
            className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          {/* Envoyer */}
          <button
            type="submit"
            disabled={!texte.trim() || envoi}
            className="w-9 h-9 bg-green-700 hover:bg-green-800 disabled:opacity-40 text-white rounded-full flex items-center justify-center transition-colors"
          >
            <svg className="w-4 h-4 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  )
}
