export interface NotificationPreferences {
  moderationAlerts: boolean;
  weeklyReports: boolean;
  citizenEngagement: boolean;
  systemMaintenance: boolean;
  contactInbox: boolean;
  teamActivity: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  moderationAlerts: true,
  weeklyReports: true,
  citizenEngagement: false,
  systemMaintenance: true,
  contactInbox: true,
  teamActivity: true,
};

export function mergeNotificationPreferences(
  stored?: Record<string, unknown> | null,
): NotificationPreferences {
  if (!stored) return { ...DEFAULT_NOTIFICATION_PREFERENCES };

  return {
    moderationAlerts:
      typeof stored.moderationAlerts === 'boolean'
        ? stored.moderationAlerts
        : DEFAULT_NOTIFICATION_PREFERENCES.moderationAlerts,
    weeklyReports:
      typeof stored.weeklyReports === 'boolean'
        ? stored.weeklyReports
        : DEFAULT_NOTIFICATION_PREFERENCES.weeklyReports,
    citizenEngagement:
      typeof stored.citizenEngagement === 'boolean'
        ? stored.citizenEngagement
        : DEFAULT_NOTIFICATION_PREFERENCES.citizenEngagement,
    systemMaintenance:
      typeof stored.systemMaintenance === 'boolean'
        ? stored.systemMaintenance
        : DEFAULT_NOTIFICATION_PREFERENCES.systemMaintenance,
    contactInbox:
      typeof stored.contactInbox === 'boolean'
        ? stored.contactInbox
        : DEFAULT_NOTIFICATION_PREFERENCES.contactInbox,
    teamActivity:
      typeof stored.teamActivity === 'boolean'
        ? stored.teamActivity
        : DEFAULT_NOTIFICATION_PREFERENCES.teamActivity,
  };
}
