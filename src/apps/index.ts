import type { DesktopAppId } from '../os/types';

export interface AppDescriptor {
  id: DesktopAppId;
  title: string;
}

export const APP_REGISTRY: Record<DesktopAppId, AppDescriptor> = {
  browser: { id: 'browser', title: 'Browser' },
  notebook: { id: 'notebook', title: 'Notebook' },
  'archive-index': { id: 'archive-index', title: 'Archive Index' },
  mail: { id: 'mail', title: 'Mail' },
  files: { id: 'files', title: 'Files' },
  settings: { id: 'settings', title: 'Settings' },
};
