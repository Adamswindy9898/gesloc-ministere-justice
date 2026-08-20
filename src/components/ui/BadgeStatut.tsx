import { STATUT_LABELS } from '@/types'
import type { StatutDossier, CouleurDelai } from '@/types'

export function BadgeStatut({ statut }: { statut: StatutDossier }) {
  const styles: Record<StatutDossier, string> = {
    receptionne: 'bg-blue-100 text-blue-700',
    impute: 'bg-purple-100 text-purple-700',
    en_cours: 'bg-yellow-100 text-yellow-700',
    en_attente_info: 'bg-orange-100 text-orange-700',
    traite: 'bg-green-100 text-green-700',
    archive: 'bg-gray-100 text-gray-600',
  }
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${styles[statut]}`}>
      {STATUT_LABELS[statut]}
    </span>
  )
}

export function BadgeDelai({ couleur }: { couleur: CouleurDelai }) {
  const map = {
    vert: { cls: 'bg-green-500', label: '' },
    orange: { cls: 'bg-orange-400', label: '' },
    rouge: { cls: 'bg-red-500', label: '' },
  }
  const { cls } = map[couleur]
  return <span className={`inline-block w-3 h-3 rounded-full ${cls}`} title={couleur} />
}
