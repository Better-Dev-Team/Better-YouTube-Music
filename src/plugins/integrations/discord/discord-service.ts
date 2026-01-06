import { Client as DiscordClient } from '@xhayper/discord-rpc';
import { ActivityType, StatusDisplayType } from 'discord-api-types/v10';
import { clientId, PROGRESS_THROTTLE_MS, TimerKey } from './constants';
import { TimerManager } from './timer-manager';
import {
  buildDiscordButtons,
  padHangulFields,
  truncateString,
  isSeek,
  type VideoInfo,
} from './utils';

export interface DiscordPluginConfig {
  enabled: boolean;
  autoReconnect?: boolean;
  activityTimeoutEnabled?: boolean;
  activityTimeoutTime?: number;
  playOnYouTube?: boolean;
  hideGitHubButton?: boolean;
  hideDurationLeft?: boolean;
  statusDisplayType?: StatusDisplayType;
}

/**
 * Discord Rich Presence Service
 * Manages connection to Discord and updates Rich Presence based on video information
 */
export class DiscordService {
  /**
   * Discord RPC client instance.
   */
  rpc = new DiscordClient({ clientId });
  /**
   * Indicates if the service is ready to send activity updates.
   */
  ready = false;
  /**
   * Indicates if the service should attempt to reconnect automatically.
   */
  autoReconnect = true;
  /**
   * Cached video information from the last activity update.
   */
  lastVideoInfo?: VideoInfo;
  /**
   * Timestamp of the last progress update sent to Discord.
   */
  lastProgressUpdate = 0;
  /**
   * Plugin configuration.
   */
  config?: DiscordPluginConfig;
  refreshCallbacks: (() => void)[] = [];
  timerManager = new TimerManager();

  mainWindow: Electron.BrowserWindow;

  /**
   * Initializes the Discord service with configuration and main window reference.
   * Sets up RPC event listeners.
   * @param mainWindow - Electron BrowserWindow instance.
   * @param config - Plugin configuration.
   */
  constructor(
    mainWindow: Electron.BrowserWindow,
    config?: DiscordPluginConfig,
  ) {
    this.config = config;
    this.mainWindow = mainWindow;
    this.autoReconnect = config?.autoReconnect ?? true;

    this.rpc.on('connected', () => {
      console.log('[DiscordRPC] Connected to Discord');
      this.refreshCallbacks.forEach((cb) => cb());
    });

    this.rpc.on('ready', () => {
      this.ready = true;
      console.log('[DiscordRPC] Ready to send activity updates');
      if (this.lastVideoInfo && this.config) {
        this.updateActivity(this.lastVideoInfo);
      }
    });

    this.rpc.on('disconnected', () => {
      console.log('[DiscordRPC] Disconnected from Discord');
      this.resetInfo();
      if (this.autoReconnect) {
        this.connectRecursive();
      }
    });
  }

  /**
   * Builds the SetActivity payload for Discord Rich Presence.
   * @param videoInfo - Current video information.
   * @param config - Plugin configuration.
   * @returns The SetActivity object.
   */
  private buildActivityInfo(
    videoInfo: VideoInfo,
    config: DiscordPluginConfig,
  ): any {
    padHangulFields(videoInfo);

    // Use the video thumbnail if available, otherwise fallback to default
    // Note: Discord requires images to be uploaded to their CDN, but we'll try using
    // the YouTube thumbnail URL pattern. If it doesn't work, it will fallback to 'youtube'
    let imageKey = 'youtube';
    if (videoInfo.imageSrc) {
      // Try to use the YouTube thumbnail URL
      // Discord might not support external URLs, but we'll try
      // The URL format is: https://img.youtube.com/vi/{VIDEO_ID}/maxresdefault.jpg
      imageKey = videoInfo.imageSrc;
    } else if (videoInfo.id || videoInfo.videoId) {
      // Construct YouTube thumbnail URL from video ID
      const videoId = videoInfo.videoId || videoInfo.id;
      imageKey = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }

    const activityInfo: any = {
      type: ActivityType.Listening,
      details: truncateString(videoInfo.title || 'YouTube Video', 128),
      state: truncateString(videoInfo.channel || 'Unknown Channel', 128),
      largeImageKey: imageKey,
      largeImageText: truncateString(videoInfo.title || 'YouTube Video', 128),
      buttons: buildDiscordButtons(config, videoInfo),
    };

    // Add statusDisplayType if available
    if (config.statusDisplayType) {
      activityInfo.statusDisplayType = config.statusDisplayType;
    }

    // Handle paused state display
    if (videoInfo.isPaused) {
      activityInfo.largeImageText = '⏸︎ Paused';
    } else if (
      !config.hideDurationLeft &&
      videoInfo.songDuration &&
      videoInfo.songDuration > 0 &&
      typeof videoInfo.elapsedSeconds === 'number'
    ) {
      const videoStartTime = Date.now() - (videoInfo.elapsedSeconds * 1000);
      activityInfo.startTimestamp = Math.floor(videoStartTime / 1000);
      activityInfo.endTimestamp = Math.floor(
        (videoStartTime + videoInfo.songDuration * 1000) / 1000,
      );
    } else if (videoInfo.startTime) {
      // Use the start time from video info
      activityInfo.startTimestamp = Math.floor(videoInfo.startTime / 1000);
    }

    return activityInfo;
  }

  /**
   * Sets a timer to clear Discord activity if the video is paused for too long,
   * based on the plugin configuration.
   */
  private setActivityTimeout() {
    this.timerManager.clear(TimerKey.ClearActivity);

    if (
      this.lastVideoInfo?.isPaused === true &&
      this.config?.activityTimeoutEnabled &&
      this.config?.activityTimeoutTime &&
      this.config.activityTimeoutTime > 0
    ) {
      this.timerManager.set(
        TimerKey.ClearActivity,
        () => {
          this.clearActivity();
        },
        this.config.activityTimeoutTime,
      );
    }
  }

  /**
   * Resets the internal state (except config and mainWindow), clears timers.
   */
  private resetInfo() {
    this.ready = false;
    this.lastVideoInfo = undefined;
    this.lastProgressUpdate = 0;
    this.timerManager.clearAll();
  }

  /**
   * Attempts to connect to Discord RPC after a delay, used for retries.
   * @returns Promise that resolves on successful login or rejects on failure/cancellation.
   */
  private connectWithRetry(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.timerManager.set(
        TimerKey.DiscordConnectRetry,
        () => {
          if (!this.autoReconnect || this.rpc.isConnected) {
            this.timerManager.clear(TimerKey.DiscordConnectRetry);
            if (this.rpc.isConnected) resolve();
            else reject(new Error('Auto-reconnect disabled or already connected.'));
            return;
          }

          this.rpc
            .login()
            .then(() => {
              this.timerManager.clear(TimerKey.DiscordConnectRetry);
              resolve();
            })
            .catch(() => {
              this.connectRecursive();
            });
        },
        5000,
      );
    });
  }

  /**
   * Recursively attempts to connect to Discord RPC if auto-reconnect is enabled and not connected.
   */
  private connectRecursive = () => {
    if (!this.autoReconnect || this.rpc.isConnected) {
      this.timerManager.clear(TimerKey.DiscordConnectRetry);
      return;
    }
    this.connectWithRetry();
  };

  /**
   * Connects to Discord RPC.
   * @param showErrorDialog - Whether to show an error dialog on initial connection failure.
   */
  connect(showErrorDialog = false): void {
    if (this.rpc.isConnected) {
      console.log('[DiscordRPC] Already connected');
      return;
    }
    if (!this.config) {
      return;
    }

    this.ready = false;
    this.timerManager.clear(TimerKey.DiscordConnectRetry);

    console.log('[DiscordRPC] Attempting to connect to Discord...');
    this.rpc.login().catch((error) => {
      console.error('[DiscordRPC] Connection failed:', error);
      this.resetInfo();

      if (this.autoReconnect) {
        this.connectRecursive();
      }
    });
  }

  /**
   * Disconnects from Discord RPC, prevents auto-reconnection, and clears timers.
   */
  disconnect(): void {
    this.autoReconnect = false;
    this.timerManager.clear(TimerKey.DiscordConnectRetry);
    this.timerManager.clear(TimerKey.ClearActivity);
    if (this.rpc.isConnected) {
      try {
        this.rpc.destroy();
      } catch {
        // ignored
      }
    }
    this.resetInfo();
  }

  /**
   * Updates the Discord Rich Presence based on the current video information.
   * Handles throttling logic to avoid excessive updates.
   * Detects changes in video, pause state, or seeks for immediate updates.
   * @param videoInfo - The current video information.
   */
  updateActivity(videoInfo: VideoInfo): void {
    if (!this.config) return;

    if (!videoInfo.title && !videoInfo.channel) {
      if (this.lastVideoInfo?.id || this.lastVideoInfo?.videoId) {
        this.clearActivity();
        this.lastVideoInfo = undefined;
      }
      return;
    }

    this.timerManager.clear(TimerKey.ClearActivity);

    if (!this.rpc || !this.ready) {
      // Store video info for when ready
      this.lastVideoInfo = { ...videoInfo };
      return;
    }

    const now = Date.now();
    const elapsedSeconds = videoInfo.elapsedSeconds ?? 0;
    const videoId = videoInfo.videoId || videoInfo.id;

    const videoChanged = videoId !== (this.lastVideoInfo?.videoId || this.lastVideoInfo?.id);
    const pauseChanged = videoInfo.isPaused !== this.lastVideoInfo?.isPaused;
    const seeked =
      !videoChanged &&
      isSeek(this.lastVideoInfo?.elapsedSeconds ?? 0, elapsedSeconds);

    if (
      (videoChanged || pauseChanged || seeked) &&
      this.lastVideoInfo !== undefined
    ) {
      this.timerManager.clear(TimerKey.UpdateTimeout);

      const activityInfo = this.buildActivityInfo(videoInfo, this.config);
      this.rpc.user
        ?.setActivity(activityInfo)
        .catch((err) =>
          console.error('[DiscordRPC] Failed to set activity:', err),
        );

      if (this.lastVideoInfo) {
        this.lastVideoInfo.videoId = videoId;
        this.lastVideoInfo.id = videoId;
        this.lastVideoInfo.isPaused = videoInfo.isPaused ?? false;
        this.lastVideoInfo.elapsedSeconds = elapsedSeconds;
      }
      this.lastProgressUpdate = now;

      this.setActivityTimeout();
    } else if (now - this.lastProgressUpdate > PROGRESS_THROTTLE_MS) {
      this.timerManager.clear(TimerKey.UpdateTimeout);

      const activityInfo = this.buildActivityInfo(videoInfo, this.config);
      this.rpc.user
        ?.setActivity(activityInfo)
        .catch((err) =>
          console.error('[DiscordRPC] Failed to set throttled activity:', err),
        );

      this.lastProgressUpdate = now;
      this.setActivityTimeout();
    } else {
      const remainingThrottle =
        PROGRESS_THROTTLE_MS - (now - this.lastProgressUpdate);
      const videoInfoSnapshot = { ...videoInfo };

      this.timerManager.set(
        TimerKey.UpdateTimeout,
        () => {
          const currentVideoId = this.lastVideoInfo?.videoId || this.lastVideoInfo?.id;
          const snapshotVideoId = videoInfoSnapshot.videoId || videoInfoSnapshot.id;
          if (
            currentVideoId === snapshotVideoId &&
            this.lastVideoInfo?.isPaused === videoInfoSnapshot.isPaused &&
            this.config
          ) {
            const activityInfo = this.buildActivityInfo(
              videoInfoSnapshot,
              this.config,
            );
            this.rpc.user?.setActivity(activityInfo);
            this.lastProgressUpdate = Date.now();
            if (this.lastVideoInfo) {
              this.lastVideoInfo.elapsedSeconds =
                videoInfoSnapshot.elapsedSeconds ?? 0;
            }
            this.setActivityTimeout();
          }
        },
        remainingThrottle,
      );
    }
    this.lastVideoInfo = { ...videoInfo };
  }

  /**
   * Clears the Discord Rich Presence activity.
   */
  clearActivity(): void {
    if (this.rpc.isConnected && this.ready) {
      this.rpc.user?.clearActivity();
    }
    this.lastProgressUpdate = 0;
    this.lastVideoInfo = undefined;
    this.timerManager.clear(TimerKey.ClearActivity);
    this.timerManager.clear(TimerKey.UpdateTimeout);
  }

  /**
   * Updates the configuration used by the service and re-evaluates activity/timeouts.
   * @param newConfig - The new plugin configuration.
   */
  onConfigChange(newConfig: DiscordPluginConfig): void {
    this.config = newConfig;
    this.autoReconnect = newConfig.autoReconnect ?? true;

    if (this.lastVideoInfo && this.ready && this.rpc.isConnected) {
      this.updateActivity(this.lastVideoInfo);
    }

    this.setActivityTimeout();
  }

  /**
   * Registers a callback function to be called when the RPC connection status changes.
   * @param cb - The callback function.
   */
  registerRefreshCallback(cb: () => void): void {
    this.refreshCallbacks.push(cb);
  }

  /**
   * Checks if the Discord RPC client is currently connected and ready.
   * @returns True if connected and ready, false otherwise.
   */
  isConnected(): boolean {
    return this.rpc.isConnected && this.ready;
  }

  /**
   * Cleans up resources: disconnects RPC, clears all timers, and clears callbacks.
   */
  cleanup(): void {
    this.disconnect();
    this.refreshCallbacks = [];
  }
}

