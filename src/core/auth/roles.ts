import { isBackofficeRole, normalizeToCanonicalRole, CanonicalRole } from './permissions';

export function normalizeRole(role: string | undefined | null): string {
  return (role ?? '').trim().toLowerCase();
}

/** Compte mairie / backoffice (maire, assistant, agent). */
export function isStaffRole(role: string | undefined | null): boolean {
  return isBackofficeRole(role);
}

export function resolveReportSenderRole(role: string | undefined | null): 'agent' | 'citizen' {
  const canonical = normalizeToCanonicalRole(role);
  if (canonical === CanonicalRole.CITIZEN) return 'citizen';
  return 'agent';
}
