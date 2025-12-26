import { BrowserWindow, Session } from 'electron';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { Plugin, BasePlugin } from './Plugin';

/**
 * Plugin Loader
 * Dynamically loads and manages plugins with lifecycle hooks
 * Similar to youtube-desktop's plugin system
 */
export class PluginLoader {
  private plugins: Map<string, Plugin> = new Map();
  private pluginsDirectory: string;

  constructor(pluginsDirectory: string) {
    this.pluginsDirectory = pluginsDirectory;
  }

  /**
   * Set the session for plugins that need it (e.g., AdBlocker)
   */
  public setSession(_session: Session): void {
    // Session is currently not used but kept for interface compatibility
  }

  /**
   * Load all plugins from the plugins directory
   */
  public async loadPlugins(): Promise<void> {
    try {
      // Ensure plugins directory exists
      try {
        await stat(this.pluginsDirectory);
      } catch {
        // Directory doesn't exist, create it
        const { mkdir } = await import('fs/promises');
        await mkdir(this.pluginsDirectory, { recursive: true });
        return;
      }

      const entries = await readdir(this.pluginsDirectory, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          await this.loadPlugin(entry.name);
        }
      }

      console.log(`Loaded ${this.plugins.size} plugin(s)`);
    } catch (error) {
      console.error('Error loading plugins:', error);
    }
  }

  /**
   * Load a single plugin
   */
  private async loadPlugin(pluginName: string): Promise<void> {
    try {
      const pluginPath = join(this.pluginsDirectory, pluginName);

      // Try to load plugin entry point
      let pluginModule: any;
      try {
        // In a real implementation, you'd use require() or dynamic import
        // For now, we'll create a plugin instance from the directory structure
        pluginModule = await this.createPluginFromDirectory(pluginName, pluginPath);
      } catch (error) {
        console.warn(`Plugin ${pluginName} has no index.js, skipping`);
        return;
      }

      if (pluginModule && pluginModule.default) {
        const plugin: Plugin = new pluginModule.default(pluginName);
        // Only set if not already registered (registered plugins take precedence)
        if (!this.plugins.has(pluginName)) {
          this.plugins.set(pluginName, plugin);
          console.log(`Loaded plugin from filesystem: ${pluginName}`);
        } else {
          console.log(`Skipping filesystem plugin ${pluginName} - already registered`);
        }
      }
    } catch (error) {
      console.error(`Error loading plugin ${pluginName}:`, error);
    }
  }

  /**
   * Create a plugin instance from directory structure
   * This is a fallback for plugins that don't have a proper index.js
   */
  private async createPluginFromDirectory(pluginName: string, _pluginPath: string): Promise<any> {
    // For now, return a basic plugin wrapper
    // In Phase 2, we'll implement proper plugin loading
    return {
      default: class extends BasePlugin {
        public metadata = {
          name: pluginName,
        };
      },
    };
  }

  /**
   * Register a plugin programmatically
   */
  public registerPlugin(plugin: Plugin): void {
    this.plugins.set(plugin.metadata.name, plugin);
    console.log(`Registered plugin: ${plugin.metadata.name}`);
  }

  /**
   * Get a plugin by name
   */
  public getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Get all plugins
   */
  public getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get enabled plugins only
   */
  public getEnabledPlugins(): Plugin[] {
    return this.getAllPlugins().filter(plugin => plugin.isEnabled());
  }

  /**
   * Call onAppReady hook for all enabled plugins
   */
  public async callOnAppReady(): Promise<void> {
    const enabledPlugins = this.getEnabledPlugins();

    for (const plugin of enabledPlugins) {
      if (plugin.onAppReady) {
        try {
          await plugin.onAppReady();
        } catch (error) {
          console.error(`Error in ${plugin.metadata.name}.onAppReady:`, error);
        }
      }
    }
  }

  /**
   * Call onWindowCreated hook for all enabled plugins
   */
  public async callOnWindowCreated(window: BrowserWindow): Promise<void> {
    const enabledPlugins = this.getEnabledPlugins();

    for (const plugin of enabledPlugins) {
      if (plugin.onWindowCreated) {
        try {
          await plugin.onWindowCreated(window);
        } catch (error) {
          console.error(`Error in ${plugin.metadata.name}.onWindowCreated:`, error);
        }
      }
    }
  }

  /**
   * Call onRendererLoaded hook for all enabled plugins
   */
  public async callOnRendererLoaded(window: BrowserWindow): Promise<void> {
    const enabledPlugins = this.getEnabledPlugins();
    console.log(`[PluginLoader] callOnRendererLoaded: Found ${enabledPlugins.length} enabled plugins`);

    // Inject shared utilities first
    const { SharedRendererUtils } = await import('./utils/SharedRendererUtils');
    await window.webContents.executeJavaScript(SharedRendererUtils);

    for (const plugin of enabledPlugins) {
      // Check if the method exists (including inherited methods)
      const hasHook = typeof plugin.onRendererLoaded === 'function';
      const proto = Object.getPrototypeOf(plugin);
      const methods = proto ? Object.getOwnPropertyNames(proto).join(', ') : 'none';
      console.log(`[PluginLoader] Plugin ${plugin.metadata.name}: hasHook=${hasHook}, type=${typeof plugin.onRendererLoaded}, methods=${methods}`);

      if (hasHook && plugin.onRendererLoaded) {
        try {
          console.log(`[PluginLoader] Calling onRendererLoaded for: ${plugin.metadata.name}`);
          await plugin.onRendererLoaded(window);
        } catch (error) {
          console.error(`[PluginLoader] Error in ${plugin.metadata.name}.onRendererLoaded:`, error);
        }
      } else {
        console.log(`[PluginLoader] Plugin ${plugin.metadata.name} has no onRendererLoaded hook`);
      }
    }
  }

  /**
   * Enable a plugin
   */
  public enablePlugin(name: string): void {
    const plugin = this.plugins.get(name);
    if (plugin) {
      plugin.enable();
    }
  }

  /**
   * Disable a plugin
   */
  public disablePlugin(name: string): void {
    const plugin = this.plugins.get(name);
    if (plugin) {
      plugin.disable();
    }
  }

  /**
   * Reload all plugins
   */
  public async reloadPlugins(): Promise<void> {
    this.plugins.clear();
    await this.loadPlugins();
  }
}

