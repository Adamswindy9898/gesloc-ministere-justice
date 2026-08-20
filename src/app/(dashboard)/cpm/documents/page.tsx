'use client'

import { useState } from 'react'
import {
  genererPVOuverture,
  genererPVAttribution,
  genererRapportEvaluation,
  genererANOJuridique,
  genererANODRP,
} from '@/lib/pdf'

type ModeleId = 'pv_ouverture' | 'pv_attribution' | 'rapport_eval' | 'ano_juridique' | 'ano_drp'

const MODELES = [
  { id: 'pv_ouverture' as ModeleId, titre: "PV d'ouverture des plis", icon: '📋', desc: 'Procès-verbal de la séance d\'ouverture des offres' },
  { id: 'pv_attribution' as ModeleId, titre: 'PV d\'attribution provisoire', icon: '🏆', desc: 'Procès-verbal d\'attribution du marché' },
  { id: 'rapport_eval' as ModeleId, titre: 'Rapport d\'évaluation', icon: '📊', desc: 'Rapport d\'évaluation des offres soumissionnaires' },
  { id: 'ano_juridique' as ModeleId, titre: 'ANO — Examen juridique', icon: '⚖️', desc: 'Avis de Non-Objection sur l\'examen juridique' },
  { id: 'ano_drp' as ModeleId, titre: 'ANO — DRP', icon: '✅', desc: 'Avis de Non-Objection sur une DRP' },
]

const COORD = 'Mme SOURANG'

export default function DocumentsCPM() {
  const [modeleActif, setModeleActif] = useState<ModeleId | null>(null)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Génération de documents</h1>
        <p className="text-gray-500 text-sm mt-1">Choisissez un modèle, remplissez le formulaire → PDF généré automatiquement</p>
      </div>

      {!modeleActif ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODELES.map(m => (
            <button
              key={m.id}
              onClick={() => setModeleActif(m.id)}
              className="bg-white border border-gray-200 hover:border-green-400 hover:shadow-md rounded-xl p-5 text-left transition-all"
            >
              <span className="text-3xl block mb-3">{m.icon}</span>
              <p className="font-semibold text-gray-800">{m.titre}</p>
              <p className="text-xs text-gray-400 mt-1">{m.desc}</p>
            </button>
          ))}
        </div>
      ) : (
        <div>
          <button onClick={() => setModeleActif(null)} className="text-gray-400 hover:text-gray-600 text-sm mb-4 block">
            ← Choisir un autre modèle
          </button>
          {modeleActif === 'pv_ouverture' && <FormPVOuverture coordonnateur={COORD} />}
          {modeleActif === 'pv_attribution' && <FormPVAttribution coordonnateur={COORD} />}
          {modeleActif === 'rapport_eval' && <FormRapportEval coordonnateur={COORD} />}
          {modeleActif === 'ano_juridique' && <FormANOJuridique coordonnateur={COORD} />}
          {modeleActif === 'ano_drp' && <FormANODRP coordonnateur={COORD} />}
        </div>
      )}
    </div>
  )
}

// ---- Composants de formulaire ----

function ChampTexte({ label, value, onChange, placeholder, required = true }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} required={required} placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
    </div>
  )
}

function ChampTextarea({ label, value, onChange, placeholder, required = true }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600 resize-none" />
    </div>
  )
}

function BoutonGenerer({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
      <span>📄</span> Générer le PDF
    </button>
  )
}

// 1. PV Ouverture
function FormPVOuverture({ coordonnateur }: { coordonnateur: string }) {
  const [ref, setRef] = useState(''); const [code, setCode] = useState(''); const [dir, setDir] = useState('')
  const [objet, setObjet] = useState(''); const [date, setDate] = useState(''); const [lieu, setLieu] = useState('Dakar')
  const [membres, setMembres] = useState(''); const [soumNom, setSoumNom] = useState(''); const [soumMont, setSoumMont] = useState('')
  const [soumObs, setSoumObs] = useState(''); const [soumList, setSoumList] = useState<{ nom: string; montant: string; observations: string }[]>([])

  function ajouterSoum() {
    if (!soumNom || !soumMont) return
    setSoumList(prev => [...prev, { nom: soumNom, montant: soumMont, observations: soumObs }])
    setSoumNom(''); setSoumMont(''); setSoumObs('')
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4 max-w-2xl">
      <h2 className="font-semibold text-gray-800 text-lg">📋 PV d&apos;ouverture des plis</h2>
      <div className="grid grid-cols-2 gap-4">
        <ChampTexte label="Référence" value={ref} onChange={setRef} placeholder="ex: CPM/2024/001" />
        <ChampTexte label="Code dossier" value={code} onChange={setCode} placeholder="ex: T_DAGE_12" />
      </div>
      <ChampTexte label="Direction concernée" value={dir} onChange={setDir} />
      <ChampTextarea label="Objet du marché" value={objet} onChange={setObjet} />
      <div className="grid grid-cols-2 gap-4">
        <ChampTexte label="Date de la séance" value={date} onChange={setDate} placeholder="ex: 15 janvier 2026" />
        <ChampTexte label="Lieu" value={lieu} onChange={setLieu} />
      </div>
      <ChampTextarea label="Membres présents (un par ligne)" value={membres} onChange={setMembres} placeholder="Mme SOURANG&#10;M. DIARRA&#10;..." />

      <div className="border border-gray-200 rounded-lg p-4 space-y-2">
        <p className="text-sm font-medium text-gray-700">Ajouter un soumissionnaire</p>
        <div className="grid grid-cols-3 gap-2">
          <input value={soumNom} onChange={e => setSoumNom(e.target.value)} placeholder="Nom" className="px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500" />
          <input value={soumMont} onChange={e => setSoumMont(e.target.value)} placeholder="Montant" className="px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500" />
          <input value={soumObs} onChange={e => setSoumObs(e.target.value)} placeholder="Observations" className="px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500" />
        </div>
        <button type="button" onClick={ajouterSoum} className="text-green-700 text-sm hover:underline">+ Ajouter</button>
        {soumList.map((s, i) => (
          <div key={i} className="flex items-center justify-between text-xs bg-gray-50 rounded px-2 py-1">
            <span>{s.nom} — {s.montant} FCFA</span>
            <button onClick={() => setSoumList(prev => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600">✕</button>
          </div>
        ))}
      </div>

      <BoutonGenerer onClick={() => genererPVOuverture({
        reference: ref, codeDossier: code, direction: dir, objet, dateSeance: date, lieu,
        membres: membres.split('\n').filter(Boolean),
        soumissionnaires: soumList,
        coordonnateur,
      })} />
    </div>
  )
}

// 2. PV Attribution
function FormPVAttribution({ coordonnateur }: { coordonnateur: string }) {
  const [ref, setRef] = useState(''); const [code, setCode] = useState(''); const [dir, setDir] = useState('')
  const [objet, setObjet] = useState(''); const [date, setDate] = useState('')
  const [membres, setMembres] = useState(''); const [attrib, setAttrib] = useState('')
  const [montant, setMontant] = useState(''); const [just, setJust] = useState('')

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4 max-w-2xl">
      <h2 className="font-semibold text-gray-800 text-lg">🏆 PV d&apos;attribution provisoire</h2>
      <div className="grid grid-cols-2 gap-4">
        <ChampTexte label="Référence" value={ref} onChange={setRef} />
        <ChampTexte label="Code dossier" value={code} onChange={setCode} />
      </div>
      <ChampTexte label="Direction" value={dir} onChange={setDir} />
      <ChampTextarea label="Objet du marché" value={objet} onChange={setObjet} />
      <ChampTexte label="Date de la séance" value={date} onChange={setDate} placeholder="ex: 15 janvier 2026" />
      <ChampTextarea label="Membres présents (un par ligne)" value={membres} onChange={setMembres} />
      <ChampTexte label="Nom de l'attributaire" value={attrib} onChange={setAttrib} />
      <ChampTexte label="Montant retenu (FCFA TTC)" value={montant} onChange={setMontant} placeholder="ex: 45 000 000" />
      <ChampTextarea label="Justification du choix" value={just} onChange={setJust} />
      <BoutonGenerer onClick={() => genererPVAttribution({ reference: ref, codeDossier: code, direction: dir, objet, dateSeance: date, membres: membres.split('\n').filter(Boolean), attributaire: attrib, montantAttribue: montant, justification: just, coordonnateur })} />
    </div>
  )
}

// 3. Rapport d'évaluation
function FormRapportEval({ coordonnateur }: { coordonnateur: string }) {
  const [ref, setRef] = useState(''); const [code, setCode] = useState(''); const [objet, setObjet] = useState('')
  const [dir, setDir] = useState(''); const [date, setDate] = useState(''); const [conc, setConc] = useState('')
  const [critNom, setCritNom] = useState(''); const [critPoids, setCritPoids] = useState('')
  const [critList, setCritList] = useState<{ critere: string; poids: string }[]>([])
  const [soumList, setSoumList] = useState<{ nom: string; note: string; rang: string; observations: string }[]>([])
  const [soumNom, setSoumNom] = useState(''); const [soumNote, setSoumNote] = useState('')
  const [soumRang, setSoumRang] = useState(''); const [soumObs, setSoumObs] = useState('')

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4 max-w-2xl">
      <h2 className="font-semibold text-gray-800 text-lg">📊 Rapport d&apos;évaluation</h2>
      <div className="grid grid-cols-2 gap-4">
        <ChampTexte label="Référence" value={ref} onChange={setRef} />
        <ChampTexte label="Code dossier" value={code} onChange={setCode} />
      </div>
      <ChampTexte label="Direction" value={dir} onChange={setDir} />
      <ChampTextarea label="Objet" value={objet} onChange={setObjet} />
      <ChampTexte label="Date d'évaluation" value={date} onChange={setDate} />

      <div className="border border-gray-200 rounded-lg p-3 space-y-2">
        <p className="text-sm font-medium text-gray-700">Critères d&apos;évaluation</p>
        <div className="flex gap-2">
          <input value={critNom} onChange={e => setCritNom(e.target.value)} placeholder="Critère" className="flex-1 px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500" />
          <input value={critPoids} onChange={e => setCritPoids(e.target.value)} placeholder="Poids (%)" className="w-24 px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500" />
          <button onClick={() => { if (critNom) { setCritList(p => [...p, { critere: critNom, poids: critPoids }]); setCritNom(''); setCritPoids('') } }} className="text-green-700 text-sm hover:underline">+</button>
        </div>
        {critList.map((c, i) => <div key={i} className="flex justify-between text-xs bg-gray-50 px-2 py-1 rounded"><span>{c.critere} — {c.poids}</span><button onClick={() => setCritList(p => p.filter((_, j) => j !== i))} className="text-red-400">✕</button></div>)}
      </div>

      <div className="border border-gray-200 rounded-lg p-3 space-y-2">
        <p className="text-sm font-medium text-gray-700">Résultats soumissionnaires</p>
        <div className="grid grid-cols-4 gap-2">
          <input value={soumNom} onChange={e => setSoumNom(e.target.value)} placeholder="Nom" className="px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500" />
          <input value={soumNote} onChange={e => setSoumNote(e.target.value)} placeholder="Note" className="px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500" />
          <input value={soumRang} onChange={e => setSoumRang(e.target.value)} placeholder="Rang" className="px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500" />
          <input value={soumObs} onChange={e => setSoumObs(e.target.value)} placeholder="Obs." className="px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500" />
        </div>
        <button onClick={() => { if (soumNom) { setSoumList(p => [...p, { nom: soumNom, note: soumNote, rang: soumRang, observations: soumObs }]); setSoumNom(''); setSoumNote(''); setSoumRang(''); setSoumObs('') } }} className="text-green-700 text-sm hover:underline">+ Ajouter</button>
        {soumList.map((s, i) => <div key={i} className="flex justify-between text-xs bg-gray-50 px-2 py-1 rounded"><span>{s.nom} — {s.note} (rang {s.rang})</span><button onClick={() => setSoumList(p => p.filter((_, j) => j !== i))} className="text-red-400">✕</button></div>)}
      </div>

      <ChampTextarea label="Conclusion" value={conc} onChange={setConc} />
      <BoutonGenerer onClick={() => genererRapportEvaluation({ reference: ref, codeDossier: code, objet, direction: dir, dateEvaluation: date, criteres: critList, soumissionnaires: soumList, conclusion: conc, coordonnateur })} />
    </div>
  )
}

// 4. ANO Juridique
function FormANOJuridique({ coordonnateur }: { coordonnateur: string }) {
  const [ref, setRef] = useState(''); const [code, setCode] = useState(''); const [objet, setObjet] = useState('')
  const [dir, setDir] = useState(''); const [date, setDate] = useState('')
  const [avis, setAvis] = useState<'favorable' | 'defavorable' | 'favorable_reserves'>('favorable')
  const [obs, setObs] = useState('')

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4 max-w-2xl">
      <h2 className="font-semibold text-gray-800 text-lg">⚖️ ANO — Examen juridique</h2>
      <div className="grid grid-cols-2 gap-4">
        <ChampTexte label="Référence" value={ref} onChange={setRef} />
        <ChampTexte label="Code dossier" value={code} onChange={setCode} />
      </div>
      <ChampTexte label="Direction" value={dir} onChange={setDir} />
      <ChampTextarea label="Objet du marché" value={objet} onChange={setObjet} />
      <ChampTexte label="Date de l'ANO" value={date} onChange={setDate} placeholder="ex: 15 janvier 2026" />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Avis de la CPM</label>
        <div className="flex gap-3">
          {(['favorable', 'favorable_reserves', 'defavorable'] as const).map(v => (
            <button key={v} type="button" onClick={() => setAvis(v)}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${avis === v ? (v === 'favorable' ? 'bg-green-600 text-white border-green-600' : v === 'favorable_reserves' ? 'bg-orange-500 text-white border-orange-500' : 'bg-red-500 text-white border-red-500') : 'border-gray-200 text-gray-600'}`}>
              {v === 'favorable' ? '✓ Favorable' : v === 'favorable_reserves' ? '⚠ Avec réserves' : '✗ Défavorable'}
            </button>
          ))}
        </div>
      </div>
      <ChampTextarea label="Observations" value={obs} onChange={setObs} required={false} />
      <BoutonGenerer onClick={() => genererANOJuridique({ reference: ref, codeDossier: code, objet, direction: dir, dateAno: date, avis, observations: obs, coordonnateur })} />
    </div>
  )
}

// 5. ANO DRP
function FormANODRP({ coordonnateur }: { coordonnateur: string }) {
  const [ref, setRef] = useState(''); const [code, setCode] = useState(''); const [objet, setObjet] = useState('')
  const [dir, setDir] = useState(''); const [typeDRP, setTypeDRP] = useState('DRP Simple')
  const [montant, setMontant] = useState(''); const [date, setDate] = useState('')
  const [avis, setAvis] = useState<'favorable' | 'defavorable' | 'favorable_reserves'>('favorable')
  const [obs, setObs] = useState('')

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4 max-w-2xl">
      <h2 className="font-semibold text-gray-800 text-lg">✅ ANO — DRP</h2>
      <div className="grid grid-cols-2 gap-4">
        <ChampTexte label="Référence" value={ref} onChange={setRef} />
        <ChampTexte label="Code dossier" value={code} onChange={setCode} />
      </div>
      <ChampTexte label="Direction" value={dir} onChange={setDir} />
      <ChampTextarea label="Objet" value={objet} onChange={setObjet} />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type de DRP</label>
          <select value={typeDRP} onChange={e => setTypeDRP(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600">
            <option>DRP Simple</option><option>DRP Restreinte</option><option>DRP Compétition ouverte</option>
          </select>
        </div>
        <ChampTexte label="Montant (FCFA TTC)" value={montant} onChange={setMontant} />
      </div>
      <ChampTexte label="Date de l'ANO" value={date} onChange={setDate} />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Avis de la CPM</label>
        <div className="flex gap-3">
          {(['favorable', 'favorable_reserves', 'defavorable'] as const).map(v => (
            <button key={v} type="button" onClick={() => setAvis(v)}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${avis === v ? (v === 'favorable' ? 'bg-green-600 text-white border-green-600' : v === 'favorable_reserves' ? 'bg-orange-500 text-white border-orange-500' : 'bg-red-500 text-white border-red-500') : 'border-gray-200 text-gray-600'}`}>
              {v === 'favorable' ? '✓ Favorable' : v === 'favorable_reserves' ? '⚠ Avec réserves' : '✗ Défavorable'}
            </button>
          ))}
        </div>
      </div>
      <ChampTextarea label="Observations" value={obs} onChange={setObs} required={false} />
      <BoutonGenerer onClick={() => genererANODRP({ reference: ref, codeDossier: code, objet, direction: dir, typeDRP, montant, dateAno: date, avis, observations: obs, coordonnateur })} />
    </div>
  )
}
