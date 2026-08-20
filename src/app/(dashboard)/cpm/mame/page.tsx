'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTIONS_CPM = [
  "Combien de dossiers sont en retard ?",
  "Comment créer un nouveau dossier ?",
  "Quels sont les seuils pour un AO ouvert en Travaux ?",
  "Comment générer un PV d'ouverture des plis ?",
  "Mame, dossiers yu dëkk na délai bi ?",
  "Quelle est la différence entre DRP simple et DRP restreinte ?",
  "Comment archiver un dossier ?",
  "Comment imputer un dossier à un agent ?",
]

const LANGUES = [
  { code: 'wolof', label: '🇸🇳 Wolof' },
  { code: 'français', label: '🇫🇷 Français' },
  { code: 'english', label: '🇬🇧 English' },
]

export default function MamePage() {
  const { profile } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [langue, setLangue] = useState('wolof')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Message de bienvenue selon la langue
  const bienvenue: Record<string, string> = {
    wolof: `Dalal ak jàmm, ${profile?.display_name?.split(' ')[0] ?? 'Agent'} ! Mame la, assistant bi ci GESLOC. Loolu ngay laaj ?`,
    français: `Bienvenue, ${profile?.display_name?.split(' ')[0] ?? 'Agent'} ! Je suis Mame, l'assistant IA de GESLOC. Que puis-je faire pour vous ?`,
    english: `Welcome, ${profile?.display_name?.split(' ')[0] ?? 'Agent'}! I'm Mame, GESLOC's AI assistant. How can I help?`,
  }

  async function envoyerMessage(texte?: string) {
    const message = texte ?? input.trim()
    if (!message || loading) return

    const newMessages: Message[] = [...messages, { role: 'user', content: message }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/mame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, langue }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reponse ?? "Bañ naa xam (Je ne sais pas)." }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "Yàgg na. Jëfandikoo ci kanam. (Erreur. Réessayez.)" }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* En-tête */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-xl">🤖</div>
          <div>
            <p className="font-semibold text-gray-800">Assistant Mame</p>
            <p className="text-xs text-gray-400">Branché sur les données réelles de GESLOC</p>
          </div>
        </div>
        {/* Sélecteur de langue */}
        <div className="flex gap-1">
          {LANGUES.map(l => (
            <button
              key={l.code}
              onClick={() => setLangue(l.code)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                langue === l.code
                  ? 'bg-green-700 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Zone de chat */}
      <div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50 space-y-4">

        {/* Message de bienvenue */}
        <div className="flex gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-base flex-shrink-0">🤖</div>
          <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-800 shadow-sm max-w-md">
            {bienvenue[langue]}
          </div>
        </div>

        {/* Suggestions initiales */}
        {messages.length === 0 && (
          <div className="flex gap-3">
            <div className="w-8 h-8 flex-shrink-0" />
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS_CPM.map(s => (
                <button
                  key={s}
                  onClick={() => envoyerMessage(s)}
                  className="text-xs bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-full hover:bg-green-100 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}>
            {m.role === 'assistant' && (
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-base flex-shrink-0">🤖</div>
            )}
            <div className={`px-4 py-3 rounded-2xl text-sm max-w-md shadow-sm ${
              m.role === 'user'
                ? 'bg-green-700 text-white rounded-br-sm'
                : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
            }`}>
              {m.content.split('\n').map((line, j) => (
                <p key={j} className={j > 0 ? 'mt-1' : ''}>{line}</p>
              ))}
            </div>
            {m.role === 'user' && (
              <div className="w-8 h-8 bg-green-700 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {profile?.display_name?.[0] ?? 'A'}
              </div>
            )}
          </div>
        ))}

        {/* Indicateur de frappe */}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-base flex-shrink-0">🤖</div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1.5 items-center h-4">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Barre de saisie */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <form
          onSubmit={e => { e.preventDefault(); envoyerMessage() }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={langue === 'wolof' ? "Laajal Mame..." : langue === 'english' ? "Ask Mame..." : "Posez votre question à Mame..."}
            className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-9 h-9 bg-green-700 hover:bg-green-800 disabled:opacity-40 text-white rounded-full flex items-center justify-center transition-colors"
          >
            <svg className="w-4 h-4 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
        <p className="text-center text-xs text-gray-400 mt-2">
          Mame est branché sur les données de GESLOC · Powered by Claude AI
        </p>
      </div>
    </div>
  )
}
