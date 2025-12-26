import { BrowserWindow } from 'electron';
import { BasePlugin } from '../Plugin';
import type { PluginMetadata } from '../Plugin';

/**
 * Last.fm Scrobbler Plugin
 * Scrobbles YouTube Music tracks to Last.fm
 */
export class LastFM extends BasePlugin {
  public metadata: PluginMetadata = {
    name: 'lastfm',
    description: 'Scrobble YouTube Music tracks to Last.fm',
    version: '2.0.0',
  };

  private getRendererScript(): string {
    const config = JSON.stringify(this.getConfig());
    return `
    (function() {
      'use strict';
      
      const config = ${config};
      if (!config.enabled || !config.apiKey || !config.sessionKey) {
        console.log('[LastFM] Plugin disabled or not authenticated');
        return;
      }

      console.log('[LastFM] Initializing YouTube Music scrobbler...');

      let currentTrack = null;
      let scrobbled = false;
      let startTime = null;
      let lastUpdateTime = 0;
      const UPDATE_INTERVAL = 30000; // Update now playing every 30 seconds

      // Get signature from main process (MD5 not available in Web Crypto API)
      async function getSignature(params, secret) {
        try {
          if (window.electronAPI && window.electronAPI.invoke) {
            return await window.electronAPI.invoke('lastfm-signature', params, secret);
          }
        } catch (e) {
          console.error('[LastFM] Could not generate signature:', e);
        }
        return null;
      }

      // Last.fm API methods
      async function scrobble(artist, track, album, timestamp) {
        try {
          const params = {
            method: 'track.scrobble',
            api_key: config.apiKey,
            sk: config.sessionKey,
            artist: artist,
            track: track,
            timestamp: timestamp.toString(),
            format: 'json'
          };
          
          if (album) {
            params.album = album;
          }

          const sig = await getSignature(params, config.apiSecret);
          if (!sig) {
            console.error('[LastFM] Could not generate signature');
            return false;
          }
          params.api_sig = sig;

          const response = await fetch('https://ws.audioscrobbler.com/2.0/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(params)
          });
          
          const data = await response.json();
          if (data.error) {
            console.error('[LastFM] Scrobble error:', data.message);
            return false;
          } else {
            console.log('[LastFM] ✅ Scrobbled:', track, 'by', artist);
            return true;
          }
        } catch (error) {
          console.error('[LastFM] Error scrobbling:', error);
          return false;
        }
      }

      async function updateNowPlaying(artist, track, album) {
        // Throttle updates to avoid rate limiting
        const now = Date.now();
        if (now - lastUpdateTime < UPDATE_INTERVAL) {
          return;
        }
        lastUpdateTime = now;

        try {
          const params = {
            method: 'track.updateNowPlaying',
            api_key: config.apiKey,
            sk: config.sessionKey,
            artist: artist,
            track: track,
            format: 'json'
          };
          
          if (album) {
            params.album = album;
          }

          const sig = await getSignature(params, config.apiSecret);
          if (!sig) {
            console.error('[LastFM] Could not generate signature');
            return false;
          }
          params.api_sig = sig;

          const response = await fetch('https://ws.audioscrobbler.com/2.0/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(params)
          });
          
          const data = await response.json();
          if (data.error) {
            console.error('[LastFM] Now playing error:', data.message);
          } else {
            console.log('[LastFM] Now playing:', track, 'by', artist);
          }
        } catch (error) {
          console.error('[LastFM] Error updating now playing:', error);
        }
      }

      // Extract track info from YouTube Music
      function getTrackInfo() {
        try {
          // YouTube Music player bar selectors
          const titleElement = document.querySelector(
            'ytmusic-player-bar .title, ' +
            'ytmusic-player-bar #title, ' +
            'ytmusic-player-bar yt-formatted-string.title'
          );
          
          const artistElement = document.querySelector(
            'ytmusic-player-bar .byline, ' +
            'ytmusic-player-bar #byline, ' +
            'ytmusic-player-bar yt-formatted-string.byline, ' +
            'ytmusic-player-bar a.yt-simple-endpoint.style-scope.yt-formatted-string'
          );

          // Alternative: Try to get from player page
          if (!titleElement || !artistElement) {
            const playerPage = document.querySelector('ytmusic-player-page');
            if (playerPage) {
              const pageTitle = playerPage.querySelector(
                'h1.ytmusic-player-title, ' +
                '.title, ' +
                'yt-formatted-string.title'
              );
              const pageArtist = playerPage.querySelector(
                '.byline, ' +
                'yt-formatted-string.byline, ' +
                'a.yt-simple-endpoint'
              );
              
              if (pageTitle && pageArtist) {
                return {
                  track: pageTitle.textContent?.trim() || '',
                  artist: pageArtist.textContent?.trim() || '',
                  album: null
                };
              }
            }
          }

          if (titleElement && artistElement) {
            const track = titleElement.textContent?.trim() || '';
            const artist = artistElement.textContent?.trim() || '';
            
            // Try to get album info
            const albumElement = document.querySelector(
              'ytmusic-player-bar .album, ' +
              'ytmusic-player-page .album'
            );
            const album = albumElement?.textContent?.trim() || null;

            return { track, artist, album };
          }

          return null;
        } catch (error) {
          console.error('[LastFM] Error getting track info:', error);
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
          console.log('[LastFM] New track detected:', trackInfo);
          currentTrack = {
            id: trackId,
            ...trackInfo
          };
          scrobbled = false;
          startTime = Date.now();
          
          // Update now playing immediately
          updateNowPlaying(trackInfo.artist, trackInfo.track, trackInfo.album);
        }

        // Scrobble after 50% or 4 minutes (Last.fm requirement)
        if (!scrobbled && video.currentTime > 0 && startTime) {
          const duration = video.duration || 0;
          const scrobbleThreshold = Math.max(duration * 0.5, 240); // 50% or 4 minutes
          
          if (video.currentTime >= scrobbleThreshold) {
            const timestamp = Math.floor(startTime / 1000);
            scrobble(
              currentTrack.artist,
              currentTrack.track,
              currentTrack.album,
              timestamp
            );
            scrobbled = true;
          }
        }

        // Update now playing periodically (but throttled)
        if (currentTrack && video && !video.paused) {
          updateNowPlaying(
            currentTrack.artist,
            currentTrack.track,
            currentTrack.album
          );
        }
      }

      // Watch for changes with MutationObserver
      function setupWatcher() {
        if (!document.body) {
          setTimeout(setupWatcher, 500);
          return;
        }

        try {
          // Watch player bar and player page
          const playerBar = document.querySelector('ytmusic-player-bar');
          const playerPage = document.querySelector('ytmusic-player-page');
          
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

          if (playerPage) {
            observer.observe(playerPage, {
              childList: true,
              subtree: true,
              characterData: true
            });
          }

          // Also watch video element for time updates
          const video = document.querySelector('video');
          if (video) {
            video.addEventListener('timeupdate', checkTrack);
            video.addEventListener('play', checkTrack);
            video.addEventListener('pause', () => {
              // Update now playing when paused
              if (currentTrack) {
                updateNowPlaying(
                  currentTrack.artist,
                  currentTrack.track,
                  currentTrack.album
                );
              }
            });
          }

          // Periodic check as fallback
          setInterval(checkTrack, 5000);
          
          // Initial check
          setTimeout(checkTrack, 1000);
        } catch (error) {
          console.error('[LastFM] Observer error:', error);
        }
      }

      // Watch for navigation (YouTube Music is SPA)
      let lastUrl = location.href;
      setInterval(() => {
        if (location.href !== lastUrl) {
          lastUrl = location.href;
          console.log('[LastFM] Navigation detected, resetting...');
          currentTrack = null;
          scrobbled = false;
          startTime = null;
          setTimeout(checkTrack, 1000);
        }
      }, 1000);

      // Initialize
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          setTimeout(setupWatcher, 500);
        });
      } else {
        setTimeout(setupWatcher, 500);
      }
    })();
    `;
  }

  public async onRendererLoaded(window: BrowserWindow): Promise<void> {
    if (!this.isEnabled()) return;

    const config = this.getConfig();
    if (!config.apiKey || !config.sessionKey) {
      console.warn('[LastFM] API key or session key not configured');
      return;
    }

    await this.injectRendererScript(window, this.getRendererScript());
  }

  public getConfig() {
    return {
      apiKey: '',
      apiSecret: '',
      sessionKey: '', // Obtained through OAuth
      ...super.getConfig(),
    };
  }
}

