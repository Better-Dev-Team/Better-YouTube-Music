import { BrowserWindow } from 'electron';
import { BasePlugin } from '../Plugin';
import type { PluginMetadata } from '../Plugin';

/**
 * Better Lyrics Plugin
 * Fetches and displays synced lyrics from LRCLIB
 * Integrates directly into the YouTube Music Lyrics tab
 */
export class BetterLyrics extends BasePlugin {
    public metadata: PluginMetadata = {
        name: 'better-lyrics',
        description: 'Displays synced lyrics from LRCLIB in the native Lyrics tab',
        version: '1.1.0',
    };

    private getRendererScript(): string {
        const config = JSON.stringify(this.getConfig());
        return `
    (function() {
      'use strict';
      
      const config = ${config};
      if (!config.enabled) return;

      let lyricsContainer = null;
      let lyricsContent = null;
      let currentLyrics = [];
      let activeLineIndex = -1;
      let lastFetchedTrack = '';
      let lyricsTabObserver = null;
      let isLyricTabActive = false;
      
      // CSS Styles
    const styles = \`
        /* Hide original lyrics when we have content */
        body.better-lyrics-active .non-expandable.description.ytmusic-description-shelf-renderer,
        body.better-lyrics-active ytmusic-description-shelf-renderer {
            display: none !important;
        }

        #better-lyrics-container {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          background: transparent; 
          font-family: 'Roboto', sans-serif;
          overflow: hidden;
          padding: 0 20px;
          box-sizing: border-box;
        }
        
        #better-lyrics-content {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden; /* Prevent horizontal scroll */
          padding: 40px 10px; /* Add horizontal padding for text */
          scroll-behavior: smooth;
          mask-image: linear-gradient(to bottom, transparent, black 10%, black 90%, transparent);
          -webkit-mask-image: linear-gradient(to bottom, transparent, black 10%, black 90%, transparent);
        }
        
        #better-lyrics-content::-webkit-scrollbar {
          width: 4px;
        }
        
        #better-lyrics-content::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }

        .lyric-line {
          font-size: 24px; 
          line-height: 1.6;
          margin-bottom: 32px;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          transition: color 0.2s, transform 0.2s, filter 0.2s;
          font-weight: 700;
          transform-origin: left center;
          filter: blur(0.5px);
          padding: 5px 0; /* Touch target size */
        }

        .lyric-line:hover {
          color: rgba(255, 255, 255, 0.8);
          filter: blur(0px);
        }

        .lyric-line.active {
          color: #fff;
          /* Removed scale/translate to fix clipping issues */
          filter: blur(0px);
          text-shadow: 0 0 20px rgba(255, 255, 255, 0.2);
          transform: scale(1.0); /* Reset scale */
        }

        .lyric-line.empty {
           min-height: 2em;
        }
        
        #better-lyrics-status {
           padding: 40px;
           text-align: center;
           color: #aaa;
           font-size: 16px;
           margin-top: 20%;
        }

        .loading {
            opacity: 0.7;
        }
      \`;

      // Inject Styles
      const styleSheet = document.createElement("style");
      styleSheet.textContent = styles;
      document.head.appendChild(styleSheet);

      // Create UI
      function createUI() {
        if (document.getElementById('better-lyrics-container')) return document.getElementById('better-lyrics-container');

        // Container
        lyricsContainer = document.createElement('div');
        lyricsContainer.id = 'better-lyrics-container';
        
        lyricsContent = document.createElement('div');
        lyricsContent.id = 'better-lyrics-content';
        
        lyricsContainer.appendChild(lyricsContent);
        
        return lyricsContainer;
      }

      // Observer to find the Lyrics Tab Content
      function startLyricsObserver() {
          const appObserver = new MutationObserver((mutations) => {
              for (const mutation of mutations) {
                  if (mutation.addedNodes.length) {
                      checkForLyricsTab();
                  }
              }
          });
          
          const app = document.querySelector('ytmusic-app');
          if (app) {
              appObserver.observe(app, { childList: true, subtree: true });
          }
          
          // Initial check
          checkForLyricsTab();
      }

      function checkForLyricsTab() {
          const descriptionShelf = document.querySelector('ytmusic-description-shelf-renderer');
          
          if (descriptionShelf) {
              const parent = descriptionShelf.parentNode;
              if (parent && !parent.querySelector('#better-lyrics-container')) {
                  console.log('[BetterLyrics] Found Lyrics Tab, injecting UI...');
                  const ui = createUI();
                  parent.insertBefore(ui, descriptionShelf); 
                  document.body.classList.add('better-lyrics-active');
                  
                  // Trigger immediately if metadata exists
                  if (navigator.mediaSession.metadata) {
                      fetchLyrics(navigator.mediaSession.metadata);
                  }
                  
                  isLyricTabActive = true;
              }
          }
      }

      function parseLRC(lrc) {
          const lines = lrc.split('\\n');
          const result = [];
          const timeRegex = /\\[(\\d{2}):(\\d{2})\\.(\\d{2,3})\\]/;

          for (const line of lines) {
              const match = timeRegex.exec(line);
              if (match) {
                  const minutes = parseInt(match[1]);
                  const seconds = parseInt(match[2]);
                  const milliseconds = parseInt(match[3].padEnd(3, '0'));
                  const time = minutes * 60 + seconds + milliseconds / 1000;
                  const text = line.replace(timeRegex, '').trim();
                  result.push({ time, text });
              }
          }
          return result.sort((a, b) => a.time - b.time);
      }

      async function fetchLyrics(metadata) {
          if (!metadata) return;
          
          const { title, artist, album } = metadata;
          const trackId = \`\${title}-\${artist}\`;
          
          if (lastFetchedTrack === trackId && currentLyrics.length > 0) {
              if (lyricsContent && lyricsContent.innerHTML === '') renderLyrics();
              return; 
          }
          
          lastFetchedTrack = trackId;
          updateStatus('Loading lyrics...', 'loading');
          currentLyrics = [];
          activeLineIndex = -1;
          
          document.body.classList.add('better-lyrics-active');

          try {
              // Try exact match first
              let url = \`https://lrclib.net/api/get?artist_name=\${encodeURIComponent(artist)}&track_name=\${encodeURIComponent(title)}&album_name=\${encodeURIComponent(album)}\`;
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
              
              let response = null;
              try {
                  response = await fetch(url.replace(' & ', ' '), { signal: controller.signal });
              } catch(fetchErr) {
                  console.warn('Better Lyrics: Exact match fetch failed, trying search...', fetchErr);
              }
              
              clearTimeout(timeoutId);

              let found = false;

              if (response && response.ok) {
                  const data = await response.json();
                  if (data.syncedLyrics) {
                      currentLyrics = parseLRC(data.syncedLyrics);
                      found = true;
                  }
              }
              
              if (!found) {
                 // Try search
                 console.log('Better Lyrics: Exact match not found or failed, searching...');
                 const searchUrl = \`https://lrclib.net/api/search?q=\${encodeURIComponent(artist + ' ' + title)}\`;
                 const searchController = new AbortController();
                 const searchTimeout = setTimeout(() => searchController.abort(), 10000);

                 const searchRes = await fetch(searchUrl, { signal: searchController.signal });
                 clearTimeout(searchTimeout);
                 
                 const searchData = await searchRes.json();
                 
                 if (searchData && searchData.length > 0) {
                     const match = searchData.find(item => item.syncedLyrics);
                     if (match) {
                         currentLyrics = parseLRC(match.syncedLyrics);
                         found = true;
                     } 
                 }
              }

              if (found && currentLyrics.length > 0) {
                  renderLyrics();
                  // Force update active line immediately
                  const video = document.querySelector('video');
                  if (video) updateActiveLine(video.currentTime);
              } else {
                  updateStatus('Synced lyrics not found.\\nShowing original lyrics.');
                  document.body.classList.remove('better-lyrics-active');
              }
              
          } catch (e) {
              console.error('Better Lyrics: Fetch error', e);
              updateStatus(\`Error loading lyrics: \${e.message || e}\`, '', true);
              // document.body.classList.remove('better-lyrics-active'); // Keep active to show error
          }
      }

      function updateStatus(msg, extraClass = '', showRetry = false) {
          if (lyricsContent) {
              let html = \`<div id="better-lyrics-status" class="\${extraClass}">\${msg}\`;
              
              if (showRetry) {
                  html += \`
                    <br><br>
                    <button id="better-lyrics-retry" style="
                        background: rgba(255, 255, 255, 0.1); 
                        border: 1px solid rgba(255, 255, 255, 0.2); 
                        color: white; 
                        padding: 8px 16px; 
                        border-radius: 4px; 
                        cursor: pointer;
                        font-family: inherit;
                    ">Retry</button>
                  \`;
              }
              
              html += \`</div>\`;
              lyricsContent.innerHTML = html;
              
              if (showRetry) {
                  const btn = lyricsContent.querySelector('#better-lyrics-retry');
                  if (btn && navigator.mediaSession.metadata) {
                      btn.onclick = (e) => {
                          e.stopPropagation();
                          fetchLyrics(navigator.mediaSession.metadata);
                      };
                  }
              }
          }
      }

      function renderLyrics() {
          if (!lyricsContent) return;
          lyricsContent.innerHTML = '';
          
          currentLyrics.forEach((line, index) => {
              const div = document.createElement('div');
              div.className = 'lyric-line';
              if (!line.text) div.classList.add('empty');
              div.textContent = line.text;
              div.dataset.time = line.time;
              div.dataset.index = index;
              
              div.onclick = () => {
                   const video = document.querySelector('video');
                   if (video) video.currentTime = line.time;
              };
              
              lyricsContent.appendChild(div);
          });
      }

      function updateActiveLine(time) {
          if (currentLyrics.length === 0) return;
          
          let newIndex = -1;
          for (let i = 0; i < currentLyrics.length; i++) {
              if (time >= currentLyrics[i].time) {
                  newIndex = i;
              } else {
                  break;
              }
          }
          
          if (newIndex !== activeLineIndex) {
              activeLineIndex = newIndex;
              
              const currentActive = lyricsContent.querySelector('.lyric-line.active');
              if (currentActive) currentActive.classList.remove('active');
              
              const lines = lyricsContent ? lyricsContent.querySelectorAll('.lyric-line') : [];
              if (newIndex >= 0 && newIndex < lines.length) {
                  const newActive = lines[newIndex];
                  newActive.classList.add('active');
                  
                  newActive.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
          }
      }

      // Initialize
      createUI();
      startLyricsObserver();

      // Events
      if (window.BetterYouTubeUtils) {
         window.BetterYouTubeUtils.onVideoFound((video) => {
           video.addEventListener('timeupdate', () => {
             updateActiveLine(video.currentTime);
           });
           // Use loadeddata only as a backup trigger, metadata observer is primary
         });
         
         window.BetterYouTubeUtils.onNavigation(() => {
             setTimeout(checkForLyricsTab, 500); 
         });
      }
      
      // Polling for metadata changes (reduced frequency for performance)
      let lastTitle = '';
      setInterval(() => {
          if (navigator.mediaSession.metadata) {
              const t = navigator.mediaSession.metadata.title;
              if (t !== lastTitle) {
                  lastTitle = t;
                  fetchLyrics(navigator.mediaSession.metadata);
              }
          }
          checkForLyricsTab();
      }, 2000); // Check every 2 seconds instead of 500ms

    })();
    `;
    }

    public async onRendererLoaded(window: BrowserWindow): Promise<void> {
        if (!this.isEnabled()) return;
        await this.injectRendererScript(window, this.getRendererScript());
    }
}

