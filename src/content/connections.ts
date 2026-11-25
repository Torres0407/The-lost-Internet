import type { ConnectionDef } from '../engine/types';

export type { ConnectionDef };

export const CONNECTION_DEFS: readonly ConnectionDef[] = [
  {
    id: 'conn_1109_maintenance',
    clueMatchers: ['11/09', 'maintenance window'],
    grants: ['connection_1109'],
    insightTitle: 'The 23:00 Window',
    insightText:
      "Lamplighter signed Delphine's guestbook on 11/09—the exact night Tumbleweed scheduled its 23:00 maintenance window. Look for a hidden log at meridian://lamplighter/log_0911.",
  },
  {
    id: 'connection_deliberate',
    clueMatchers: ['bulk account removal', 'thanks for everything'],
    grants: ['connection_deliberate'],
    insightTitle: 'Nobody did this to them',
    insightText:
      "The 'routine migration' was a bulk removal request, filed by a Ring admin days before the goodbye thread. Whatever happened to the Ring, someone inside it chose it.",
  },
];
