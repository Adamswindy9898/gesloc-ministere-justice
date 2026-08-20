import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Supabase côté serveur avec la clé service (si disponible) ou anon
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const SYSTEM_PROMPT = `Tu es Mame, l'assistant IA officiel de GESLOC — le système de gestion des dossiers du Ministère de la Justice du Sénégal.

GESLOC est utilisé par :
- La CPM (Cellule de Passation des Marchés) : 5 agents (Mme THIAW, Mme SOURANG coordonnatrice, M. DIARRA, M. DIAGNE, M. MBAYE)
- La DAGE (Direction de l'Administration Générale et de l'Équipement) : 9 agents dont M. Ibrahima FALL (admin)

CE QUE TU SAIS FAIRE :
1. DOSSIERS : statut, historique, qui a reçu/imputé/traité un dossier, délai restant
2. STATISTIQUES : nombre de dossiers par statut (reçus, en cours, en retard, traités, archivés)
3. PROCÉDURES : expliquer les types (DRP simple/restreinte/compétition ouverte, AO ouvert, AMI, entente directe)
4. SEUILS : montants FCFA pour chaque type de procédure selon la catégorie
5. NAVIGATION : expliquer comment utiliser GESLOC (créer dossier, imputer, archiver, messagerie, documents PDF)
6. DÉLAIS : identifier les dossiers en retard ou deadline proche

SEUILS DE PROCÉDURE (FCFA TTC) :
Travaux (T) : DRP simple < 5M | DRP restreinte < 25M | DRP compétition 25M-70M | AO ouvert ≥ 70M
Fournitures/Services (F/S) : DRP simple < 3M | DRP restreinte < 15M | DRP compétition 15M-50M | AO ouvert ≥ 50M
Prestations intellectuelles (C) : DRP simple < 5M | DRP restreinte < 25M | DRP compétition 25M-50M | AO ouvert ≥ 50M

CODES DOSSIERS : format [Catégorie]_[Direction]_[Numéro] ex: T_DAGE_12, F_DGAP_3, C_DSJ_7

FONCTIONNALITÉS DE GESLOC :
- Créer un dossier : aller dans "Dossiers" → "Nouveau dossier"
- Imputer : ouvrir la fiche dossier → section Actions → sélectionner un agent
- Archiver : marquer comme "Traité" d'abord, puis "Archiver"
- Messagerie : pour échanger entre CPM et DAGE (texte, PDF, image, vocal)
- Documents PDF : PV ouverture, PV attribution, Rapport évaluation, ANO juridique, ANO DRP
- Accusé de réception : sur chaque fiche dossier → bouton "Accusé de réception"
- Traçabilité : sur chaque fiche dossier → bouton "Fiche traçabilité"
- Assistant Mame : c'est moi ! Je réponds à tes questions

LANGUE : réponds en wolof courant ou français selon comment on te parle. Tu peux aussi répondre en anglais, espagnol ou allemand.

RÈGLES :
- Sois concis et direct
- Cite toujours le code exact du dossier
- Si une info n'est pas dans les données fournies, dis-le honnêtement
- Tu ne modifies pas de données, tu consultes et expliques seulement`

async function getContextDossiers(question: string): Promise<string> {
  try {
    // Cherche un code de dossier dans la question
    const codeMatch = question.match(/[TFSC]_[A-Z]+_\d+/i)

    if (codeMatch) {
      const { data } = await supabase
        .from('dossiers')
        .select('*, historique(*)')
        .ilike('code', codeMatch[0])
        .single()

      if (data) {
        return `\n\nDONNÉES DU DOSSIER ${data.code}:\n${JSON.stringify({
          code: data.code,
          statut: data.statut,
          direction: data.direction,
          type_procedure: data.type_procedure,
          montant: data.montant,
          deadline: data.deadline,
          agent_en_charge: data.agent_en_charge_nom,
          historique: data.historique?.slice(-3),
        }, null, 2)}`
    }
  }

    // Statistiques générales si la question porte sur des stats
    const questionLower = question.toLowerCase()
    const wantsStats = ['combien', 'nombre', 'statistique', 'bañ', 'nit', 'retard', 'délai', 'en cours'].some(k => questionLower.includes(k))

    if (wantsStats) {
      const { data: stats } = await supabase
        .from('dossiers')
        .select('statut, espace, couleur_delai')

      if (stats) {
        const counts = {
          total: stats.length,
          par_statut: stats.reduce((acc: Record<string, number>, d) => {
            acc[d.statut] = (acc[d.statut] || 0) + 1
            return acc
          }, {}),
          en_retard: stats.filter(d => d.couleur_delai === 'rouge').length,
          deadline_proche: stats.filter(d => d.couleur_delai === 'orange').length,
        }
        return `\n\nSTATISTIQUES ACTUELLES DU SYSTÈME:\n${JSON.stringify(counts, null, 2)}`
      }
    }

    return ''
  } catch {
    return ''
  }
}

export async function POST(req: NextRequest) {
  try {
    const { messages, langue } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages invalides' }, { status: 400 })
    }

    const lastMessage = messages[messages.length - 1]?.content ?? ''

    // Récupère le contexte des données réelles
    const contexte = await getContextDossiers(lastMessage)

    // Ajoute le contexte au dernier message si disponible
    const messagesAvecContexte = contexte
      ? [
          ...messages.slice(0, -1),
          {
            role: 'user',
            content: `${lastMessage}\n\n[CONTEXTE SYSTÈME:${contexte}]`,
          },
        ]
      : messages

    const systemWithLang = langue
      ? `${SYSTEM_PROMPT}\n\nLangue préférée de cet agent : ${langue}`
      : SYSTEM_PROMPT

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: systemWithLang,
      messages: messagesAvecContexte.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    })

    const texte = response.content[0].type === 'text' ? response.content[0].text : ''

    return NextResponse.json({ reponse: texte })
  } catch (error) {
    console.error('Erreur Mame:', error)
    return NextResponse.json({ error: 'Erreur du serveur' }, { status: 500 })
  }
}
