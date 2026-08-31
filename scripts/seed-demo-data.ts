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
  // En attente — dont urgents
  { category: 'Voirie', status: 'En attente', description: 'Nid de poule profond avenue de Fontainebleau', daysAgo: 0 },
  { category: 'Éclairage', status: 'En attente', description: 'Lampadaire éteint rue Pasteur — zone sombre', daysAgo: 0 },
  { category: 'Sécurité', status: 'En attente', description: 'Danger : barrière cassée près de l\'école', daysAgo: 1, urgent: true },
  { category: 'Voirie', status: 'En attente', description: 'Trottoir dégradé place du 8 mai 1945', daysAgo: 1 },
  { category: 'Propreté', status: 'En attente', description: 'Dépôt sauvage de encombrants', daysAgo: 2 },
  { category: 'Espaces Verts', status: 'En attente', description: 'Banc cassé au parc Jean-Jaurès', daysAgo: 2 },
  { category: 'Autre', status: 'En attente', description: 'Grille du stade municipale forcée', daysAgo: 3 },
  { category: 'Voirie', status: 'En attente', description: 'Marquage au sol effacé passage piéton', daysAgo: 3, withImage: true },
  { category: 'Éclairage', status: 'En attente', description: 'Éclairage public clignotant rue Jeanne d\'Arc', daysAgo: 4 },
  { category: 'Propreté', status: 'En attente', description: 'Poubelles débordantes marché du mercredi', daysAgo: 5 },

  // En cours
  {
    category: 'Voirie',
    status: 'En cours',
    description: 'Chaussée affaissée rue de Paris',
    daysAgo: 6,
    messages: [
      { role: 'citizen', body: 'Le trou s\'agrandit chaque semaine.' },
      { role: 'agent', body: 'Bonjour, votre signalement est pris en charge. Intervention programmée.', hoursAfter: 4 },
    ],
  },
  {
    category: 'Éclairage',
    status: 'En cours',
    description: 'Plusieurs lampadaires HS parking mairie',
    daysAgo: 7,
    messages: [
      { role: 'citizen', body: 'C\'est très sombre le soir.' },
      { role: 'agent', body: 'Le service technique a été alerté.', hoursAfter: 2 },
      { role: 'citizen', body: 'Merci pour la réactivité !' },
    ],
  },
  {
    category: 'Propreté',
    status: 'En cours',
    description: 'Tags sur le mur de la médiathèque',
    daysAgo: 8,
    messages: [
      { role: 'citizen', body: 'Graffiti apparus ce week-end.' },
      { role: 'agent', body: 'Nettoyage prévu cette semaine.', hoursAfter: 6 },
    ],
  },
  {
    category: 'Espaces Verts',
    status: 'En cours',
    description: 'Arbre menaçant de tomber après la tempête',
    daysAgo: 9,
    messages: [
      { role: 'citizen', body: 'Branches au-dessus du trottoir.' },
      { role: 'agent', body: 'Élagage planifié par le service espaces verts.', hoursAfter: 8 },
    ],
  },
  {
    category: 'Sécurité',
    status: 'En cours',
    description: 'Feu tricolore en panne carrefour République',
    daysAgo: 10,
    messages: [
      { role: 'citizen', body: 'Circulation difficile aux heures de pointe.' },
      { role: 'agent', body: 'Signalé à la voirie, intervention en cours.', hoursAfter: 1 },
    ],
  },
  {
    category: 'Autre',
    status: 'En cours',
    description: 'Borne de recharge vélo hors service',
    daysAgo: 11,
    messages: [
      { role: 'citizen', body: 'Impossible de recharger mon vélo électrique.' },
      { role: 'agent', body: 'Prestataire contacté pour réparation.', hoursAfter: 12 },
    ],
  },

  // Résolus — avec feedback
  {
    category: 'Voirie',
    status: 'Résolu',
    description: 'Plot renversé sur la chaussée',
    daysAgo: 14,
    messages: [
      { role: 'citizen', body: 'Plot dangereux pour les voitures.' },
      { role: 'agent', body: 'Intervention effectuée ce matin.', hoursAfter: 5 },
      { role: 'agent', body: 'Signalement clôturé — bonne journée !', hoursAfter: 24 },
    ],
    feedback: { stars: 5, message: 'Intervention rapide, merci à l\'équipe !', daysAfterClose: 2 },
  },
  {
    category: 'Éclairage',
    status: 'Résolu',
    description: 'Lampadaire réparé rue des Closeaux',
    daysAgo: 15,
    feedback: { stars: 5, message: 'Parfait, la rue est à nouveau éclairée.', daysAfterClose: 1 },
  },
  {
    category: 'Propreté',
    status: 'Résolu',
    description: 'Déchets enlevés square Carnot',
    daysAgo: 16,
    feedback: { stars: 4, daysAfterClose: 3 },
  },
  {
    category: 'Espaces Verts',
    status: 'Résolu',
    description: 'Taille des haies effectuée',
    daysAgo: 17,
    feedback: { stars: 5, message: 'Très satisfait du résultat.', daysAfterClose: 2 },
  },
  {
    category: 'Voirie',
    status: 'Résolu',
    description: 'Nid de poule comblé avenue de Stalingrad',
    daysAgo: 18,
    feedback: { stars: 3, message: 'Bien réparé mais un peu long à traiter.', daysAfterClose: 4 },
  },
  {
    category: 'Sécurité',
    status: 'Résolu',
    description: 'Barrière de sécurité réinstallée',
    daysAgo: 19,
    feedback: { stars: 5, daysAfterClose: 1 },
  },
  {
    category: 'Autre',
    status: 'Résolu',
    description: 'Panneau directionnel remis en place',
    daysAgo: 20,
    feedback: { stars: 4, message: 'Merci pour le suivi.', daysAfterClose: 2 },
  },
  {
    category: 'Voirie',
    status: 'Résolu',
    description: 'Fuite d\'eau réparée sur la voirie',
    daysAgo: 21,
    feedback: { stars: 5, message: 'Excellente réactivité de la mairie.', daysAfterClose: 1 },
  },
  {
    category: 'Propreté',
    status: 'Résolu',
    description: 'Caniveaux nettoyés rue Jean-Jaurès',
    daysAgo: 22,
    feedback: { stars: 2, message: 'Délai un peu long mais résolu au final.', daysAfterClose: 5 },
  },
  {
    category: 'Éclairage',
    status: 'Résolu',
    description: 'Éclairage place du marché rétabli',
    daysAgo: 23,
    feedback: { stars: 5, daysAfterClose: 2 },
  },
  {
    category: 'Espaces Verts',
    status: 'Résolu',
    description: 'Banc du parc remplacé',
    daysAgo: 24,
    feedback: { stars: 4, message: 'Bon travail.', daysAfterClose: 3 },
  },
  {
    category: 'Voirie',
    status: 'Résolu',
    description: 'Signalisation horizontale refaite',
    daysAgo: 25,
    feedback: { stars: 5, daysAfterClose: 1 },
  },

  // Clôturés
  {
    category: 'Autre',
    status: 'Clôturé',
    description: 'Demande hors périmètre communal — orienté vers bailleur',
    daysAgo: 28,
    feedback: { stars: 3, message: 'Réponse claire même si pas résolu par la mairie.', daysAfterClose: 2 },
  },
  {
    category: 'Propreté',
    status: 'Clôturé',
    description: 'Signalement doublon — dossier fusionné',
    daysAgo: 29,
    feedback: { stars: 4, daysAfterClose: 1 },
  },
  {
    category: 'Voirie',
    status: 'Clôturé',
    description: 'Travaux déjà programmés par la métropole',
    daysAgo: 30,
    feedback: { stars: 1, message: 'Pas assez d\'informations sur le calendrier.', daysAfterClose: 3 },
  },
  {
    category: 'Éclairage',
    status: 'Clôturé',
    description: 'Éclairage privé — contact propriétaire transmis',
    daysAgo: 31,
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
  // Questions
  { ticketType: 'question', subject: 'Horaires mairie été', status: 'En attente', body: 'Quels sont les horaires d\'ouverture en juillet ?', daysAgo: 1 },
  { ticketType: 'question', subject: 'Carte d\'identité', status: 'En attente', body: 'Comment prendre rendez-vous pour une CNI ?', daysAgo: 2 },
  { ticketType: 'question', subject: 'Taxe foncière', status: 'En attente', body: 'Je n\'ai pas reçu mon avis d\'imposition.', daysAgo: 3 },
  {
    ticketType: 'question',
    subject: 'Inscription école maternelle',
    status: 'En cours',
    body: 'Dossier d\'inscription pour septembre — quels documents ?',
    daysAgo: 5,
    messages: [
      { role: 'agent', body: 'Bonjour, la liste des pièces est sur notre site rubrique Éducation.', hoursAfter: 3 },
    ],
  },
  {
    ticketType: 'question',
    subject: 'Stationnement résidents',
    status: 'En cours',
    body: 'Comment obtenir le macaron de stationnement ?',
    daysAgo: 6,
    messages: [
      { role: 'agent', body: 'Le formulaire est disponible en mairie ou en ligne.', hoursAfter: 2 },
      { role: 'citizen', body: 'Merci, je passerai demain.', hoursAfter: 5 },
    ],
  },
  {
    ticketType: 'question',
    subject: 'État civil — acte de naissance',
    status: 'Clôturé',
    body: 'Besoin d\'une copie intégrale pour un dossier.',
    daysAgo: 12,
    messages: [
      { role: 'agent', body: 'Vous pouvez le retirer à l\'accueil avec une pièce d\'identité.', hoursAfter: 1 },
    ],
    feedback: { stars: 5, message: 'Réponse rapide et claire.', daysAfterClose: 1 },
  },
  {
    ticketType: 'question',
    subject: 'Bruit de travaux',
    status: 'Clôturé',
    body: 'Travaux autorisés le week-end ?',
    daysAgo: 15,
    messages: [
      { role: 'agent', body: 'Les horaires réglementaires sont de 7h à 20h en semaine.', hoursAfter: 4 },
    ],
    feedback: { stars: 4, daysAfterClose: 2 },
  },
  {
    ticketType: 'question',
    subject: 'Urgent — coupure eau',
    status: 'Clôturé',
    body: 'Coupure d\'eau dans tout l\'immeuble, que faire ?',
    daysAgo: 8,
    urgent: true,
    messages: [
      { role: 'agent', body: 'Contactez le gestionnaire syndic en priorité. Numéro utile : 01 XX XX XX XX.', hoursAfter: 0.5 },
    ],
    feedback: { stars: 5, daysAfterClose: 1 },
  },

  // Suggestions — tous les statuts
  { ticketType: 'suggestion', subject: 'Bancs au parc', status: 'En attente', body: 'Installer des bancs ombragés près de l\'aire de jeux.', daysAgo: 2 },
  { ticketType: 'suggestion', subject: 'Piste cyclable', status: 'En attente', body: 'Prolonger la piste jusqu\'à la station RER.', daysAgo: 4 },
  {
    ticketType: 'suggestion',
    subject: 'Composteur collectif',
    status: 'À l\'étude',
    body: 'Mise en place d\'un composteur de quartier.',
    daysAgo: 7,
    messages: [
      { role: 'agent', body: 'Votre suggestion est à l\'étude par le service développement durable.', hoursAfter: 6 },
    ],
  },
  {
    ticketType: 'suggestion',
    subject: 'Marché bio mensuel',
    status: 'Retenue',
    body: 'Organiser un marché bio une fois par mois.',
    daysAgo: 10,
    messages: [
      { role: 'agent', body: 'Bonne idée — retenue pour le prochain comité vie locale.', hoursAfter: 8 },
    ],
  },
  {
    ticketType: 'suggestion',
    subject: 'Éclairage solaire',
    status: 'Mise en œuvre',
    body: 'Remplacer l\'éclairage du parc par des lampes solaires.',
    daysAgo: 14,
    messages: [
      { role: 'agent', body: 'Projet retenu, travaux prévus au 2e trimestre.', hoursAfter: 12 },
      { role: 'citizen', body: 'Super nouvelle !', hoursAfter: 20 },
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
      { role: 'agent', body: 'Projet non retenu cette année pour contraintes budgétaires.', hoursAfter: 24 },
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
      { role: 'agent', body: 'Étude confiée au service numérique, dossier clos en attente de financement.', hoursAfter: 36 },
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
