export type DesktopAppId =
  | 'browser'
  | 'notebook'
  | 'archive-index'
  | 'mail'
  | 'files'
  | 'settings';

export type AppId = DesktopAppId | 'source' | 'history' | 'sound-log';

export interface DesktopIconItem {
  id: DesktopAppId;
  label: string;
  description: string;
}
