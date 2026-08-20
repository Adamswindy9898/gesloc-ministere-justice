-- =============================================
-- GESLOC — Schéma Supabase
-- Ministère de la Justice du Sénégal
-- =============================================

-- Table des profils utilisateurs
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT NOT NULL,
  matricule TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('agent_CPM', 'coordonnateur_CPM', 'admin_DAGE', 'agent_DAGE')),
  service TEXT NOT NULL CHECK (service IN ('CPM', 'DAGE')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des dossiers
CREATE TABLE dossiers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  prefixe_code TEXT NOT NULL,
  espace TEXT NOT NULL CHECK (espace IN ('CPM', 'DAGE')),
  type_dossier TEXT NOT NULL,
  categorie TEXT CHECK (categorie IN ('T', 'F', 'S', 'C')),
  direction TEXT NOT NULL,
  montant NUMERIC,
  type_procedure TEXT,
  statut TEXT NOT NULL DEFAULT 'receptionne'
    CHECK (statut IN ('receptionne','impute','en_cours','en_attente_info','traite','archive')),
  agent_recepteur_id UUID REFERENCES profiles(id),
  agent_recepteur_nom TEXT NOT NULL,
  agent_en_charge_id UUID REFERENCES profiles(id),
  agent_en_charge_nom TEXT,
  deadline TIMESTAMPTZ NOT NULL,
  description TEXT,
  couleur_delai TEXT DEFAULT 'vert' CHECK (couleur_delai IN ('vert','orange','rouge')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table de l'historique (traçabilité)
CREATE TABLE historique (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dossier_id UUID REFERENCES dossiers(id) ON DELETE CASCADE NOT NULL,
  etape TEXT NOT NULL,
  agent_id UUID REFERENCES profiles(id),
  agent_nom TEXT NOT NULL,
  commentaire TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des messages (messagerie CPM <-> DAGE)
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  expediteur_id UUID REFERENCES profiles(id) NOT NULL,
  expediteur_nom TEXT NOT NULL,
  expediteur_role TEXT NOT NULL,
  contenu TEXT,
  type TEXT NOT NULL DEFAULT 'texte' CHECK (type IN ('texte','image','pdf','audio','automatique')),
  file_url TEXT,
  file_name TEXT,
  lu BOOLEAN DEFAULT FALSE,
  dossier_ref TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des directions (configurable, pas en dur)
CREATE TABLE directions (
  id SERIAL PRIMARY KEY,
  nom TEXT UNIQUE NOT NULL,
  abreviation TEXT NOT NULL,
  actif BOOLEAN DEFAULT TRUE
);

-- Insertion des 11 directions du ministère
INSERT INTO directions (nom, abreviation) VALUES
  ('Direction générale de l''Administration pénitentiaire (DGAP)', 'DGAP'),
  ('Direction générale de la Protection judiciaire et sociale (DGPJS)', 'DGPJS'),
  ('Direction des Affaires civiles et du Sceau (DACS)', 'DACS'),
  ('Direction des Affaires criminelles et des Grâces (DACG)', 'DACG'),
  ('Direction des Services judiciaires (DSJ)', 'DSJ'),
  ('Direction de la Justice de Proximité et de la Promotion de l''Accès au Droit (DJPPAD)', 'DJPPAD'),
  ('Direction des Droits humains (DDH)', 'DDH'),
  ('Direction de la Dématérialisation et de l''Automatisation (DDA)', 'DDA'),
  ('Direction de la Promotion de la Bonne Gouvernance (DPBG)', 'DPBG'),
  ('Direction du Suivi et de l''Évaluation des Politiques de Bonne Gouvernance (DSEPBG)', 'DSEPBG'),
  ('Direction de l''Administration Générale et de l''Équipement (DAGE)', 'DAGE');

-- Seuils de procédure (configurable)
CREATE TABLE seuils_procedure (
  id SERIAL PRIMARY KEY,
  categorie TEXT NOT NULL CHECK (categorie IN ('T', 'F', 'S', 'C')),
  type_procedure TEXT NOT NULL,
  montant_min NUMERIC NOT NULL DEFAULT 0,
  montant_max NUMERIC,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO seuils_procedure (categorie, type_procedure, montant_min, montant_max) VALUES
  ('T', 'DRP_simple', 0, 4999999),
  ('T', 'DRP_restreinte', 5000000, 24999999),
  ('T', 'DRP_competition_ouverte', 25000000, 69999999),
  ('T', 'AO_ouvert', 70000000, NULL),
  ('F', 'DRP_simple', 0, 2999999),
  ('F', 'DRP_restreinte', 3000000, 14999999),
  ('F', 'DRP_competition_ouverte', 15000000, 49999999),
  ('F', 'AO_ouvert', 50000000, NULL),
  ('S', 'DRP_simple', 0, 2999999),
  ('S', 'DRP_restreinte', 3000000, 14999999),
  ('S', 'DRP_competition_ouverte', 15000000, 49999999),
  ('S', 'AO_ouvert', 50000000, NULL),
  ('C', 'DRP_simple', 0, 4999999),
  ('C', 'DRP_restreinte', 5000000, 24999999),
  ('C', 'DRP_competition_ouverte', 25000000, 49999999),
  ('C', 'AO_ouvert', 50000000, NULL);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- Chaque espace voit uniquement ses données
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE dossiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE historique ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Profil : chaque agent voit son propre profil
CREATE POLICY "Voir son profil" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Dossiers CPM : visibles uniquement par les agents CPM
CREATE POLICY "CPM voit ses dossiers" ON dossiers
  FOR ALL USING (
    espace = 'CPM' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND service = 'CPM')
    OR
    espace = 'DAGE' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND service = 'DAGE')
  );

-- Historique : visible selon l'espace du dossier
CREATE POLICY "Historique selon espace" ON historique
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM dossiers d
      JOIN profiles p ON p.id = auth.uid()
      WHERE d.id = historique.dossier_id AND d.espace = p.service
    )
  );

-- Messages : visibles par CPM et DAGE (messagerie partagée)
CREATE POLICY "Messages CPM-DAGE" ON messages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())
  );
