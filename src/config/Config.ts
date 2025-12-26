import Store from 'electron-store';

/**
 * Configuration schema interface
 * Defines the structure of all configurable options
 */
export interface ConfigSchema {
  plugins: {
    [pluginName: string]: {
      enabled: boolean;
      [key: string]: any;
    };
  };
  adblocker: {
    enabled: boolean;
  };
  window: {
    width: number;
    height: number;
    x?: number;
    y?: number;
    maximized?: boolean;
  };
  [key: string]: any;
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: ConfigSchema = {
  plugins: {},
  adblocker: {
    enabled: false, // Disabled by default to avoid breaking YouTube
  },
  window: {
    width: 1200,
    height: 800,
  },
};

/**
 * Config Manager
 * Handles all configuration persistence and retrieval
 * Similar to youtube-desktop's config system
 */
export class Config {
  private store: Store<ConfigSchema>;
  private static instance: Config;

  private constructor() {
    this.store = new Store<ConfigSchema>({
      defaults: DEFAULT_CONFIG,
      name: 'config',
    });
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  /**
   * Get a configuration value
   */
  public get<K extends keyof ConfigSchema>(key: K): ConfigSchema[K];
  public get<K extends keyof ConfigSchema>(key: K, defaultValue: ConfigSchema[K]): ConfigSchema[K];
  public get(key: string, defaultValue?: any): any {
    return this.store.get(key, defaultValue);
  }

  /**
   * Set a configuration value
   */
  public set<K extends keyof ConfigSchema>(key: K, value: ConfigSchema[K]): void;
  public set(key: string, value: any): void {
    this.store.set(key, value);
  }

  /**
   * Get plugin configuration
   */
  public getPluginConfig(pluginName: string): any {
    const plugins = this.get('plugins', {});
    return plugins[pluginName] || { enabled: true };
  }

  /**
   * Set plugin configuration
   */
  public setPluginConfig(pluginName: string, config: any): void {
    const plugins = this.get('plugins', {});
    plugins[pluginName] = { ...plugins[pluginName], ...config };
    this.set('plugins', plugins);
  }

  /**
   * Check if a plugin is enabled
   */
  public isPluginEnabled(pluginName: string): boolean {
    const pluginConfig = this.getPluginConfig(pluginName);
    return pluginConfig.enabled !== false; // Default to enabled
  }

  /**
   * Enable/disable a plugin
   */
  public setPluginEnabled(pluginName: string, enabled: boolean): void {
    this.setPluginConfig(pluginName, { enabled });
  }

  /**
   * Get all plugin configurations
   */
  public getAllPlugins(): Record<string, any> {
    return this.get('plugins', {});
  }

  /**
   * Delete a configuration key
   */
  public delete(key: string): void {
    this.store.delete(key);
  }

  /**
   * Reset to defaults
   */
  public reset(): void {
    this.store.clear();
    Object.assign(this.store.store, DEFAULT_CONFIG);
  }

  /**
   * Get the underlying store (for advanced usage)
   */
  public getStore(): Store<ConfigSchema> {
    return this.store;
  }
}

// Export singleton instance
export const config = Config.getInstance();

