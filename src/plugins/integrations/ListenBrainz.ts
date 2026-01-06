import { BrowserWindow } from 'electron';
import { BasePlugin } from '../Plugin';
import type { PluginMetadata } from '../Plugin';

/**
 * ListenBrainz Scrobbler Plugin
 * Scrobbles YouTube Music tracks to ListenBrainz
 */
export class ListenBrainz extends BasePlugin {
  public metadata: PluginMetadata = {
    name: 'listenbrainz',
    description: 'Scrobble YouTube Music tracks to ListenBrainz',
    version: '1.0.0',
  };

  private getRendererScript(): string {
    const config = JSON.stringify(this.getConfig());
    return `
    (function() {
      'use strict';
      
      const config = ${config};
      
      // DEBUG: Always log config status
      console.log('[ListenBrainz] Config loaded:', { 
        enabled: config.enabled, 
        hasToken: !!config.token,
        tokenLength: config.token ? config.token.length : 0 
      });

      if (!config.enabled || !config.token) {
        console.warn('[ListenBrainz] Plugin disabled or token missing');
        return;
      }

      console.log('[ListenBrainz] Initializing scrobbler...');

      let currentTrack = null;
      let scrobbled = false;
      let startTime = null;
      let lastUpdateTime = 0;
      const UPDATE_INTERVAL = 30000; 

      // ListenBrainz API methods
      async function submitListen(listenType, artist, track, album, timestamp) {
        // DEBUG: Log submission attempt
        console.log(\`[ListenBrainz] Submitting \${listenType}:\`, { artist, track, album, timestamp });

        try {
          const payload = {
            listen_type: listenType,
            payload: [{
              track_metadata: {
                artist_name: artist,
                track_name: track,
                release_name: album,
                additional_info: {
                  media_player: "Better YouTube Music",
                  submission_client: "Better YouTube Music",
                  submission_client_version: "2.3.0" 
                }
              }
            }]
          };

          if (listenType === 'import' && timestamp) {
            payload.payload[0].listened_at = timestamp;
          }

          // Use IPC to request from main process (avoids CORS)
          const response = await window.electronAPI.invoke('listenbrainz-request', 'https://api.listenbrainz.org/1/submit-listens', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': 'Token ' + config.token,
              'User-Agent': 'Better YouTube Music/2.3.0 (https://github.com/Yabosen/Better-Youtube)'
            },
            body: JSON.stringify(payload)
          });

          if (response && !response.error) {
            if (listenType === 'import') {
               console.log('[ListenBrainz] ✅ Scrobbled:', track, 'by', artist);
            } else {
               console.log('[ListenBrainz] Now playing:', track, 'by', artist);
            }
            return true;
          } else {
            console.error('[ListenBrainz] Error response:', response);
            return false;
          }
        } catch (e) {
          console.error('[ListenBrainz] Request failed:', e);
          return false;
        }
      }

      // Extract track info from YouTube Music
      function getTrackInfo() {
        try {
          let track = '';
          let artist = '';
          let album = null;
          let source = 'none'; // DEBUG: Track source

          // 1. Try MediaSession API (Most reliable for metadata)
          if (navigator.mediaSession && navigator.mediaSession.metadata) {
            const meta = navigator.mediaSession.metadata;
            track = meta.title;
            artist = meta.artist;
            album = meta.album || null;
            source = 'MediaSession';
          }

          // 2. Fallback to DOM selectors if MediaSession is incomplete
          if (!track) {
             const titleElement = document.querySelector('ytmusic-player-bar .title');
             if (titleElement) {
                 track = titleElement.textContent?.trim() || '';
                 source = 'DOM-Title';
             }
          }

          if (!artist) {
            const artistElement = document.querySelector('ytmusic-player-bar .byline');
            if (artistElement) {
              const text = artistElement.textContent?.trim() || '';
              const parts = text.split('•');
              if (parts.length > 0) {
                artist = parts[0].trim();
                source = 'DOM-Byline';
              }
              
              if (!album && parts.length > 1) {
                 // heuristic for album
              }
            }
          }

          // 3. Last Resort: Document title
          if (!track || track === 'YouTube Music') {
             const docTitle = document.title;
             const separator = docTitle.lastIndexOf('-');
             if (separator > 0) {
               track = docTitle.substring(0, separator).trim();
               if (!artist) artist = docTitle.substring(separator + 1).replace('- YouTube Music', '').trim();
               source = 'DocTitle';
             } else {
               track = docTitle.replace('- YouTube Music', '').trim();
             }
          }

          if (track && artist) {
             // DEBUG: Log detected track info periodically or on change
             // We won't log every millisecond, but the caller handles that
             return { track, artist, album, source };
          }
          
          return null;
        } catch (error) {
          console.error('[ListenBrainz] Error getting track info:', error);
          return null;
        }
      }

      // Watch for track changes
      function checkTrack() {
        const trackInfo = getTrackInfo();
        const video = document.querySelector('video');
        
        if (!trackInfo || !video) {
          return;
        }

        const trackId = trackInfo.track + '|' + trackInfo.artist;
        
        // New track detected
        if (trackId !== currentTrack?.id) {
          console.log('[ListenBrainz] New track detected:', trackInfo, 'Source:', trackInfo.source);
          currentTrack = {
            id: trackId,
            ...trackInfo
          };
          
          scrobbled = false;
          startTime = Date.now();
          
          // Update now playing immediately ('playing_now' is the type)
          submitListen('playing_now', trackInfo.artist, trackInfo.track, trackInfo.album);
        }

        // Scrobble after 50% or 4 minutes
        if (!scrobbled && video.currentTime > 0 && startTime) {
          const duration = video.duration || 0;
          const scrobbleThreshold = Math.max(duration * 0.5, 240); // 50% or 4 minutes
          
          if (video.currentTime >= scrobbleThreshold) {
            console.log('[ListenBrainz] Scrobble threshold reached', { currentTime: video.currentTime, threshold: scrobbleThreshold });
            const timestamp = Math.floor(startTime / 1000);
            submitListen(
              'import',
              currentTrack.artist,
              currentTrack.track,
              currentTrack.album,
              timestamp
            );
            scrobbled = true;
          }
        }
      }

      // Watch for changes with MutationObserver
      function setupWatcher() {
        console.log('[ListenBrainz] Setting up watcher...');
        if (!document.body) {
          setTimeout(setupWatcher, 500);
          return;
        }

        try {
          const playerBar = document.querySelector('ytmusic-player-bar');
          
          const observer = new MutationObserver(() => {
            checkTrack();
          });

          if (playerBar) {
            console.log('[ListenBrainz] Watching player bar...');
            observer.observe(playerBar, {
              childList: true,
              subtree: true,
              characterData: true
            });
          } else {
             console.warn('[ListenBrainz] Player bar not found yet');
          }

          const video = document.querySelector('video');
          if (video) {
            console.log('[ListenBrainz] Watching video element...');
            video.addEventListener('timeupdate', checkTrack); 
          } else {
             console.warn('[ListenBrainz] Video element not found yet');
          }
           
           // Periodic check as fallback
           setInterval(checkTrack, 5000);
        } catch (error) {
          console.error('[ListenBrainz] Observer error:', error);
        }
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          setTimeout(setupWatcher, 1000);
        });
      } else {
        setTimeout(setupWatcher, 1000);
      }

    }) ();
    `;
  }

  public async onRendererLoaded(window: BrowserWindow): Promise<void> {
    if (!this.isEnabled()) return;

    const config = this.getConfig();
    if (!config.token) {
      console.warn('[ListenBrainz] Token not configured');
      return;
    }

    await this.injectRendererScript(window, this.getRendererScript());
  }

  public getConfig() {
    return {
      token: '',
      ...super.getConfig(),
    };
  }
}
