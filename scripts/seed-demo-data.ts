/** Données de démo — Le Kremlin-Bicêtre */

export const DEMO_CITY_ID = process.env.SEED_CITY_ID ?? 'le-kremlin-bicetre';
export const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD ?? 'Demo2026!';
export const DEMO_EMAIL_DOMAIN = '@demo.municipall.dev';

/** Centre ville — coordonnées dispersées autour de ce point */
export const CITY_CENTER = { lat: 48.8101, lon: 2.3601 };

export const STAFF_USERS = [
  {
    email: `maire${DEMO_EMAIL_DOMAIN}`,
    name: 'Sophie',
    surname: 'Martin',
    role: 'mayor',
  },
  {
    email: `agent1${DEMO_EMAIL_DOMAIN}`,
    name: 'Thomas',
    surname: 'Bernard',
    role: 'agent',
  },
  {
    email: `assistant${DEMO_EMAIL_DOMAIN}`,
    name: 'Claire',
    surname: 'Dupont',
    role: 'assistant',
  },
  {
    email: `agent2${DEMO_EMAIL_DOMAIN}`,
    name: 'Marc',
    surname: 'Petit',
    role: 'agent',
  },
] as const;

/** Signalements / contacts générés en plus des scénarios manuels */
export const BULK_REPORT_COUNT = 28;
export const BULK_QUESTION_COUNT = 12;
export const BULK_SUGGESTION_COUNT = 8;
export const TIMELINE_FEEDBACK_COUNT = 32;

export const CITIZEN_NAMES: { name: string; surname: string; neighborhood?: string; points: number }[] =
  [
    { name: 'Jean', surname: 'Moreau', neighborhood: 'Centre-ville', points: 120 },
    { name: 'Marie', surname: 'Lefebvre', neighborhood: 'Les Closeaux', points: 85 },
    { name: 'Pierre', surname: 'Garcia', neighborhood: 'Plateau', points: 200 },
    { name: 'Isabelle', surname: 'Roux', neighborhood: 'Centre-ville', points: 45 },
    { name: 'Antoine', surname: 'Fournier', neighborhood: 'Les Closeaux', points: 160 },
    { name: 'Camille', surname: 'Girard', neighborhood: 'Plateau', points: 30 },
    { name: 'Lucas', surname: 'André', neighborhood: 'Centre-ville', points: 95 },
    { name: 'Emma', surname: 'Mercier', neighborhood: 'Les Closeaux', points: 70 },
    { name: 'Hugo', surname: 'Blanc', neighborhood: 'Plateau', points: 110 },
    { name: 'Léa', surname: 'Guerin', neighborhood: 'Centre-ville', points: 55 },
    { name: 'Nathan', surname: 'Boyer', points: 15 },
    { name: 'Chloé', surname: 'Chevalier', neighborhood: 'Les Closeaux', points: 180 },
    { name: 'Louis', surname: 'Robin', neighborhood: 'Plateau', points: 40 },
    { name: 'Manon', surname: 'Masson', neighborhood: 'Centre-ville', points: 90 },
    { name: 'Arthur', surname: 'Henry', neighborhood: 'Les Closeaux', points: 65 },
    { name: 'Julie', surname: 'Rousseau', neighborhood: 'Plateau', points: 130 },
    { name: 'Paul', surname: 'Vincent', neighborhood: 'Centre-ville', points: 25 },
    { name: 'Sarah', surname: 'Muller', neighborhood: 'Les Closeaux', points: 75 },
    { name: 'Maxime', surname: 'Leroy', neighborhood: 'Plateau', points: 100 },
    { name: 'Océane', surname: 'Simon', neighborhood: 'Centre-ville', points: 50 },
    { name: 'Romain', surname: 'Faure', neighborhood: 'Les Closeaux', points: 88 },
    { name: 'Élise', surname: 'Bonnet', neighborhood: 'Plateau', points: 42 },
    { name: 'Nicolas', surname: 'Lambert', neighborhood: 'Centre-ville', points: 155 },
    { name: 'Laura', surname: 'Fontaine', neighborhood: 'Les Closeaux', points: 62 },
    { name: 'Quentin', surname: 'Renaud', points: 20 },
    { name: 'Anaïs', surname: 'Garnier', neighborhood: 'Plateau', points: 98 },
    { name: 'Baptiste', surname: 'Leclerc', neighborhood: 'Centre-ville', points: 73 },
    { name: 'Inès', surname: 'Colin', neighborhood: 'Les Closeaux', points: 36 },
    { name: 'Florian', surname: 'Vidal', neighborhood: 'Plateau', points: 112 },
  ];

export const INVITATION_SEEDS = [
  {
    email: `nouvel.agent${DEMO_EMAIL_DOMAIN}`,
    name: 'Julien',
    role: 'agent',
    status: 'pending' as const,
    daysAgo: 2,
  },
  {
    email: `stagiaire${DEMO_EMAIL_DOMAIN}`,
    name: 'Amélie',
    role: 'assistant',
    status: 'expired' as const,
    daysAgo: 30,
  },
];

export type ReportSeed = {
  category: string;
  status: string;
  description: string;
  daysAgo: number;
  urgent?: boolean;
  withImage?: boolean;
  messages?: { role: 'citizen' | 'agent'; body: string; hoursAfter?: number }[];
  feedback?: { stars: number; message?: string; daysAfterClose?: number };
};

export const REPORT_SEEDS: ReportSeed[] = [
  // En attente — scénarios démo v2 (sept. 2026)
  {
    category: 'Voirie',
    status: 'En attente',
    description: 'Effondrement localisé de chaussée avenue de Fontainebleau (devant le n°28)',
    daysAgo: 0,
  },
  {
    category: 'Éclairage',
    status: 'En attente',
    description: 'Trois candélabres éteints rue des Peupliers — passage piéton sombre',
    daysAgo: 0,
  },
  {
    category: 'Sécurité',
    status: 'En attente',
    description: 'Urgent : glissière de chantier ouverte face à l’école Pasteur',
    daysAgo: 0,
    urgent: true,
  },
  {
    category: 'Voirie',
    status: 'En attente',
    description: 'Trottoir soulevé par racines place du 8-Mai-1945',
    daysAgo: 1,
  },
  {
    category: 'Propreté',
    status: 'En attente',
    description: 'Encombrants abandonnés rue de la Convention (matelas + électroménager)',
    daysAgo: 1,
  },
  {
    category: 'Espaces Verts',
    status: 'En attente',
    description: 'Banc fendu et dangereux au parc des Closeaux',
    daysAgo: 2,
  },
  {
    category: 'Autre',
    status: 'En attente',
    description: 'Accès stade municipal : portillon tordu, ne ferme plus',
    daysAgo: 2,
  },
  {
    category: 'Voirie',
    status: 'En attente',
    description: 'Passage piéton effacé carrefour République / rue de Paris',
    daysAgo: 3,
    withImage: true,
  },
  {
    category: 'Éclairage',
    status: 'En attente',
    description: 'Éclairage public qui clignote rue Jeanne-d’Arc toute la nuit',
    daysAgo: 3,
  },
  {
    category: 'Propreté',
    status: 'En attente',
    description: 'Poubelles marché saturées après le mercredi — odeurs',
    daysAgo: 4,
  },

  // En cours
  {
    category: 'Voirie',
    status: 'En cours',
    description: 'Affaissement de chaussée rue de Paris (bus 186)',
    daysAgo: 5,
    messages: [
      { role: 'citizen', body: 'Le trou s’élargit ; plusieurs voitures l’évitent brutalement.' },
      {
        role: 'agent',
        body: 'Pris en charge par la voirie — balisage prévu demain matin.',
        hoursAfter: 3,
      },
    ],
  },
  {
    category: 'Éclairage',
    status: 'En cours',
    description: 'Parking mairie : rangée de lampadaires hors service',
    daysAgo: 6,
    messages: [
      { role: 'citizen', body: 'Très sombre en sortant des réunions du soir.' },
      { role: 'agent', body: 'Commande de luminaires lancée auprès du prestataire.', hoursAfter: 2 },
      { role: 'citizen', body: 'Merci pour le retour.' },
    ],
  },
  {
    category: 'Propreté',
    status: 'En cours',
    description: 'Tags sur la façade de la médiathèque',
    daysAgo: 7,
    messages: [
      { role: 'citizen', body: 'Apparus ce week-end côté rue Gabriel-Péri.' },
      { role: 'agent', body: 'Nettoyage anti-graffiti planifié cette semaine.', hoursAfter: 5 },
    ],
  },
  {
    category: 'Espaces Verts',
    status: 'En cours',
    description: 'Arbre endommagé après orage — branches au-dessus du trottoir',
    daysAgo: 8,
    messages: [
      { role: 'citizen', body: 'Risque de chute de branche près des Closeaux.' },
      {
        role: 'agent',
        body: 'Élagage d’urgence programmé par les espaces verts.',
        hoursAfter: 6,
      },
    ],
  },
  {
    category: 'Sécurité',
    status: 'En cours',
    description: 'Feu tricolore défaillant carrefour République',
    daysAgo: 9,
    messages: [
      { role: 'citizen', body: 'Circulation anarchique aux heures de pointe.' },
      { role: 'agent', body: 'Signalé ; technicien sur place aujourd’hui.', hoursAfter: 1 },
    ],
  },
  {
    category: 'Autre',
    status: 'En cours',
    description: 'Borne de recharge vélo HS place Jean-Jaurès',
    daysAgo: 10,
    messages: [
      { role: 'citizen', body: 'Impossible de recharger depuis lundi.' },
      { role: 'agent', body: 'Prestataire contacté — diagnostic en cours.', hoursAfter: 10 },
    ],
  },

  // Résolus
  {
    category: 'Voirie',
    status: 'Résolu',
    description: 'Plot de chantier renversé sur la voie',
    daysAgo: 12,
    messages: [
      { role: 'citizen', body: 'Plot au milieu de la chaussée, danger.' },
      { role: 'agent', body: 'Retiré ce matin par l’équipe d’astreinte.', hoursAfter: 4 },
      { role: 'agent', body: 'Dossier clôturé. Bonne journée !', hoursAfter: 20 },
    ],
    feedback: {
      stars: 5,
      message: 'Intervention ultra-rapide, bravo.',
      daysAfterClose: 1,
    },
  },
  {
    category: 'Éclairage',
    status: 'Résolu',
    description: 'Candélabre remplacé rue des Closeaux',
    daysAgo: 13,
    feedback: {
      stars: 5,
      message: 'Rue à nouveau bien éclairée le soir.',
      daysAfterClose: 1,
    },
  },
  {
    category: 'Propreté',
    status: 'Résolu',
    description: 'Déchets enlevés square Carnot',
    daysAgo: 14,
    feedback: { stars: 4, daysAfterClose: 2 },
  },
  {
    category: 'Espaces Verts',
    status: 'Résolu',
    description: 'Haies taillées le long du chemin piéton RER',
    daysAgo: 15,
    feedback: {
      stars: 5,
      message: 'Chemin à nouveau praticable, merci.',
      daysAfterClose: 2,
    },
  },
  {
    category: 'Voirie',
    status: 'Résolu',
    description: 'Nid-de-poule comblé avenue de Stalingrad',
    daysAgo: 16,
    feedback: {
      stars: 3,
      message: 'Bien réparé, délai un peu long.',
      daysAfterClose: 3,
    },
  },
  {
    category: 'Sécurité',
    status: 'Résolu',
    description: 'Barrière de sécurité remise en place école Anatole-France',
    daysAgo: 17,
    feedback: { stars: 5, daysAfterClose: 1 },
  },
  {
    category: 'Autre',
    status: 'Résolu',
    description: 'Panneau directionnel remis d’aplomb',
    daysAgo: 18,
    feedback: { stars: 4, message: 'Suivi clair, merci.', daysAfterClose: 2 },
  },
  {
    category: 'Voirie',
    status: 'Résolu',
    description: 'Fuite d’eau sur chaussée colmatée',
    daysAgo: 19,
    feedback: {
      stars: 5,
      message: 'Excellente réactivité.',
      daysAfterClose: 1,
    },
  },
  {
    category: 'Propreté',
    status: 'Résolu',
    description: 'Caniveaux curés rue Jean-Jaurès',
    daysAgo: 20,
    feedback: {
      stars: 2,
      message: 'Résolu mais délai trop long à mon goût.',
      daysAfterClose: 4,
    },
  },
  {
    category: 'Éclairage',
    status: 'Résolu',
    description: 'Éclairage place du marché rétabli',
    daysAgo: 21,
    feedback: { stars: 5, daysAfterClose: 2 },
  },
  {
    category: 'Espaces Verts',
    status: 'Résolu',
    description: 'Banc du parc remplacé',
    daysAgo: 22,
    feedback: { stars: 4, message: 'Nouveau banc confortable.', daysAfterClose: 2 },
  },
  {
    category: 'Voirie',
    status: 'Résolu',
    description: 'Signalisation horizontale refaite passage école',
    daysAgo: 23,
    feedback: { stars: 5, daysAfterClose: 1 },
  },

  // Clôturés
  {
    category: 'Autre',
    status: 'Clôturé',
    description: 'Hors périmètre communal — réorienté vers le bailleur',
    daysAgo: 26,
    feedback: {
      stars: 3,
      message: 'Réponse claire même si hors compétence mairie.',
      daysAfterClose: 2,
    },
  },
  {
    category: 'Propreté',
    status: 'Clôturé',
    description: 'Doublon fusionné avec un dossier existant',
    daysAgo: 27,
    feedback: { stars: 4, daysAfterClose: 1 },
  },
  {
    category: 'Voirie',
    status: 'Clôturé',
    description: 'Travaux déjà planifiés par la métropole',
    daysAgo: 28,
    feedback: {
      stars: 2,
      message: 'Manque d’info sur le calendrier métropolitain.',
      daysAfterClose: 3,
    },
  },
  {
    category: 'Éclairage',
    status: 'Clôturé',
    description: 'Éclairage privé — contact propriétaire transmis',
    daysAgo: 29,
    feedback: { stars: 4, daysAfterClose: 2 },
  },
];

export type ContactSeed = {
  ticketType: 'question' | 'suggestion';
  subject: string;
  status: string;
  body: string;
  daysAgo: number;
  urgent?: boolean;
  messages?: { role: 'citizen' | 'agent'; body: string; hoursAfter?: number }[];
  feedback?: { stars: number; message?: string; daysAfterClose?: number };
};

export const CONTACT_SEEDS: ContactSeed[] = [
  // Questions — démo v2
  {
    ticketType: 'question',
    subject: 'Piscine — horaires rentrée',
    status: 'En attente',
    body: 'Quels sont les créneaux adultes à partir de septembre ?',
    daysAgo: 0,
  },
  {
    ticketType: 'question',
    subject: 'Rendez-vous CNI / passeport',
    status: 'En attente',
    body: 'Comment réserver un créneau pour une carte d’identité ?',
    daysAgo: 1,
  },
  {
    ticketType: 'question',
    subject: 'Avis de taxe foncière',
    status: 'En attente',
    body: 'Je n’ai pas reçu mon avis cette année, que faire ?',
    daysAgo: 2,
  },
  {
    ticketType: 'question',
    subject: 'Inscription école maternelle',
    status: 'En cours',
    body: 'Dossier pour septembre — liste des pièces à fournir ?',
    daysAgo: 4,
    messages: [
      {
        role: 'agent',
        body: 'Bonjour, la liste est sur le site (rubrique Éducation) et en mairie.',
        hoursAfter: 3,
      },
    ],
  },
  {
    ticketType: 'question',
    subject: 'Macaron stationnement résidents',
    status: 'En cours',
    body: 'Quelle est la procédure et le tarif 2026 ?',
    daysAgo: 5,
    messages: [
      { role: 'agent', body: 'Formulaire en ligne ou à l’accueil ; tarif affiché en mairie.', hoursAfter: 2 },
      { role: 'citizen', body: 'Parfait, je déposerai le dossier demain.', hoursAfter: 4 },
    ],
  },
  {
    ticketType: 'question',
    subject: 'Acte de naissance',
    status: 'Clôturé',
    body: 'Besoin d’une copie intégrale pour un dossier administratif.',
    daysAgo: 11,
    messages: [
      {
        role: 'agent',
        body: 'Retrait à l’accueil sur présentation d’une pièce d’identité.',
        hoursAfter: 1,
      },
    ],
    feedback: { stars: 5, message: 'Réponse claire et rapide.', daysAfterClose: 1 },
  },
  {
    ticketType: 'question',
    subject: 'Horaires de travaux autorisés',
    status: 'Clôturé',
    body: 'Les travaux de voisinage sont-ils autorisés le week-end ?',
    daysAgo: 14,
    messages: [
      {
        role: 'agent',
        body: 'En semaine 7h–20h ; samedi 8h–20h ; dimanche interdit hors urgence.',
        hoursAfter: 4,
      },
    ],
    feedback: { stars: 4, daysAfterClose: 2 },
  },
  {
    ticketType: 'question',
    subject: 'Urgent — coupure d’eau',
    status: 'Clôturé',
    body: 'Coupure dans tout l’immeuble depuis 2h, qui contacter ?',
    daysAgo: 7,
    urgent: true,
    messages: [
      {
        role: 'agent',
        body: 'Contactez d’abord le syndic. Astreinte eau : numéro affiché en mairie.',
        hoursAfter: 0.5,
      },
    ],
    feedback: { stars: 5, daysAfterClose: 1 },
  },

  // Suggestions
  {
    ticketType: 'suggestion',
    subject: 'Bancs ombragés aire de jeux',
    status: 'En attente',
    body: 'Ajouter des bancs à l’ombre près de l’aire de jeux des Closeaux.',
    daysAgo: 1,
  },
  {
    ticketType: 'suggestion',
    subject: 'Piste cyclable vers le RER',
    status: 'En attente',
    body: 'Prolonger la piste cyclable jusqu’à la station Kremlin-Bicêtre.',
    daysAgo: 3,
  },
  {
    ticketType: 'suggestion',
    subject: 'Composteur de quartier',
    status: "À l'étude",
    body: 'Installer un composteur collectif côté sud de la commune.',
    daysAgo: 6,
    messages: [
      {
        role: 'agent',
        body: 'Suggestion transmise au service développement durable.',
        hoursAfter: 6,
      },
    ],
  },
  {
    ticketType: 'suggestion',
    subject: 'Marché bio mensuel',
    status: 'Retenue',
    body: 'Organiser un marché bio une fois par mois place Jean-Jaurès.',
    daysAgo: 9,
    messages: [
      {
        role: 'agent',
        body: 'Idée retenue pour le prochain comité vie locale — merci !',
        hoursAfter: 8,
      },
    ],
  },
  {
    ticketType: 'suggestion',
    subject: 'Éclairage solaire chemin piéton',
    status: 'Mise en œuvre',
    body: 'Candélabres solaires sur le chemin piéton vers le RER.',
    daysAgo: 12,
    messages: [
      {
        role: 'agent',
        body: 'Projet validé ; pose prévue au prochain trimestre.',
        hoursAfter: 12,
      },
    ],
  },
  {
    ticketType: 'suggestion',
    subject: 'Fontaine à eau publique',
    status: 'Mise en œuvre',
    body: 'Fontaine près de la mairie pour les joggeurs.',
    daysAgo: 16,
    messages: [
      { role: 'agent', body: 'Installation programmée le mois prochain.', hoursAfter: 5 },
    ],
  },
  {
    ticketType: 'suggestion',
    subject: 'Aire de jeux inclusive',
    status: 'Réalisée',
    body: 'Équipements adaptés pour enfants à mobilité réduite.',
    daysAgo: 25,
    messages: [
      { role: 'agent', body: 'Les travaux sont terminés, inauguration le 15.', hoursAfter: 48 },
    ],
    feedback: { stars: 5, message: 'Magnifique résultat, bravo à la mairie !', daysAfterClose: 3 },
  },
  {
    ticketType: 'suggestion',
    subject: 'Skatepark couvert',
    status: 'Non retenue',
    body: 'Construire un skatepark couvert pour les jeunes.',
    daysAgo: 20,
    messages: [
      {
        role: 'agent',
        body: 'Projet non retenu cette année pour contraintes budgétaires.',
        hoursAfter: 24,
      },
    ],
    feedback: { stars: 2, message: 'Dommage mais on comprend le contexte.', daysAfterClose: 2 },
  },
  {
    ticketType: 'suggestion',
    subject: 'Wifi public place du marché',
    status: 'Clôturé',
    body: 'Couverture wifi gratuite sur la place.',
    daysAgo: 30,
    messages: [
      {
        role: 'agent',
        body: 'Étude confiée au service numérique, dossier clos en attente de financement.',
        hoursAfter: 36,
      },
    ],
    feedback: { stars: 3, daysAfterClose: 4 },
  },
];

export const EVENT_SEEDS = [
  {
    title: 'Marché des producteurs',
    description: 'Producteurs locaux, fromages, légumes de saison.',
    location: 'Place du 8 mai 1945',
    category: 'Marché',
    daysFromNow: 3,
    durationDays: 0,
  },
  {
    title: 'Concert de printemps',
    description: 'Harmonie municipale — entrée libre.',
    location: 'Salle des fêtes',
    category: 'Culture',
    daysFromNow: 10,
    durationDays: 0,
  },
  {
    title: 'Forum des associations',
    description: 'Rencontrez les associations de la ville.',
    location: 'Gymnase Jean-Moulin',
    category: 'Vie locale',
    daysFromNow: 18,
    durationDays: 0,
  },
  {
    title: 'Nettoyage participatif',
    description: 'Ramassage citoyen des espaces verts.',
    location: 'Parc Jean-Jaurès',
    category: 'Citoyenneté',
    daysFromNow: 7,
    durationDays: 0,
  },
  {
    title: 'Cinéma en plein air',
    description: 'Projection familiale — film français.',
    location: 'Parc du Plateau',
    category: 'Culture',
    daysFromNow: 25,
    durationDays: 0,
  },
  {
    title: 'Réunion publique budget',
    description: 'Présentation du budget participatif 2026.',
    location: 'Mairie — salle du conseil',
    category: 'Institutionnel',
    daysFromNow: 14,
    durationDays: 0,
  },
  {
    title: 'Fête de la musique (archives)',
    description: 'Édition précédente — scène rue Pasteur.',
    location: 'Rue Pasteur',
    category: 'Culture',
    daysFromNow: -45,
    durationDays: 0,
  },
  {
    title: 'Journée portes ouvertes mairie',
    description: 'Visite des services municipaux.',
    location: 'Hôtel de ville',
    category: 'Institutionnel',
    daysFromNow: -20,
    durationDays: 0,
  },
  {
    title: 'Atelier compostage',
    description: 'Apprenez à composter à la maison.',
    location: 'Maison de l\'environnement',
    category: 'Citoyenneté',
    daysFromNow: 5,
    durationDays: 0,
  },
  {
    title: 'Tournoi de foot jeunes',
    description: 'Catégories U11 et U13.',
    location: 'Stade municipal',
    category: 'Sport',
    daysFromNow: 12,
    durationDays: 1,
  },
  {
    title: 'Exposition photo « Ma ville »',
    description: 'Regards croisés des habitants.',
    location: 'Médiathèque',
    category: 'Culture',
    daysFromNow: 21,
    durationDays: 14,
  },
  {
    title: 'Conseil municipal (public)',
    description: 'Séance publique — ordre du jour en ligne.',
    location: 'Salle du conseil',
    category: 'Institutionnel',
    daysFromNow: 8,
    durationDays: 0,
  },
  {
    title: 'Fête des voisins',
    description: 'Apéritif convivial quartier Centre.',
    location: 'Square Carnot',
    category: 'Vie locale',
    daysFromNow: -10,
    durationDays: 0,
  },
];

export type ConstructionSeed =
  | {
      title: string;
      description: string;
      locationName: string;
      status: string;
      impactType: string;
      daysAgo: number;
      durationDays: number;
    }
  | {
      title: string;
      description: string;
      locationName: string;
      status: string;
      impactType: string;
      daysFromNow: number;
      durationDays: number;
    };

export const CONSTRUCTION_SEEDS: ConstructionSeed[] = [
  {
    title: 'Réfection chaussée avenue de Fontainebleau',
    description: 'Travaux de voirie sur 800 mètres.',
    locationName: 'Avenue de Fontainebleau',
    status: 'En cours',
    impactType: 'Circulation alternée',
    daysAgo: 5,
    durationDays: 30,
  },
  {
    title: 'Réseau eau potable rue Pasteur',
    description: 'Remplacement canalisation.',
    locationName: 'Rue Pasteur',
    status: 'Programmé',
    impactType: 'Rue barrée',
    daysFromNow: 10,
    durationDays: 14,
  },
  {
    title: 'Éclairage public quartier Closeaux',
    description: 'Modernisation LED.',
    locationName: 'Quartier Les Closeaux',
    status: 'En cours',
    impactType: 'Trottoir réduit',
    daysAgo: 12,
    durationDays: 20,
  },
  {
    title: 'Fibre optique — tranchée',
    description: 'Déploiement réseau très haut débit.',
    locationName: 'Rue de Paris',
    status: 'Terminé',
    impactType: 'Circulation alternée',
    daysAgo: 60,
    durationDays: 21,
  },
  {
    title: 'Rénovation place du marché',
    description: 'Reporté à l\'année prochaine.',
    locationName: 'Place du 8 mai 1945',
    status: 'Annulé',
    impactType: 'Rue barrée',
    daysAgo: 30,
    durationDays: 0,
  },
  {
    title: 'Piste cyclable provisoire',
    description: 'Aménagement temporaire été.',
    locationName: 'Boulevard de la République',
    status: 'Programmé',
    impactType: 'Trottoir réduit',
    daysFromNow: 45,
    durationDays: 90,
  },
  {
    title: 'Rénovation école Pasteur',
    description: 'Isolation thermique et accessibilité.',
    locationName: 'École Pasteur',
    status: 'En cours',
    impactType: 'Rue barrée',
    daysAgo: 20,
    durationDays: 120,
  },
  {
    title: 'Plantations arbres — opération reboisement',
    description: '20 arbres plantés avenue de Fontainebleau.',
    locationName: 'Avenue de Fontainebleau',
    status: 'Terminé',
    impactType: 'Trottoir réduit',
    daysAgo: 45,
    durationDays: 5,
  },
  {
    title: 'Réseau chaleur urbain — tranchée',
    description: 'Extension réseau vers le plateau.',
    locationName: 'Rue Jeanne d\'Arc',
    status: 'Programmé',
    impactType: 'Circulation alternée',
    daysFromNow: 60,
    durationDays: 45,
  },
  {
    title: 'Réfection trottoirs place Carnot',
    description: 'Accessibilité PMR.',
    locationName: 'Square Carnot',
    status: 'En cours',
    impactType: 'Trottoir réduit',
    daysAgo: 8,
    durationDays: 25,
  },
];
