import { Session } from 'electron';
import { ElectronBlocker } from '@cliqz/adblocker-electron';
import fetch from 'cross-fetch';
import { BasePlugin } from '../Plugin';
import type { PluginMetadata } from '../Plugin';

/**
 * AdBlocker Plugin
 * Blocks ads at the network level using @cliqz/adblocker-electron
 * This is a core plugin that should be loaded early in the app lifecycle
 */
export class AdBlocker extends BasePlugin {
  public metadata: PluginMetadata = {
    name: 'adblocker',
    description: 'Blocks ads and trackers using filter lists',
    version: '1.0.0',
  };

  private blocker: ElectronBlocker | null = null;
  private session: Session | null = null;

  /**
   * Initialize the adblocker
   */
  public async onAppReady(): Promise<void> {
    if (!this.isEnabled()) {
      console.log('AdBlocker: Disabled');
      return;
    }

    // Session should be set by PluginLoader
    if (!this.session) {
      console.warn('AdBlocker: No session provided');
      return;
    }

    try {
      console.log('AdBlocker: Initializing...');
      
      // Initialize blocker with prebuilt filter lists
      // These are the same filter lists used by uBlock Origin
      this.blocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch);
      
      // Enable blocking in the session
      this.blocker.enableBlockingInSession(this.session);
      
      console.log('AdBlocker: Initialized successfully');
    } catch (error) {
      console.error('AdBlocker: Error initializing:', error);
      // Don't throw - allow app to continue without adblocker
    }
  }

  /**
   * Set the session for the adblocker
   * Called by PluginLoader
   */
  public setSession(session: Session): void {
    this.session = session;
  }

  /**
   * Get the blocker instance (for advanced usage)
   */
  public getBlocker(): ElectronBlocker | null {
    return this.blocker;
  }

  /**
   * Called when plugin is disabled
   */
  public async onDisabled(): Promise<void> {
    // Note: Once enabled, the blocker can't be easily disabled
    // The session would need to be recreated
    console.log('AdBlocker: Disabled (requires app restart to take effect)');
  }

  /**
   * Called when plugin is enabled
   */
  public async onEnabled(): Promise<void> {
    if (this.session && !this.blocker) {
      // Try to initialize if not already done
      await this.onAppReady();
    }
  }
}

