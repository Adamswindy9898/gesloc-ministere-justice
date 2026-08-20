import type { Message } from '@/types'

interface Props {
  message: Message
  estMoi: boolean
}

export default function BulleMessage({ message, estMoi }: Props) {
  const heure = new Date((message as unknown as { created_at: string }).created_at)
    .toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  const estAuto = message.type === 'automatique'

  // Message automatique — centré, style alerte
  if (estAuto) {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs px-4 py-2 rounded-full max-w-sm text-center">
          🤖 {message.contenu}
          <span className="ml-2 text-yellow-500">{heure}</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex ${estMoi ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-xs lg:max-w-md ${estMoi ? 'items-end' : 'items-start'} flex flex-col`}>
        {!estMoi && (
          <p className="text-xs text-gray-400 mb-1 ml-1">{message.expediteurNom}</p>
        )}

        <div className={`px-4 py-2.5 rounded-2xl text-sm ${
          estMoi
            ? 'bg-green-700 text-white rounded-br-sm'
            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'
        }`}>

          {/* Texte */}
          {message.type === 'texte' && <p>{message.contenu}</p>}

          {/* Image */}
          {message.type === 'image' && message.fileUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={message.fileUrl} alt={message.fileName ?? 'image'} className="rounded-lg max-w-full" />
          )}

          {/* PDF */}
          {message.type === 'pdf' && (
            <a href={message.fileUrl} target="_blank" rel="noopener noreferrer"
              className={`flex items-center gap-2 hover:underline ${estMoi ? 'text-green-100' : 'text-green-700'}`}>
              <span className="text-lg">📄</span>
              <span className="text-xs truncate max-w-[180px]">{message.fileName ?? 'Document PDF'}</span>
            </a>
          )}

          {/* Audio */}
          {message.type === 'audio' && message.fileUrl && (
            <audio controls className="max-w-full" src={message.fileUrl} />
          )}

          {/* Référence dossier */}
          {message.dossierRef && (
            <p className={`text-xs mt-1 ${estMoi ? 'text-green-200' : 'text-gray-400'}`}>
              📁 {message.dossierRef}
            </p>
          )}
        </div>

        <p className={`text-xs mt-1 ${estMoi ? 'text-right text-gray-400' : 'text-gray-400'}`}>{heure}</p>
      </div>
    </div>
  )
}
