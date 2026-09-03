import type { ContactSeed, ReportSeed } from './seed-demo-data';

const REPORT_CATEGORIES = ['Voirie', 'Éclairage', 'Propreté', 'Espaces Verts', 'Sécurité', 'Autre'] as const;

const BULK_DESCRIPTIONS: Record<string, string[]> = {
  Voirie: [
    'Bordure de trottoir affaissée face au 45 rue Gabriel-Péri',
    'Nid-de-poule au carrefour avenue de Fontainebleau / rue Pasteur',
    'Marquage au sol illisible devant l’école Anatole-France',
    'Plaque d’égout qui résonne à chaque passage de bus',
  ],
  Éclairage: [
    'Candélabre HS allée des Peupliers — zone très sombre',
    'Éclairage intermittent parking relais RER Kremlin-Bicêtre',
    'Luminaire endommagé après collision rue du 8-Mai',
  ],
  Propreté: [
    'Dépôt d’encombrants récurrent rue de la Convention',
    'Bennes à verre saturées place Jean-Jaurès',
    'Déjections canines non ramassées square Carnot',
  ],
  'Espaces Verts': [
    'Branche basse gênant les poussettes parc des Closeaux',
    'Massif fleuri piétiné près de l’aire de jeux',
    'Arbre penché à expertiser rue des Meuniers',
  ],
  Sécurité: [
    'Glissière de chantier mal calée rue de Paris',
    'Passage piéton peu visible aux heures de pointe',
    'Barrière anti-bélier déplacée devant l’école',
  ],
  Autre: [
    'Borne vélo en panne place de la République',
    'Panneau directionnel pivote au vent',
    'Abribus sans vitre côté avenue',
  ],
};

const QUESTION_SUBJECTS = [
  'Attestation d’hébergement',
  'Inscription centre de loisirs',
  'Déclaration de travaux façade',
  'Accès médiathèque numérique',
  'Tarification cantine — quotient',
  'Réservation salle municipale',
  'Demande de macaron riverain',
  'Horaires déchèterie mobile',
  'Aide à la rénovation énergétique',
  'Certificat de vie commune',
];

const SUGGESTION_EXTRA = [
  { subject: 'Fontaine à eau potable', body: 'Installer une fontaine près du skatepark des Closeaux.' },
  { subject: 'Radar pédagogique', body: 'Radar pédagogique rue de Paris face au collège.' },
  { subject: 'Ateliers réparation vélo', body: 'Ateliers mensuels réparation vélo en partenariat associations.' },
  { subject: 'Éclairage chemin piéton', body: 'Renforcer l’éclairage du chemin piéton vers le RER.' },
  { subject: 'Boîtes à livres', body: 'Boîtes à livres supplémentaires dans les squares de quartier.' },
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
      description: `[Démo v2] ${description}`,
      daysAgo,
      withImage: i % 5 === 0,
    };

    if (status === 'En cours' || status === 'Résolu') {
      seed.messages = [
        { role: 'citizen', body: description },
        {
          role: 'agent',
          body: 'Signalement transmis au service technique. Nous vous tiendrons informé.',
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
            ? 'Intervention efficace, merci aux agents.'
            : 'Réglé, mais le délai était un peu long.',
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
      subject: `${subject} — dossier ${i + 1}`,
      status,
      body: `Bonjour, pourriez-vous m’indiquer la démarche pour : ${subject.toLowerCase()} ? Merci.`,
      daysAgo: i % 14,
      messages:
        status === 'En cours'
          ? [
              {
                role: 'agent',
                body: 'Bonjour, votre demande est prise en charge. Réponse sous 2 jours ouvrés.',
                hoursAfter: 3,
              },
            ]
          : undefined,
    });
  }
  return seeds;
}

export function buildBulkSuggestions(count: number): ContactSeed[] {
  const activeStatuses = ['En attente', "À l'étude", 'Retenue', 'Mise en œuvre'];
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
                body: 'Merci pour votre proposition : elle est examinée par le service concerné.',
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
    'Service réactif.',
    'Bonne communication.',
    'Délai un peu long.',
    'Très satisfait du suivi.',
    'Agent courtois et efficace.',
  ];
  const out: { stars: number; message?: string; daysAgo: number }[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      stars: 2 + (i % 4),
      message: i % 2 === 0 ? messages[i % messages.length] : undefined,
      daysAgo: 7 + (i % 24),
    });
  }
  return out;
}
