import { BrowserWindow, Session } from 'electron';
import { Config } from '../config/Config';

/**
 * Plugin lifecycle hooks
 */
export interface PluginHooks {
  /**
   * Called when the Electron app is ready
   * Use this for main process initialization
   */
  onAppReady?: () => void | Promise<void>;

  /**
   * Called when a BrowserWindow is created
   * Use this to modify window properties or set up window-specific logic
   */
  onWindowCreated?: (window: BrowserWindow) => void | Promise<void>;

  /**
   * Called when the renderer process finishes loading
   * Use this to inject scripts or CSS into the page
   */
  onRendererLoaded?: (window: BrowserWindow) => void | Promise<void>;

  /**
   * Called when the plugin is enabled
   */
  onEnabled?: () => void | Promise<void>;

  /**
   * Called when the plugin is disabled
   */
  onDisabled?: () => void | Promise<void>;
}

/**
 * Plugin metadata
 */
export interface PluginMetadata {
  name: string;
  description?: string;
  version?: string;
  author?: string;
}

/**
 * Plugin configuration schema
 * Plugins can define their own config structure
 */
export interface PluginConfig {
  enabled: boolean;
  [key: string]: any;
}

/**
 * Base Plugin interface
 * All plugins must implement this interface
 */
export interface Plugin extends PluginHooks {
  /**
   * Plugin metadata
   */
  metadata: PluginMetadata;

  /**
   * Get plugin configuration
   */
  getConfig(): PluginConfig;

  /**
   * Set plugin configuration
   */
  setConfig(config: Partial<PluginConfig>): void;

  /**
   * Check if plugin is enabled
   */
  isEnabled(): boolean;

  /**
   * Enable the plugin
   */
  enable(): void;

  /**
   * Disable the plugin
   */
  disable(): void;
}

/**
 * Abstract base class for plugins
 * Provides default implementation of common functionality
 */
export abstract class BasePlugin implements Plugin {
  public abstract metadata: PluginMetadata;
  protected config: Config;
  protected pluginName: string;

  constructor(pluginName: string) {
    this.pluginName = pluginName;
    this.config = Config.getInstance();
  }

  public getConfig(): PluginConfig {
    return this.config.getPluginConfig(this.pluginName);
  }

  public setConfig(config: Partial<PluginConfig>): void {
    this.config.setPluginConfig(this.pluginName, config);
  }

  public isEnabled(): boolean {
    return this.config.isPluginEnabled(this.pluginName);
  }

  public enable(): void {
    this.config.setPluginEnabled(this.pluginName, true);
    if (this.onEnabled) {
      this.onEnabled();
    }
  }

  public disable(): void {
    this.config.setPluginEnabled(this.pluginName, false);
    if (this.onDisabled) {
      this.onDisabled();
    }
  }

  // Lifecycle hooks (to be overridden by plugins)
  public onAppReady?(): void | Promise<void>;
  public onWindowCreated?(window: BrowserWindow): void | Promise<void>;
  public onRendererLoaded?(window: BrowserWindow): void | Promise<void>;
  public onEnabled?(): void | Promise<void>;
  public onDisabled?(): void | Promise<void>;

  /**
   * Safely inject renderer script, bypassing TrustedScript issues
   * Uses direct execution without Function constructor to avoid Trusted Types
   */
  protected async injectRendererScript(window: BrowserWindow, script: string): Promise<void> {
    if (!window || window.isDestroyed()) return;
    
    try {
      // Execute script directly - webContents.executeJavaScript bypasses Trusted Types
      // No need for Function constructor or script tags
      await window.webContents.executeJavaScript(script, true);
      console.log(`%c[Plugin Loader] Injected script for plugin: ${this.metadata.name}`, 'color: #00aaff; font-weight: bold;');
    } catch (error) {
      console.error(`%c[Plugin Loader] ERROR injecting script for plugin ${this.metadata.name}:`, 'color: #ff0000; font-weight: bold;', error);
    }
  }
}

