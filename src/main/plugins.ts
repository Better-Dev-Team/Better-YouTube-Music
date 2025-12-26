import { BrowserWindow } from 'electron';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { app } from 'electron';
import Store from 'electron-store';

const store = new Store();

export interface Plugin {
  name: string;
  path: string;
  renderer?: string;
  preload?: string;
  enabled: boolean;
}

/**
 * Get the plugins directory path
 */
function getPluginsDirectory(): string {
  const userDataPath = app.getPath('userData');
  return join(userDataPath, 'plugins');
}

/**
 * Load all plugins from the plugins directory
 */
export async function loadPlugins(): Promise<Plugin[]> {
  const pluginsDir = getPluginsDirectory();
  const plugins: Plugin[] = [];

  try {
    const entries = await readdir(pluginsDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const pluginPath = join(pluginsDir, entry.name);
        const plugin: Plugin = {
          name: entry.name,
          path: pluginPath,
          enabled: (store.get(`plugins.${entry.name}.enabled`, true) as boolean)
        };

        // Try to load renderer.js
        try {
          const rendererPath = join(pluginPath, 'renderer.js');
          plugin.renderer = await readFile(rendererPath, 'utf-8');
        } catch (e) {
          // renderer.js is optional
        }

        // Try to load preload.js
        try {
          const preloadPath = join(pluginPath, 'preload.js');
          plugin.preload = await readFile(preloadPath, 'utf-8');
        } catch (e) {
          // preload.js is optional
        }

        plugins.push(plugin);
      }
    }
  } catch (error) {
    console.error('Error loading plugins:', error);
  }

  return plugins;
}

/**
 * Initialize and inject plugins into the window
 */
export async function initializePlugins(window: BrowserWindow) {
  const plugins = await loadPlugins();
  
  for (const plugin of plugins) {
    if (!plugin.enabled) {
      continue;
    }

    if (plugin.renderer) {
      try {
        // Wrap plugin code in IIFE to avoid conflicts
        const wrappedCode = `
          (function() {
            try {
              ${plugin.renderer}
            } catch (error) {
              console.error('Plugin ${plugin.name} error:', error);
            }
          })();
        `;
        
        await window.webContents.executeJavaScript(wrappedCode, true);
        console.log(`Injected plugin: ${plugin.name}`);
      } catch (error) {
        console.error(`Error injecting plugin ${plugin.name}:`, error);
      }
    }
  }
}

