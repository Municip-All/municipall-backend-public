import type { ContactSeed, ReportSeed } from './seed-demo-data';

const REPORT_CATEGORIES = ['Voirie', 'Éclairage', 'Propreté', 'Espaces Verts', 'Sécurité', 'Autre'] as const;

const BULK_DESCRIPTIONS: Record<string, string[]> = {
  Voirie: [
    'Trottoir fissuré devant le n°12',
    'Ralentisseur effacé par l\'usure',
    'Grille d\'égout bruyante au passage',
    'Chaussée glissante après pluie',
  ],
  Éclairage: [
    'Lampadaire qui clignote toute la nuit',
    'Zone sans éclairage derrière les commerces',
    'Câble apparent sur mât lumineux',
  ],
  Propreté: [
    'Papiers et déchets au pied des arbres',
    'Odeurs persistantes benne à verre',
    'Mégots accumulés devant la gare',
  ],
  'Espaces Verts': [
    'Haie non taillée obstruant le trottoir',
    'Pelouse piétinée au parc',
    'Arbre mort à évaluer',
  ],
  Sécurité: [
    'Passage piéton peu visible',
    'Glissade sur trottoir mouillé — urgent',
    'Barrière de chantier déplacée',
  ],
  Autre: [
    'Mobilier urbain vandalisé',
    'Borne d\'information illisible',
    'Signalétique touristique manquante',
  ],
};

const QUESTION_SUBJECTS = [
  'Permis de construire',
  'Recensement citoyen',
  'Mariage civil — délais',
  'Changement d\'adresse',
  'Cantine scolaire — tarifs',
  'Piscine municipale — horaires',
  'Bibliothèque — inscription',
  'Allocation petite enfance',
  'Encombrants — enlèvement',
  'Voirie — déclaration travaux privatifs',
];

const SUGGESTION_EXTRA = [
  { subject: 'Arceaux vélos gare', body: 'Plus d\'arceaux sécurisés à la sortie RER.' },
  { subject: 'Tables de ping-pong', body: 'Tables extérieures près du gymnase.' },
  { subject: 'Sensibilisation tri', body: 'Affichage pédagogique sur le tri sélectif.' },
  { subject: 'Zone 30 école', body: 'Élargir la zone 30 autour de l\'école Pasteur.' },
  { subject: 'Compostage collectif', body: 'Nouveau point de compostage quartier sud.' },
];

export function buildBulkReports(count: number): ReportSeed[] {
  const statuses: { status: string; weight: number }[] = [
    { status: 'En attente', weight: 35 },
    { status: 'En cours', weight: 25 },
    { status: 'Résolu', weight: 30 },
    { status: 'Clôturé', weight: 10 },
  ];

  const seeds: ReportSeed[] = [];
  for (let i = 0; i < count; i++) {
    const category = REPORT_CATEGORIES[i % REPORT_CATEGORIES.length];
    const pool = BULK_DESCRIPTIONS[category];
    const description = pool[i % pool.length];
    const roll = i % 100;
    let status = 'En attente';
    let acc = 0;
    for (const s of statuses) {
      acc += s.weight;
      if (roll < acc) {
        status = s.status;
        break;
      }
    }

    const daysAgo = i % 28;
    const seed: ReportSeed = {
      category,
      status,
      description: `[Auto] ${description}`,
      daysAgo,
      withImage: i % 5 === 0,
    };

    if (status === 'En cours' || status === 'Résolu') {
      seed.messages = [
        { role: 'citizen', body: description },
        {
          role: 'agent',
          body: 'Votre signalement a bien été enregistré et transmis au service concerné.',
          hoursAfter: 2 + (i % 6),
        },
      ];
    }

    if (status === 'Résolu' && i % 3 === 0) {
      const stars = 3 + (i % 3);
      seed.feedback = {
        stars,
        message:
          stars >= 4
            ? 'Bonne prise en charge, merci.'
            : 'Correct, délai un peu long.',
        daysAfterClose: 1 + (i % 3),
      };
    }

    seeds.push(seed);
  }
  return seeds;
}

export function buildBulkQuestions(count: number): ContactSeed[] {
  const seeds: ContactSeed[] = [];
  for (let i = 0; i < count; i++) {
    const subject = QUESTION_SUBJECTS[i % QUESTION_SUBJECTS.length];
    const status = i % 4 === 0 ? 'En cours' : 'En attente';
    seeds.push({
      ticketType: 'question',
      subject: `${subject} (#${i + 1})`,
      status,
      body: `Bonjour, j'aurais besoin d'informations concernant : ${subject.toLowerCase()}.`,
      daysAgo: i % 14,
      messages:
        status === 'En cours'
          ? [
              {
                role: 'agent',
                body: 'Bonjour, un agent va vous répondre sous 48h ouvrées.',
                hoursAfter: 3,
              },
            ]
          : undefined,
    });
  }
  return seeds;
}

export function buildBulkSuggestions(count: number): ContactSeed[] {
  const activeStatuses = ['En attente', 'À l\'étude', 'Retenue', 'Mise en œuvre'];
  const seeds: ContactSeed[] = [];
  for (let i = 0; i < count; i++) {
    const item = SUGGESTION_EXTRA[i % SUGGESTION_EXTRA.length];
    seeds.push({
      ticketType: 'suggestion',
      subject: `${item.subject} (${i + 1})`,
      status: activeStatuses[i % activeStatuses.length],
      body: item.body,
      daysAgo: 3 + (i % 20),
      messages:
        i % 2 === 0
          ? [
              {
                role: 'agent',
                body: 'Merci pour cette proposition, elle est en cours d\'analyse.',
                hoursAfter: 8,
              },
            ]
          : undefined,
    });
  }
  return seeds;
}

/** Avis supplémentaires pour remplir la courbe satisfaction (7–30 jours) */
export function buildTimelineFeedback(count: number): {
  stars: number;
  message?: string;
  daysAgo: number;
}[] {
  const messages = [
    'Très réactif, bravo !',
    'Échange cordial avec la mairie.',
    'Problème réglé en moins d\'une semaine.',
    undefined,
    'Un peu d\'attente mais bon résultat.',
    'Service municipal à l\'écoute.',
    'Pourrait être plus rapide.',
    'Excellente communication.',
    undefined,
    'Merci à l\'équipe technique.',
  ];
  const items: { stars: number; message?: string; daysAgo: number }[] = [];
  for (let i = 0; i < count; i++) {
    items.push({
      stars: 3 + (i % 3),
      message: messages[i % messages.length],
      daysAgo: 1 + (i % 28),
    });
  }
  return items;
}
