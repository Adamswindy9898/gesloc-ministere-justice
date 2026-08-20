import jsPDF from 'jspdf'

// Accusé de réception officiel
export function genererAccuseReception(data: {
  code: string
  direction: string
  typeDossier: string
  deadline: string
  agentRecepteur: string
  dateReception: string
  espace: string
}) {
  const doc = new jsPDF()
  const W = doc.internal.pageSize.getWidth()
  const dateDoc = new Date().toLocaleDateString('fr-FR')

  // En-tête officielle
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('REPUBLIQUE DU SENEGAL', 15, 15)
  doc.text('Un Peuple - Un But - Une Foi', 15, 20)
  doc.text('-------------------', 15, 25)
  doc.text('MINISTERE DE LA JUSTICE', 15, 30)
  doc.text('-------------------', 15, 35)
  if (data.espace === 'CPM') {
    doc.text('CELLULE DE PASSATION DES MARCHES (CPM)', 15, 40)
  } else {
    doc.text("DIRECTION DE L'ADMINISTRATION GENERALE", 15, 40)
    doc.text('ET DE L\'EQUIPEMENT (DAGE)', 15, 45)
  }

  doc.setDrawColor(0)
  doc.setLineWidth(0.8)
  doc.line(15, 52, W - 15, 52)

  // Titre
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text("ACCUSE DE RECEPTION", W / 2, 63, { align: 'center' })
  doc.setFontSize(10)
  doc.text(`N° ${data.code}`, W / 2, 70, { align: 'center' })
  doc.line(15, 75, W - 15, 75)

  // Corps
  let y = 88
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  doc.text('Nous soussignés, certifions avoir reçu le dossier suivant :', 15, y); y += 12

  const lignes = [
    ['Référence du dossier', data.code],
    ['Type', data.typeDossier],
    ['Direction concernée', data.direction],
    ['Date de réception', new Date(data.dateReception).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })],
    ['Reçu par', data.agentRecepteur],
    ['Date limite de traitement', new Date(data.deadline).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })],
  ]

  lignes.forEach(([label, valeur]) => {
    doc.setFillColor(248, 250, 248)
    doc.rect(15, y - 5, W - 30, 10, 'F')
    doc.setFont('helvetica', 'bold')
    doc.text(`${label} :`, 18, y)
    doc.setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(valeur, W - 90)
    doc.text(lines, 80, y)
    y += 12
  })

  y += 10
  doc.setFont('helvetica', 'normal')
  doc.text('Le présent accusé de réception confirme la prise en charge du dossier', 15, y); y += 6
  doc.text('susmentionné dans le système GESLOC du Ministère de la Justice.', 15, y); y += 20

  // Signature
  doc.text(`Fait à Thiès, le ${dateDoc}`, W / 2, y, { align: 'center' }); y += 10
  doc.setFont('helvetica', 'bold')
  doc.text('L\'Agent Récepteur', W / 2, y, { align: 'center' }); y += 8
  doc.setFont('helvetica', 'normal')
  doc.text('(Signature et cachet)', W / 2, y, { align: 'center' }); y += 20
  doc.line(W / 2 - 40, y, W / 2 + 40, y); y += 6
  doc.text(data.agentRecepteur, W / 2, y, { align: 'center' })

  // Pied de page
  const H = doc.internal.pageSize.getHeight()
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.line(15, H - 20, W - 15, H - 20)
  doc.text('GESLOC — Ministère de la Justice du Sénégal — Document officiel', 15, H - 14)
  doc.text(`Généré le ${dateDoc}`, W - 15, H - 14, { align: 'right' })

  doc.save(`Accuse_Reception_${data.code}.pdf`)
}

// Export PDF de la traçabilité d'un dossier
export function exporterTracabilite(data: {
  code: string
  direction: string
  typeDossier: string
  statut: string
  deadline: string
  description?: string
  agentRecepteur: string
  agentEnCharge: string | null
  historique: { etape: string; agent_nom: string; commentaire?: string; created_at: string }[]
}) {
  const doc = new jsPDF()
  const W = doc.internal.pageSize.getWidth()
  const dateDoc = new Date().toLocaleDateString('fr-FR')

  // En-tête
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('REPUBLIQUE DU SENEGAL', 15, 15)
  doc.text('Un Peuple - Un But - Une Foi', 15, 20)
  doc.text('MINISTERE DE LA JUSTICE', 15, 25)
  doc.text('GESLOC — Système de Gestion des Dossiers', 15, 30)
  doc.setDrawColor(0)
  doc.setLineWidth(0.5)
  doc.line(15, 35, W - 15, 35)

  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('FICHE DE TRACABILITE DU DOSSIER', W / 2, 45, { align: 'center' })
  doc.setFontSize(11)
  doc.text(data.code, W / 2, 52, { align: 'center' })
  doc.line(15, 57, W - 15, 57)

  // Informations générales
  let y = 65
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('INFORMATIONS GENERALES', 15, y); y += 7
  doc.setFont('helvetica', 'normal')

  const infos = [
    ['Direction concernée', data.direction],
    ['Type de dossier', data.typeDossier],
    ['Statut actuel', data.statut.toUpperCase()],
    ['Deadline', new Date(data.deadline).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })],
    ['Agent récepteur', data.agentRecepteur],
    ['Agent en charge', data.agentEnCharge ?? 'Non imputé'],
  ]

  infos.forEach(([label, valeur]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(`${label} :`, 15, y)
    doc.setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(valeur, W - 80)
    doc.text(lines, 70, y)
    y += lines.length * 6 + 1
  })

  if (data.description) {
    doc.setFont('helvetica', 'bold')
    doc.text('Description :', 15, y)
    doc.setFont('helvetica', 'normal')
    const desc = doc.splitTextToSize(data.description, W - 30)
    y += 6
    doc.text(desc, 15, y)
    y += desc.length * 6
  }

  y += 6
  doc.line(15, y, W - 15, y)
  y += 8

  // Historique
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('HISTORIQUE DES ACTIONS', 15, y); y += 8

  data.historique.forEach((h, i) => {
    if (y > 260) { doc.addPage(); y = 20 }
    const date = new Date(h.created_at).toLocaleString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })

    if (i % 2 === 0) {
      doc.setFillColor(248, 250, 248)
      doc.rect(15, y - 4, W - 30, 14, 'F')
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text(`${i + 1}. ${h.etape}`, 18, y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(`Par : ${h.agent_nom}  —  Le : ${date}`, 18, y + 5)
    if (h.commentaire) {
      doc.text(`Note : ${h.commentaire}`, 18, y + 9)
      y += 16
    } else {
      y += 12
    }
  })

  // Pied de page
  const H = doc.internal.pageSize.getHeight()
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.line(15, H - 20, W - 15, H - 20)
  doc.text('GESLOC — Ministère de la Justice du Sénégal', 15, H - 14)
  doc.text(`Généré le ${dateDoc}`, W - 15, H - 14, { align: 'right' })

  doc.save(`Tracabilite_${data.code}.pdf`)
}

// En-tête officiel commun à tous les documents
function enteteOfficiel(doc: jsPDF, titre: string, reference: string) {
  const W = doc.internal.pageSize.getWidth()

  // Colonne gauche : République du Sénégal
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('REPUBLIQUE DU SENEGAL', 15, 15)
  doc.text('Un Peuple - Un But - Une Foi', 15, 20)
  doc.text('-------------------', 15, 25)
  doc.text('MINISTERE DE LA JUSTICE', 15, 30)
  doc.text('-------------------', 15, 35)
  doc.text('CELLULE DE PASSATION DES MARCHES', 15, 40)

  // Ligne séparatrice
  doc.setDrawColor(0)
  doc.setLineWidth(0.5)
  doc.line(15, 50, W - 15, 50)

  // Titre du document
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  const titreLines = doc.splitTextToSize(titre, W - 30)
  doc.text(titreLines, W / 2, 60, { align: 'center' })

  // Référence
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Réf. : ${reference}`, W / 2, 70, { align: 'center' })

  doc.line(15, 75, W - 15, 75)

  return 85 // y de départ pour le contenu
}

function piedPage(doc: jsPDF, dateDoc: string) {
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.line(15, H - 20, W - 15, H - 20)
  doc.text('GESLOC — Ministère de la Justice du Sénégal', 15, H - 14)
  doc.text(`Document généré le ${dateDoc}`, W - 15, H - 14, { align: 'right' })
}

function ligneSignature(doc: jsPDF, yStart: number, nomSignataire: string) {
  const W = doc.internal.pageSize.getWidth()
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Le Coordonnateur de la CPM', W / 2, yStart, { align: 'center' })
  doc.text('Signature et cachet', W / 2, yStart + 6, { align: 'center' })
  doc.line(W / 2 - 40, yStart + 20, W / 2 + 40, yStart + 20)
  doc.text(nomSignataire, W / 2, yStart + 25, { align: 'center' })
}

// =============================================
// 1. PV D'OUVERTURE DES PLIS
// =============================================
export function genererPVOuverture(data: {
  reference: string
  codeDossier: string
  direction: string
  objet: string
  dateSeance: string
  lieu: string
  membres: string[]
  soumissionnaires: { nom: string; montant: string; observations: string }[]
  coordonnateur: string
}) {
  const doc = new jsPDF()
  const W = doc.internal.pageSize.getWidth()
  const dateDoc = new Date().toLocaleDateString('fr-FR')
  let y = enteteOfficiel(doc, "PROCES-VERBAL D'OUVERTURE DES PLIS", data.reference)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  // Objet
  doc.setFont('helvetica', 'bold')
  doc.text('OBJET DU MARCHE :', 15, y)
  doc.setFont('helvetica', 'normal')
  const objetLines = doc.splitTextToSize(data.objet, W - 80)
  doc.text(objetLines, 65, y)
  y += objetLines.length * 6 + 4

  // Dossier + Direction
  doc.text(`Dossier N° : ${data.codeDossier}`, 15, y); y += 7
  doc.text(`Direction concernée : ${data.direction}`, 15, y); y += 10

  // Séance
  doc.setFont('helvetica', 'bold')
  doc.text('I. DEROULEMENT DE LA SEANCE', 15, y); y += 7
  doc.setFont('helvetica', 'normal')
  doc.text(`Le ${data.dateSeance}, la Commission d'ouverture des plis s'est réunie à ${data.lieu}.`, 15, y)
  y += 10

  // Membres
  doc.setFont('helvetica', 'bold')
  doc.text('Membres présents :', 15, y); y += 6
  doc.setFont('helvetica', 'normal')
  data.membres.forEach(m => {
    doc.text(`• ${m}`, 20, y); y += 6
  })
  y += 4

  // Soumissionnaires
  doc.setFont('helvetica', 'bold')
  doc.text('II. SOUMISSIONNAIRES', 15, y); y += 8
  doc.setFont('helvetica', 'normal')

  // Tableau manuel
  const colX = [15, 90, 140, 185]
  const headers = ['Soumissionnaire', 'Montant (FCFA TTC)', 'Observations']
  doc.setFillColor(220, 240, 220)
  doc.rect(15, y - 4, W - 30, 8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.text(headers[0], colX[0] + 2, y + 1)
  doc.text(headers[1], colX[1] + 2, y + 1)
  doc.text(headers[2], colX[2] + 2, y + 1)
  y += 8
  doc.setFont('helvetica', 'normal')

  data.soumissionnaires.forEach((s, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(248, 250, 248)
      doc.rect(15, y - 4, W - 30, 8, 'F')
    }
    const nomLines = doc.splitTextToSize(s.nom, 70)
    doc.text(nomLines, colX[0] + 2, y + 1)
    doc.text(s.montant, colX[1] + 2, y + 1)
    doc.text(s.observations || '—', colX[2] + 2, y + 1)
    y += 8
  })
  y += 8

  // Clôture
  doc.setFont('helvetica', 'bold')
  doc.text('III. CLOTURE DE LA SEANCE', 15, y); y += 7
  doc.setFont('helvetica', 'normal')
  doc.text(`La séance a été clôturée à l'issue de l'ouverture de tous les plis. Le présent PV a été dressé`, 15, y)
  y += 6
  doc.text(`et signé par les membres de la commission.`, 15, y)
  y += 16

  ligneSignature(doc, y, data.coordonnateur)
  piedPage(doc, dateDoc)

  doc.save(`PV_Ouverture_${data.codeDossier}.pdf`)
}

// =============================================
// 2. PV D'ATTRIBUTION PROVISOIRE
// =============================================
export function genererPVAttribution(data: {
  reference: string
  codeDossier: string
  direction: string
  objet: string
  dateSeance: string
  membres: string[]
  attributaire: string
  montantAttribue: string
  justification: string
  coordonnateur: string
}) {
  const doc = new jsPDF()
  const W = doc.internal.pageSize.getWidth()
  const dateDoc = new Date().toLocaleDateString('fr-FR')
  let y = enteteOfficiel(doc, "PROCES-VERBAL D'ATTRIBUTION PROVISOIRE", data.reference)

  doc.setFontSize(10)

  doc.setFont('helvetica', 'bold')
  doc.text('OBJET :', 15, y)
  doc.setFont('helvetica', 'normal')
  const obj = doc.splitTextToSize(data.objet, W - 60)
  doc.text(obj, 40, y); y += obj.length * 6 + 4

  doc.text(`Dossier N° : ${data.codeDossier}`, 15, y); y += 7
  doc.text(`Direction : ${data.direction}`, 15, y); y += 10

  doc.setFont('helvetica', 'bold')
  doc.text('I. MEMBRES DE LA COMMISSION', 15, y); y += 6
  doc.setFont('helvetica', 'normal')
  data.membres.forEach(m => { doc.text(`• ${m}`, 20, y); y += 6 })
  y += 4

  doc.setFont('helvetica', 'bold')
  doc.text('II. DECISION D\'ATTRIBUTION', 15, y); y += 7
  doc.setFont('helvetica', 'normal')
  doc.text(`La Commission, réunie le ${data.dateSeance}, a décidé d'attribuer provisoirement le marché à :`, 15, y)
  y += 8
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(`Attributaire : ${data.attributaire}`, 25, y); y += 7
  doc.text(`Montant retenu : ${data.montantAttribue} FCFA TTC`, 25, y); y += 10
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('III. JUSTIFICATION', 15, y); y += 6
  doc.setFont('helvetica', 'normal')
  const just = doc.splitTextToSize(data.justification, W - 30)
  doc.text(just, 15, y); y += just.length * 6 + 14

  ligneSignature(doc, y, data.coordonnateur)
  piedPage(doc, dateDoc)
  doc.save(`PV_Attribution_${data.codeDossier}.pdf`)
}

// =============================================
// 3. RAPPORT D'EVALUATION
// =============================================
export function genererRapportEvaluation(data: {
  reference: string
  codeDossier: string
  objet: string
  direction: string
  dateEvaluation: string
  criteres: { critere: string; poids: string }[]
  soumissionnaires: { nom: string; note: string; rang: string; observations: string }[]
  conclusion: string
  coordonnateur: string
}) {
  const doc = new jsPDF()
  const W = doc.internal.pageSize.getWidth()
  const dateDoc = new Date().toLocaleDateString('fr-FR')
  let y = enteteOfficiel(doc, "RAPPORT D'EVALUATION DES OFFRES", data.reference)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('OBJET :', 15, y)
  doc.setFont('helvetica', 'normal')
  const obj = doc.splitTextToSize(data.objet, W - 60)
  doc.text(obj, 40, y); y += obj.length * 6 + 4
  doc.text(`Dossier : ${data.codeDossier} | Direction : ${data.direction}`, 15, y); y += 7
  doc.text(`Date d'évaluation : ${data.dateEvaluation}`, 15, y); y += 10

  doc.setFont('helvetica', 'bold')
  doc.text('I. CRITERES D\'EVALUATION', 15, y); y += 6
  doc.setFont('helvetica', 'normal')
  data.criteres.forEach(c => { doc.text(`• ${c.critere} — Poids : ${c.poids}`, 20, y); y += 6 })
  y += 4

  doc.setFont('helvetica', 'bold')
  doc.text('II. RESULTATS', 15, y); y += 8

  // Tableau résultats
  const colX = [15, 80, 120, 155, 185]
  const headers = ['Soumissionnaire', 'Note', 'Rang', 'Observations']
  doc.setFillColor(220, 240, 220)
  doc.rect(15, y - 4, W - 30, 8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.text(headers[0], colX[0] + 2, y + 1)
  doc.text(headers[1], colX[1] + 2, y + 1)
  doc.text(headers[2], colX[2] + 2, y + 1)
  doc.text(headers[3], colX[3] + 2, y + 1)
  y += 8
  doc.setFont('helvetica', 'normal')
  data.soumissionnaires.forEach((s, i) => {
    if (i % 2 === 0) { doc.setFillColor(248, 250, 248); doc.rect(15, y - 4, W - 30, 8, 'F') }
    doc.text(s.nom, colX[0] + 2, y + 1)
    doc.text(s.note, colX[1] + 2, y + 1)
    doc.text(s.rang, colX[2] + 2, y + 1)
    doc.text(s.observations || '—', colX[3] + 2, y + 1)
    y += 8
  })
  y += 6

  doc.setFont('helvetica', 'bold')
  doc.text('III. CONCLUSION', 15, y); y += 6
  doc.setFont('helvetica', 'normal')
  const conc = doc.splitTextToSize(data.conclusion, W - 30)
  doc.text(conc, 15, y); y += conc.length * 6 + 14

  ligneSignature(doc, y, data.coordonnateur)
  piedPage(doc, dateDoc)
  doc.save(`Rapport_Evaluation_${data.codeDossier}.pdf`)
}

// =============================================
// 4. ANO / EXAMEN JURIDIQUE
// =============================================
export function genererANOJuridique(data: {
  reference: string
  codeDossier: string
  objet: string
  direction: string
  dateAno: string
  avis: 'favorable' | 'defavorable' | 'favorable_reserves'
  observations: string
  coordonnateur: string
}) {
  const doc = new jsPDF()
  const W = doc.internal.pageSize.getWidth()
  const dateDoc = new Date().toLocaleDateString('fr-FR')
  let y = enteteOfficiel(doc, "AVIS DE NON-OBJECTION (ANO) — EXAMEN JURIDIQUE", data.reference)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Objet du marché :', 15, y)
  doc.setFont('helvetica', 'normal')
  const obj = doc.splitTextToSize(data.objet, W - 70)
  doc.text(obj, 58, y); y += obj.length * 6 + 4

  doc.text(`Dossier : ${data.codeDossier}`, 15, y); y += 7
  doc.text(`Direction : ${data.direction}`, 15, y); y += 7
  doc.text(`Date : ${data.dateAno}`, 15, y); y += 12

  doc.setFont('helvetica', 'bold')
  doc.text('I. OBJET DE L\'EXAMEN', 15, y); y += 7
  doc.setFont('helvetica', 'normal')
  doc.text(`Examen juridique du dossier de marché public référencé ${data.codeDossier},`, 15, y); y += 6
  doc.text(`soumis par la ${data.direction}.`, 15, y); y += 10

  doc.setFont('helvetica', 'bold')
  doc.text('II. AVIS DE LA CPM', 15, y); y += 8

  const avisTexte = data.avis === 'favorable'
    ? 'FAVORABLE — Le dossier est conforme aux dispositions du Code des Marchés Publics.'
    : data.avis === 'favorable_reserves'
    ? 'FAVORABLE AVEC RESERVES — Le dossier est accepté sous réserve des corrections mentionnées ci-dessous.'
    : 'DEFAVORABLE — Le dossier présente des irrégularités qui nécessitent une correction avant traitement.'

  const avisColor = data.avis === 'favorable' ? [0, 128, 0] : data.avis === 'favorable_reserves' ? [200, 100, 0] : [200, 0, 0]
  doc.setTextColor(avisColor[0], avisColor[1], avisColor[2])
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  const avisLines = doc.splitTextToSize(avisTexte, W - 30)
  doc.text(avisLines, 15, y); y += avisLines.length * 7 + 6
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)

  if (data.observations) {
    doc.setFont('helvetica', 'bold')
    doc.text('III. OBSERVATIONS', 15, y); y += 6
    doc.setFont('helvetica', 'normal')
    const obs = doc.splitTextToSize(data.observations, W - 30)
    doc.text(obs, 15, y); y += obs.length * 6 + 6
  }
  y += 8

  ligneSignature(doc, y, data.coordonnateur)
  piedPage(doc, dateDoc)
  doc.save(`ANO_Juridique_${data.codeDossier}.pdf`)
}

// =============================================
// 5. ANO / DRP
// =============================================
export function genererANODRP(data: {
  reference: string
  codeDossier: string
  objet: string
  direction: string
  typeDRP: string
  montant: string
  dateAno: string
  avis: 'favorable' | 'defavorable' | 'favorable_reserves'
  observations: string
  coordonnateur: string
}) {
  const doc = new jsPDF()
  const W = doc.internal.pageSize.getWidth()
  const dateDoc = new Date().toLocaleDateString('fr-FR')
  let y = enteteOfficiel(doc, `AVIS DE NON-OBJECTION (ANO) — ${data.typeDRP}`, data.reference)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Objet :', 15, y)
  doc.setFont('helvetica', 'normal')
  const obj = doc.splitTextToSize(data.objet, W - 45)
  doc.text(obj, 35, y); y += obj.length * 6 + 4

  doc.text(`Dossier : ${data.codeDossier}`, 15, y); y += 7
  doc.text(`Direction : ${data.direction}`, 15, y); y += 7
  doc.text(`Type de procédure : ${data.typeDRP}`, 15, y); y += 7
  doc.text(`Montant : ${data.montant} FCFA TTC`, 15, y); y += 7
  doc.text(`Date : ${data.dateAno}`, 15, y); y += 12

  doc.setFont('helvetica', 'bold')
  doc.text('AVIS DE LA CPM', 15, y); y += 8

  const avisTexte = data.avis === 'favorable'
    ? 'FAVORABLE — La procédure est conforme au Code des Marchés Publics.'
    : data.avis === 'favorable_reserves'
    ? 'FAVORABLE AVEC RESERVES'
    : 'DEFAVORABLE'

  const avisColor = data.avis === 'favorable' ? [0, 128, 0] : data.avis === 'favorable_reserves' ? [200, 100, 0] : [200, 0, 0]
  doc.setTextColor(avisColor[0], avisColor[1], avisColor[2])
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text(avisTexte, W / 2, y, { align: 'center' }); y += 10
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)

  if (data.observations) {
    doc.setFont('helvetica', 'normal')
    const obs = doc.splitTextToSize(data.observations, W - 30)
    doc.text(obs, 15, y); y += obs.length * 6 + 6
  }
  y += 10

  ligneSignature(doc, y, data.coordonnateur)
  piedPage(doc, dateDoc)
  doc.save(`ANO_DRP_${data.codeDossier}.pdf`)
}
