export type UserRole = 'agent_CPM' | 'coordonnateur_CPM' | 'admin_DAGE' | 'agent_DAGE'

export interface UserProfile {
  id: string
  email?: string
  display_name: string
  role: UserRole
  matricule: string
  service: 'CPM' | 'DAGE'
  created_at?: string
}

// Les 11 directions du ministère (table modifiable, pas en dur dans le code)
export const DIRECTIONS_MINISTERE = [
  'Direction générale de l\'Administration pénitentiaire (DGAP)',
  'Direction générale de la Protection judiciaire et sociale (DGPJS)',
  'Direction des Affaires civiles et du Sceau (DACS)',
  'Direction des Affaires criminelles et des Grâces (DACG)',
  'Direction des Services judiciaires (DSJ)',
  'Direction de la Justice de Proximité et de la Promotion de l\'Accès au Droit (DJPPAD)',
  'Direction des Droits humains (DDH)',
  'Direction de la Dématérialisation et de l\'Automatisation (DDA)',
  'Direction de la Promotion de la Bonne Gouvernance (DPBG)',
  'Direction du Suivi et de l\'Évaluation des Politiques de Bonne Gouvernance (DSEPBG)',
  'Direction de l\'Administration Générale et de l\'Équipement (DAGE)',
] as const

export type Direction = typeof DIRECTIONS_MINISTERE[number]

// Catégories de marché (CPM uniquement)
export type CategorieMarche = 'T' | 'F' | 'S' | 'C'

export const CATEGORIE_LABELS: Record<CategorieMarche, string> = {
  T: 'Travaux',
  F: 'Fournitures',
  S: 'Services courants',
  C: 'Prestations intellectuelles',
}

// Types de procédure (CPM uniquement)
export type TypeProcedure =
  | 'DRP_simple'
  | 'DRP_restreinte'
  | 'DRP_competition_ouverte'
  | 'AO_ouvert'
  | 'AMI'
  | 'entente_directe'
  | 'marche_clientele'

export const PROCEDURE_LABELS: Record<TypeProcedure, string> = {
  DRP_simple: 'DRP Simple',
  DRP_restreinte: 'DRP Restreinte',
  DRP_competition_ouverte: 'DRP Compétition ouverte',
  AO_ouvert: "Appel d'offres ouvert",
  AMI: "Avis à Manifestation d'Intérêt (AMI)",
  entente_directe: 'Entente directe',
  marche_clientele: 'Marché de clientèle',
}

// Statuts d'un dossier
export type StatutDossier =
  | 'receptionne'
  | 'impute'
  | 'en_cours'
  | 'en_attente_info'
  | 'traite'
  | 'archive'

export const STATUT_LABELS: Record<StatutDossier, string> = {
  receptionne: 'Réceptionné',
  impute: 'Imputé',
  en_cours: 'En cours',
  en_attente_info: "En attente d'info",
  traite: 'Traité',
  archive: 'Archivé',
}

// Couleur de délai
export type CouleurDelai = 'vert' | 'orange' | 'rouge'

export interface Dossier {
  id: string
  code: string                        // ex: T_DAGE_675 (CPM) ou auto-généré (DAGE)
  espace: 'CPM' | 'DAGE'             // à quel espace appartient ce dossier
  typeDossier: string                 // Pour DAGE : libre (marché, matériel, courrier...) ; Pour CPM : catégorie T/F/S/C
  categorie?: CategorieMarche         // CPM uniquement
  direction: string                   // direction concernée (parmi les 11)
  montant?: number                    // CPM uniquement
  typeProcedure?: TypeProcedure       // CPM uniquement
  statut: StatutDossier
  agentRecepteurId: string
  agentRecepteurNom: string
  agentEnChargeId: string | null
  agentEnChargeNom: string | null
  deadline: Date
  dateReception: Date
  description: string
  documents: DocumentAttache[]
  historique: HistoriqueEtape[]
  couleurDelai?: CouleurDelai
}

export interface DocumentAttache {
  id: string
  nom: string
  url: string
  type: string
  uploadePar: string
  uploadeLe: Date
}

export interface HistoriqueEtape {
  etape: string
  agentId: string
  agentNom: string
  timestamp: Date
  commentaire?: string
}

export interface Message {
  id: string
  expediteurId: string
  expediteurNom: string
  expediteurRole: UserRole
  contenu: string
  type: 'texte' | 'image' | 'pdf' | 'audio' | 'automatique'
  fileUrl?: string
  fileName?: string
  lu: boolean
  timestamp: Date
  dossierRef?: string
}
