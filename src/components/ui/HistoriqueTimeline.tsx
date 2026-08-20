interface Etape {
  id: string
  etape: string
  agent_nom: string
  commentaire?: string
  created_at: string
}

export default function HistoriqueTimeline({ historique }: { historique: Etape[] }) {
  if (!historique || historique.length === 0) {
    return <p className="text-gray-400 text-sm">Aucun historique disponible.</p>
  }

  return (
    <ol className="relative border-l border-gray-200 space-y-6 ml-3">
      {historique.map((h, i) => (
        <li key={h.id ?? i} className="ml-6">
          <span className="absolute -left-3 flex items-center justify-center w-6 h-6 bg-green-100 rounded-full ring-4 ring-white">
            <span className="w-2.5 h-2.5 rounded-full bg-green-600 block" />
          </span>
          <div>
            <p className="text-sm font-semibold text-gray-800">{h.etape}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {h.agent_nom} &mdash;{' '}
              {new Date(h.created_at).toLocaleString('fr-FR', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
            {h.commentaire && (
              <p className="text-xs text-gray-500 mt-1 italic">{h.commentaire}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}
