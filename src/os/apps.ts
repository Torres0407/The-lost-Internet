import { createElement, type ComponentType } from 'react';
import { ArchiveIndexApp } from '../apps/archiveIndex/ArchiveIndexApp';
import { NotebookApp } from '../apps/notebook/NotebookApp';
import { SettingsApp } from '../apps/settings/SettingsApp';
import { SoundLogApp } from '../apps/soundLog/SoundLogApp';
import { BrowserApp } from '../browser/BrowserApp';
import { HistoryApp } from '../browser/HistoryApp';
import { SourceApp } from '../browser/SourceApp';
import type { AppId } from './types';

export interface AppWindowProps {
  windowId?: string;
}

export interface AppDefinition {
  title: string;
  icon: AppId;
  defaultSize: {
    width: number;
    height: number;
  };
  component: ComponentType<AppWindowProps>;
}

function createPlaceholderApp(message: string): ComponentType<AppWindowProps> {
  return function PlaceholderAppView() {
    return createElement(
      'div',
      { className: 'flex h-full flex-col justify-between p-5' },
      createElement(
        'p',
        {
          className: 'font-body text-[0.9375rem] leading-relaxed',
          style: { color: 'var(--color-paper)' },
        },
        message
      )
    );
  };
}

export const APPS_REGISTRY: Record<AppId, AppDefinition> = {
  browser: {
    title: 'Browser',
    icon: 'browser',
    defaultSize: { width: 720, height: 500 },
    component: BrowserApp,
  },
  notebook: {
    title: 'Notebook',
    icon: 'notebook',
    defaultSize: { width: 640, height: 480 },
    component: NotebookApp,
  },
  'archive-index': {
    title: 'Archive Index',
    icon: 'archive-index',
    defaultSize: { width: 680, height: 480 },
    component: ArchiveIndexApp,
  },
  mail: {
    title: 'Mail',
    icon: 'mail',
    defaultSize: { width: 540, height: 380 },
    component: createPlaceholderApp('Mail coming soon'),
  },
  files: {
    title: 'Files',
    icon: 'files',
    defaultSize: { width: 500, height: 350 },
    component: createPlaceholderApp('Files coming soon'),
  },
  settings: {
    title: 'Settings',
    icon: 'settings',
    defaultSize: { width: 620, height: 520 },
    component: SettingsApp,
  },
  source: {
    title: 'Source',
    icon: 'source',
    defaultSize: { width: 620, height: 420 },
    component: SourceApp,
  },
  history: {
    title: 'History',
    icon: 'history',
    defaultSize: { width: 460, height: 360 },
    component: HistoryApp,
  },
  'sound-log': {
    title: 'Sound Log',
    icon: 'sound-log',
    defaultSize: { width: 460, height: 400 },
    component: SoundLogApp,
  },
};
