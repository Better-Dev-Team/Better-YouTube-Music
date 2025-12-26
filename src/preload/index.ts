import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  openSettings: () => ipcRenderer.invoke('open-settings'),
  getPlugins: () => ipcRenderer.invoke('get-plugins'),
  togglePlugin: (pluginName: string, enabled: boolean) =>
    ipcRenderer.invoke('toggle-plugin', pluginName, enabled),
  getPluginConfig: (pluginName: string) =>
    ipcRenderer.invoke('get-plugin-config', pluginName),
  setPluginConfig: (pluginName: string, config: any) =>
    ipcRenderer.invoke('set-plugin-config', pluginName, config),
  windowAction: (action: string) =>
    ipcRenderer.invoke('window-action', action),
  invoke: (channel: string, ...args: any[]) =>
    ipcRenderer.invoke(channel, ...args),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  navigate: (action: 'back' | 'forward' | 'refresh') => ipcRenderer.invoke('navigate', action),
  onUpdateStatus: (callback: (status: any) => void) => {
    const channels = ['update-status', 'update-available', 'update-progress', 'update-downloaded', 'update-error'];
    channels.forEach(channel => {
      ipcRenderer.on(channel, (_event, ...args) => callback({ type: channel, data: args[0] }));
    });
  }
});

// Type definitions for TypeScript
declare global {
  interface Window {
    electronAPI: {
      openSettings: () => Promise<void>;
      getPlugins: () => Promise<Array<{ name: string; description?: string; enabled: boolean }>>;
      togglePlugin: (pluginName: string, enabled: boolean) => Promise<boolean>;
      getPluginConfig: (pluginName: string) => Promise<any>;
      setPluginConfig: (pluginName: string, config: any) => Promise<boolean>;
      windowAction: (action: string) => Promise<void>;
      getAppVersion: () => Promise<string>;
      checkForUpdates: () => Promise<void>;
      installUpdate: () => Promise<void>;
      navigate: (action: 'back' | 'forward' | 'refresh') => Promise<void>;
      onUpdateStatus: (callback: (status: { type: string; data: any }) => void) => void;
      invoke: (channel: string, ...args: any[]) => Promise<any>;
    };
  }
}
