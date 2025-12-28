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

    // IPC handlers are now managed in main/index.ts to support multiple plugins (Companion Server)

    // Initialize if enabled
    if (this.isEnabled()) {
      console.log('[DiscordRPC] Plugin is enabled, will initialize when window is ready');
    }
  }

  public updateState(videoData: any) {
    if (this.isEnabled() && this.discordService) {
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
      this.discordService.updateActivity(videoInfo);
    }
  }

  public clearState() {
    if (this.isEnabled() && this.discordService) {
      this.discordService.clearActivity();
    }
  }

  // Initialize if enabled


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
        // Allow if we have a video element, even if ID is tricky (YTM sometimes hides it in cleaner URLs but MediaSession knows)
        const video = document.querySelector('video');
        if (!video) return null;
        
        const isPaused = video.paused;
        const elapsedSeconds = video.currentTime;
        const songDuration = video.duration;

        let title = '';
        let channel = '';
        let thumbnailUrl = '';
        let finalVideoId = videoId;

        // 1. Try MediaSession (Best for YTM)
        if (navigator.mediaSession && navigator.mediaSession.metadata) {
          const meta = navigator.mediaSession.metadata;
          title = meta.title || '';
          channel = meta.artist || meta.album || ''; // Artist is usually improved
          
          if (meta.artwork && meta.artwork.length > 0) {
            // Get the largest artwork
             const artwork = meta.artwork.reduce((prev, current) => {
              return (prev.sizes && current.sizes) 
                ? (parseInt(prev.sizes.split('x')[0]) > parseInt(current.sizes.split('x')[0]) ? prev : current)
                : current;
            });
            thumbnailUrl = artwork.src;
          }
        }

        // 2. Fallback to YTM DOM selectors if MediaSession failed or is incomplete
        if (!title) {
           const titleElement = document.querySelector('ytmusic-player-bar .title');
           if (titleElement) title = titleElement.textContent?.trim() || '';
        }

        if (!channel) {
          const artistElement = document.querySelector('ytmusic-player-bar .byline');
          if (artistElement) channel = artistElement.textContent?.trim() || '';
        }

        // 3. Last Result: Regular YouTube selectors (existing logic preserved as deep fallback)
        if (!title) {
            const titleSelectors = [
              'h1.ytd-watch-metadata yt-formatted-string',
              'h1.ytd-video-primary-info-renderer yt-formatted-string',
            ];
            for (const selector of titleSelectors) {
              const el = document.querySelector(selector);
              if (el) { title = el.textContent?.trim() || ''; break; }
            }
        }

        if (!title || title === 'YouTube') {
          title = document.title.replace(' - YouTube', '').replace(' - YouTube Music', '').trim();
        }
        
        if (!channel || channel === 'Unknown Channel') {
           // Fallback channel selectors
           const channelSelectors = ['ytd-channel-name #text a', '#channel-name a'];
           for (const selector of channelSelectors) {
              const el = document.querySelector(selector);
              if (el) { channel = el.textContent?.trim() || ''; break; }
           }
        }
        
        if (!channel) channel = 'Unknown Artist';

        if (!thumbnailUrl && finalVideoId) {
          thumbnailUrl = 'https://img.youtube.com/vi/' + finalVideoId + '/maxresdefault.jpg';
        }

        return { 
          id: finalVideoId || title, // Use title as ID if no video ID found (just for uniqueness checks)
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
