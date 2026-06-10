export type ContactTicketType = 'question' | 'suggestion';

export const QUESTION_STATUSES = ['En attente', 'En cours', 'Clôturé'] as const;

export const SUGGESTION_STATUSES = [
  'En attente',
  "À l'étude",
  'Retenue',
  'Mise en œuvre',
  'Réalisée',
  'Non retenue',
  'Clôturé',
] as const;

const SUGGESTION_TERMINAL = new Set<string>(['Réalisée', 'Non retenue', 'Clôturé']);

export function isTerminalContactStatus(ticketType: ContactTicketType, status: string): boolean {
  if (ticketType === 'suggestion') {
    return SUGGESTION_TERMINAL.has(status);
  }
  return status === 'Clôturé';
}

export function allowedStatusesForType(ticketType: ContactTicketType): readonly string[] {
  return ticketType === 'suggestion' ? SUGGESTION_STATUSES : QUESTION_STATUSES;
}

export function isAllowedStatus(ticketType: ContactTicketType, status: string): boolean {
  return allowedStatusesForType(ticketType).includes(status);
}

/** Premier passage en traitement après réponse agent */
export function statusAfterAgentFirstReply(ticketType: ContactTicketType): string {
  return ticketType === 'suggestion' ? "À l'étude" : 'En cours';
}
