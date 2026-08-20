'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from '@/lib/auth'

const WELCOME_MESSAGES = [
  { lang: 'Wolof', text: 'Dalal ak jamm' },
  { lang: 'Francais', text: 'Bienvenue' },
  { lang: 'English', text: 'Welcome' },
  { lang: 'Espanol', text: 'Bienvenido' },
  { lang: 'Deutsch', text: 'Willkommen' },
]

export default function LoginPage() {
  const router = useRouter()
  const [matricule, setMatricule] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { profile } = await signIn(matricule, password)
      if (!profile) {
        setError("Profil introuvable. Contactez l'administrateur.")
        setLoading(false)
        return
      }
      if (profile.role === 'agent_CPM' || profile.role === 'coordonnateur_CPM') {
        router.push('/cpm')
      } else if (profile.role === 'agent_DAGE' || profile.role === 'admin_DAGE') {
        router.push('/dage')
      } else {
        router.push('/cpm')
      }
    } catch {
      setError('Matricule ou mot de passe incorrect.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-yellow-700 flex flex-col items-center justify-center p-4">

      {/* Messages de bienvenue */}
      <div className="mb-6 flex flex-wrap justify-center gap-2">
        {WELCOME_MESSAGES.map((w) => (
          <span
            key={w.lang}
            className="px-3 py-1 bg-white/10 text-white text-sm rounded-full backdrop-blur-sm"
          >
            {w.text}
          </span>
        ))}
      </div>

      {/* Card principale */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* En-tete avec logo */}
        <div className="bg-green-800 px-8 py-6 text-center">
          <div className="w-20 h-20 mx-auto bg-white rounded-full flex items-center justify-center mb-3 shadow-lg">
            <span className="text-3xl">&#9878;</span>
          </div>
          <h1 className="text-white font-bold text-lg leading-tight">
            Ministere de la Justice
          </h1>
          <p className="text-green-200 text-sm mt-1">Republique du Senegal</p>
        </div>

        {/* Titre du systeme */}
        <div className="bg-yellow-500 px-8 py-3 text-center">
          <p className="text-green-900 font-bold text-base tracking-wide">
            GESLOC
          </p>
          <p className="text-green-800 text-xs">
            Gestion des dossiers CPM &amp; DAGE
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Matricule
            </label>
            <input
              type="text"
              value={matricule}
              onChange={(e) => setMatricule(e.target.value)}
              required
              autoCapitalize="characters"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent text-gray-900"
              placeholder="ex: CPM001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent text-gray-900"
              placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="px-8 pb-6 text-center">
          <p className="text-xs text-gray-400">
            Acces reserve au personnel autorise du Ministere
          </p>
        </div>
      </div>

      {/* Assistant Mame */}
      <div className="mt-6 flex items-center gap-2 text-white/70 text-sm">
        <span className="text-lg">&#129302;</span>
        <span>Assistant <strong className="text-white">Mame</strong> disponible apres connexion</span>
      </div>
    </div>
  )
}
