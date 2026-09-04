import {
  allowedStatusesForType,
  isAllowedStatus,
  isTerminalContactStatus,
  statusAfterAgentFirstReply,
  QUESTION_STATUSES,
  SUGGESTION_STATUSES,
} from './contact-ticket-status';

describe('contact-ticket-status', () => {
  it('isTerminalContactStatus for questions and suggestions', () => {
    expect(isTerminalContactStatus('question', 'Clôturé')).toBe(true);
    expect(isTerminalContactStatus('question', 'En cours')).toBe(false);
    expect(isTerminalContactStatus('suggestion', 'Réalisée')).toBe(true);
    expect(isTerminalContactStatus('suggestion', 'Non retenue')).toBe(true);
    expect(isTerminalContactStatus('suggestion', "À l'étude")).toBe(false);
  });

  it('allowedStatusesForType returns the right list', () => {
    expect(allowedStatusesForType('question')).toBe(QUESTION_STATUSES);
    expect(allowedStatusesForType('suggestion')).toBe(SUGGESTION_STATUSES);
  });

  it('isAllowedStatus validates membership', () => {
    expect(isAllowedStatus('question', 'En attente')).toBe(true);
    expect(isAllowedStatus('question', 'Retenue')).toBe(false);
    expect(isAllowedStatus('suggestion', 'Retenue')).toBe(true);
  });

  it('statusAfterAgentFirstReply', () => {
    expect(statusAfterAgentFirstReply('question')).toBe('En cours');
    expect(statusAfterAgentFirstReply('suggestion')).toBe("À l'étude");
  });
});
