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
      if (!config.enabled || !config.token) {
        console.log('[ListenBrainz] Plugin disabled or token missing');
        return;
      }

      console.log('[ListenBrainz] Initializing scrobbler...');

      let currentTrack = null;
      let scrobbled = false;
      let startTime = null;
      let lastUpdateTime = 0;
      const UPDATE_INTERVAL = 30000; // Update now playing every 30 seconds

      // ListenBrainz API methods
      async function submitListen(listenType, artist, track, album, timestamp) {
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
              'Authorization': 'Token ' + config.token
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
            console.error('[ListenBrainz] Error:', response ? response.message : 'Unknown error');
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
          // 1. Try MediaSession API (Most reliable for metadata)
          if (navigator.mediaSession && navigator.mediaSession.metadata) {
            const meta = navigator.mediaSession.metadata;
            return {
              track: meta.title,
              artist: meta.artist,
              album: meta.album || null
            };
          }

          // 2. Fallback to DOM selectors
          const titleElement = document.querySelector('ytmusic-player-bar .title');
          const artistElement = document.querySelector('ytmusic-player-bar .byline');
          
          if (titleElement && artistElement) {
            const track = titleElement.textContent?.trim() || '';
            // Artist might have "Views" or time concatenated, usually handled by MediaSession better
            // Ideally we rely on MediaSession, but basic text content fallback:
            let artist = artistElement.textContent?.trim() || '';
            // Basic cleanup if needed, but keeping it simple for now
            
            const albumElement = document.querySelector('ytmusic-player-bar .album');
            const album = albumElement?.textContent?.trim() || null;

            return { track, artist, album };
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
          console.log('[ListenBrainz] New track detected:', trackInfo);
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

        // Update now playing periodically
        // ListenBrainz documentation recommends refreshing 'playing_now' occasionally if desired, 
        // but it's not strictly required like Last.fm's might be. 
        // We'll skip periodic updates for now to reduce API chatter unless needed.
      }

      // Watch for changes with MutationObserver
      function setupWatcher() {
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
            observer.observe(playerBar, {
              childList: true,
              subtree: true,
              characterData: true
            });
          }

          const video = document.querySelector('video');
          if (video) {
            video.addEventListener('timeupdate', checkTrack); // Using timeupdate is robust
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
