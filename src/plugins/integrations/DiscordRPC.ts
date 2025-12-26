import { BrowserWindow, ipcMain, app } from 'electron';
import { BasePlugin } from '../Plugin';
import type { PluginMetadata } from '../Plugin';
import { DiscordService, type DiscordPluginConfig } from './discord/discord-service';
import { StatusDisplayType } from 'discord-api-types/v10';
import type { VideoInfo } from './discord/utils';

/**
 * Discord Rich Presence Plugin
 * Shows "Watching [Video]" on Discord using the improved DiscordService
 */
export class DiscordRPCPlugin extends BasePlugin {
  public metadata: PluginMetadata = {
    name: 'discord-rpc',
    description: 'Show what you\'re watching on Discord',
    version: '1.0.0',
  };

  private discordService: DiscordService | null = null;
  private mainWindow: BrowserWindow | null = null;

  public async onAppReady(): Promise<void> {
    console.log('[DiscordRPC] onAppReady called, enabled:', this.isEnabled());

    // Register IPC handler for video updates from renderer (only once)
    if (!ipcMain.listenerCount('discord-rpc-update-video')) {
      console.log('[DiscordRPC] Registering IPC handlers');

      const pluginInstance = this;

      ipcMain.handle('discord-rpc-update-video', (_event, videoData: any) => {
        if (pluginInstance.isEnabled() && pluginInstance.discordService) {
          // Convert video data to VideoInfo format
          const videoInfo: VideoInfo = {
            id: videoData.id,
            videoId: videoData.id,
            title: videoData.title,
            channel: videoData.channel,
            startTime: videoData.startTime || Date.now(),
            url: videoData.url || `https://www.youtube.com/watch?v=${videoData.id}`,
            imageSrc: videoData.imageSrc || `https://img.youtube.com/vi/${videoData.id}/maxresdefault.jpg`,
            isPaused: videoData.isPaused || false,
            elapsedSeconds: videoData.elapsedSeconds,
            songDuration: videoData.songDuration,
          };
          pluginInstance.discordService.updateActivity(videoInfo);
        }
        return true;
      });

      ipcMain.handle('discord-rpc-clear', () => {
        if (pluginInstance.isEnabled() && pluginInstance.discordService) {
          pluginInstance.discordService.clearActivity();
        }
      });
    }

    // Initialize if enabled
    if (this.isEnabled()) {
      console.log('[DiscordRPC] Plugin is enabled, will initialize when window is ready');
    }
  }

  public async onWindowCreated(window: BrowserWindow): Promise<void> {
    this.mainWindow = window;

    if (this.isEnabled()) {
      await this.initializeService();
    }
  }

  private async initializeService(): Promise<void> {
    if (!this.mainWindow) {
      console.warn('[DiscordRPC] Cannot initialize: no main window');
      return;
    }

    const config = this.getConfig();
    const discordConfig: DiscordPluginConfig = {
      enabled: config.enabled ?? true,
      autoReconnect: config.autoReconnect ?? true,
      activityTimeoutEnabled: config.activityTimeoutEnabled ?? true,
      activityTimeoutTime: config.activityTimeoutTime ?? 10 * 60 * 1000, // 10 minutes
      playOnYouTube: config.playOnYouTube ?? true,
      hideGitHubButton: config.hideGitHubButton ?? false,
      hideDurationLeft: config.hideDurationLeft ?? false,
      statusDisplayType: config.statusDisplayType ?? StatusDisplayType.Details,
    };

    this.discordService = new DiscordService(this.mainWindow, discordConfig);

    if (discordConfig.enabled) {
      this.mainWindow.once('ready-to-show', () => {
        this.discordService?.connect(!discordConfig.autoReconnect);
      });
    }

    // Cleanup on app quit
    app.on('before-quit', () => {
      this.discordService?.cleanup();
    });
  }

  public async onRendererLoaded(window: BrowserWindow): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    const script = this.getRendererScript();
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const url = window.webContents.getURL();
      if (!url.includes('youtube.com')) {
        return;
      }

      await window.webContents.executeJavaScript(script, true);
      console.log('[DiscordRPC] ✅ Renderer script injected successfully');
    } catch (error) {
      console.error('[DiscordRPC] Error injecting renderer script:', error);
    }
  }

  private getRendererScript(): string {
    const configJson = JSON.stringify(this.getConfig()).replace(/`/g, '\\`').replace(/\$/g, '\\$');

    return `
    (function() {
      if (window.__discordRPCInjected) {
        return;
      }
      window.__discordRPCInjected = true;

      const config = ${configJson};
      if (!config.enabled) {
        return;
      }

      let currentVideoId = null;
      let startTime = null;
      let updateTimeout = null;

      function getVideoId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('v');
      }

      function getVideoInfo() {
        const videoId = getVideoId();
        if (!videoId) return null;
        
        const currentUrl = window.location.href;
        if (!currentUrl.includes('/watch') && !currentUrl.includes('/shorts/')) {
          return null;
        }

        const video = document.querySelector('video');
        const isPaused = video ? video.paused : false;
        const elapsedSeconds = video ? video.currentTime : 0;
        const songDuration = video ? video.duration : 0;

        // Get title
        let title = '';
        const titleSelectors = [
          'h1.ytd-watch-metadata yt-formatted-string',
          'h1.ytd-video-primary-info-renderer yt-formatted-string',
          'h1.title.style-scope.ytd-video-primary-info-renderer',
          'h1.ytd-watch-metadata',
          'h1.ytd-video-primary-info-renderer',
        ];
        
        for (const selector of titleSelectors) {
          const element = document.querySelector(selector);
          if (element) {
            title = (element.textContent && element.textContent.trim()) || (element.innerText && element.innerText.trim()) || '';
            if (title && title !== 'YouTube') break;
          }
        }
        
        if (!title || title === 'YouTube') {
          title = document.title.replace(' - YouTube', '').trim();
        }

        // Get channel
        let channel = 'Unknown Channel';
        const channelSelectors = [
          'ytd-channel-name #text a',
          'ytd-video-owner-renderer .ytd-channel-name a',
          '#channel-name a',
        ];
        
        for (const selector of channelSelectors) {
          const element = document.querySelector(selector);
          if (element) {
            channel = (element.textContent && element.textContent.trim()) || (element.innerText && element.innerText.trim()) || 'Unknown Channel';
            if (channel) break;
          }
        }

        let thumbnailUrl = 'https://img.youtube.com/vi/' + videoId + '/maxresdefault.jpg';

        return { 
          id: videoId, 
          title, 
          channel, 
          thumbnailUrl,
          isPaused,
          elapsedSeconds,
          songDuration
        };
      }

      function updateDiscordRPC(force = false) {
        if (updateTimeout) {
          clearTimeout(updateTimeout);
        }

        const videoInfo = getVideoInfo();
        
        if (!videoInfo || !videoInfo.id) {
          if (currentVideoId) {
            currentVideoId = null;
            startTime = null;
            if (window.electronAPI && window.electronAPI.invoke) {
              window.electronAPI.invoke('discord-rpc-clear').catch(function() {});
            }
          }
          return;
        }
        
        const videoChanged = videoInfo.id !== currentVideoId;
        if (videoChanged) {
          currentVideoId = videoInfo.id;
          startTime = Date.now();
        }

        if (!videoInfo.title || videoInfo.title.trim() === '' || videoInfo.title === 'YouTube') {
          videoInfo.title = 'YouTube Video';
          // Retry title extraction later
          updateTimeout = setTimeout(() => updateDiscordRPC(), 500);
        }

        if (window.electronAPI && window.electronAPI.invoke) {
          window.electronAPI.invoke('discord-rpc-update-video', {
            id: videoInfo.id,
            title: videoInfo.title,
            channel: videoInfo.channel,
            startTime: startTime || Date.now(),
            url: 'https://www.youtube.com/watch?v=' + videoInfo.id,
            imageSrc: videoInfo.thumbnailUrl || '',
            isPaused: videoInfo.isPaused,
            elapsedSeconds: videoInfo.elapsedSeconds,
            songDuration: videoInfo.songDuration
          }).catch(function(err) {
            console.error('[DiscordRPC] Failed to send update:', err);
          });
        }
      }

      function setupVideoEvents(video) {
        if (!video || video.__rpcEventsBound) return;
        video.__rpcEventsBound = true;

        const events = ['play', 'pause', 'seeked'];
        events.forEach(evt => {
          video.addEventListener(evt, () => updateDiscordRPC(true));
        });
      }

      function watchVideo() {
        updateDiscordRPC();

        // Use the shared utility if available
        if (window.BetterYouTubeUtils) {
          window.BetterYouTubeUtils.onNavigation(() => {
            currentVideoId = null;
            startTime = null;
            setTimeout(() => updateDiscordRPC(), 500);
          });
          window.BetterYouTubeUtils.onVideoFound((video) => {
            setupVideoEvents(video);
            updateDiscordRPC();
          });
        }

        // Heartbeat to keep time synced
        setInterval(() => {
          const video = document.querySelector('video');
          if (video && !video.paused) {
            updateDiscordRPC();
          }
        }, 500);

        // Fallback for video events
        const video = document.querySelector('video');
        if (video) setupVideoEvents(video);
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          setTimeout(watchVideo, 500);
        });
      } else {
        setTimeout(watchVideo, 500);
      }
    })();
    `;
  }

  public async onConfigChanged(): Promise<void> {
    if (this.discordService && this.mainWindow) {
      const config = this.getConfig();
      const discordConfig: DiscordPluginConfig = {
        enabled: config.enabled ?? true,
        autoReconnect: config.autoReconnect ?? true,
        activityTimeoutEnabled: config.activityTimeoutEnabled ?? true,
        activityTimeoutTime: config.activityTimeoutTime ?? 10 * 60 * 1000,
        playOnYouTube: config.playOnYouTube ?? true,
        hideGitHubButton: config.hideGitHubButton ?? false,
        hideDurationLeft: config.hideDurationLeft ?? false,
        statusDisplayType: config.statusDisplayType ?? StatusDisplayType.Details,
      };

      this.discordService.onConfigChange(discordConfig);

      const currentlyConnected = this.discordService.isConnected();
      if (discordConfig.enabled && !currentlyConnected) {
        this.discordService.connect(!discordConfig.autoReconnect);
      } else if (!discordConfig.enabled && currentlyConnected) {
        this.discordService.disconnect();
      }
    } else if (this.isEnabled() && this.mainWindow) {
      await this.initializeService();
    } else if (!this.isEnabled() && this.discordService) {
      this.discordService.cleanup();
      this.discordService = null;
    }
  }

  public async onDisabled(): Promise<void> {
    if (this.discordService) {
      this.discordService.cleanup();
      this.discordService = null;
    }
  }
}
