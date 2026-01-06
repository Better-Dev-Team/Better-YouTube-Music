import { BasePlugin } from '../Plugin';
import type { PluginMetadata } from '../Plugin';
import { BrowserWindow } from 'electron';

/**
 * BrowserUI Plugin
 * Adds browser-like navigation controls (back, forward, refresh, settings) to the title bar overlay area
 * Works WITH the native Windows title bar (titleBarOverlay)
 */
export class BrowserUI extends BasePlugin {
  public metadata: PluginMetadata = {
    name: 'browser-ui',
    description: 'Adds browser navigation controls (back, forward, refresh) to the title bar',
    version: '2.0.0',
  };

  private getRendererScript(): string {
    const config = JSON.stringify(this.getConfig());
    return `
      (function() {
        console.log('[BrowserUI] Initializing overlay buttons...');
        const config = ${config};
        
        if (!config.enabled) {
          console.log('[BrowserUI] Plugin disabled');
          return;
        }

        console.log('[BrowserUI] API Check:', {
          electronAPI: !!window.electronAPI,
          openSettings: !!window.electronAPI?.openSettings,
          navigate: !!window.electronAPI?.navigate
        });
        
        function injectTitleBarButtons() {
          // Remove existing if re-injecting
          const existing = document.getElementById('browser-ui-buttons');
          if (existing) existing.remove();
          const existingStyle = document.getElementById('browser-ui-style');
          if (existingStyle) existingStyle.remove();
          
          // The titleBarOverlay reserves ~32px at top for native Windows buttons
          // We inject our buttons WITHIN that reserved space on the LEFT side
          const titleBarHeight = 32;
          
          // Inject styles
          const style = document.createElement('style');
          style.id = 'browser-ui-style';
          style.textContent = \`
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap');
            
            /* UNIFIED HEADER CONFIGURATION */
            
            /* 1. Container for our custom buttons (Top-Left) */
            #browser-ui-buttons {
              position: fixed !important;
              top: 0 !important;
              left: 0 !important;
              height: 64px !important; /* Match standard YTM nav bar height */
              display: flex !important;
              align-items: center !important;
              gap: 4px !important;
              padding-left: 12px !important; /* Left margin */
              gap: 4px !important;
              padding-left: 12px !important; /* Left margin */
              z-index: 2147483647 !important; /* Max Z-Index to ensure it's on top of everything */
              -webkit-app-region: no-drag !important;
              pointer-events: auto !important;
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            }
            
            /* 2. Styling the native YTM Nav Bar to be the main background */
            ytmusic-nav-bar {
              position: fixed !important;
              top: 0 !important;
              width: 100% !important;
              height: 64px !important;
              z-index: 2000 !important;
              border-bottom: 1px solid rgba(255,255,255,0.1) !important;
              -webkit-app-region: drag !important; /* Make the whole bar draggable */
              background: #030303 !important;
            }
            
            /* 3. Shift YTM Logo/Left Content to the right to make room for our buttons */
            /* We have ~160px of buttons, need more space to avoid clipping settings button */
            /* 3. Shift YTM Logo/Left Content to the right to make room for our buttons */
            /* 3. Shift YTM Logo/Left Content to the right to make room for our buttons */
            /* 3. Shift YTM Logo/Left Content to the right to make room for our buttons */
            /* 3. Shift YTM Logo/Left Content to the right to make room for our buttons */
            ytmusic-nav-bar .left-content {
              margin-left: 0 !important; /* RESET MARGIN, use padding/width instead */
              padding-left: 260px !important; /* Space for buttons */
              width: 300px !important; /* Fixed width for left side (Increased to 300px) */
              flex: 0 0 300px !important;
              -webkit-app-region: no-drag !important;
              display: flex !important;
              align-items: center !important;
              justify-content: flex-start !important;
            }
            
            /* 4. BALANCED CENTER - NO ABSOLUTE POSITIONING */
            ytmusic-nav-bar .center-content {
              position: static !important; /* Disable absolute */
              transform: none !important;
              flex: 1 !important; /* Fill remaining space */
              -webkit-app-region: drag !important; /* ALLOW DRAGGING on the container */
              pointer-events: auto !important;
              justify-content: center !important;
              display: flex !important;
              min-width: 0 !important; /* Allow shrinking */
            }
            
            /* Protect the search box from overflowing or being too small */
            ytmusic-search-box {
              min-width: 200px !important;
              max-width: 1000px !important; /* Wider search bar */
              width: 100% !important;
              -webkit-app-region: no-drag !important; /* Keep search box interactable */
            }

            /* Hide Cast Button - Aggressive */
            ytmusic-cast-button-renderer,
            ytmusic-nav-bar #cast-button,
            ytmusic-app-header #cast-button,
            [aria-label="Cast to a device"],
            [title="Cast to a device"] {
              display: none !important;
            }

            /* 5. Adjust Window Controls Area (Native TitleBarOverlay covers top-right) */
            /* We just need to make sure the right-side content (Avatar etc) doesn't overlap native controls */
            /* 5. Adjust Window Controls Area (Native TitleBarOverlay covers top-right) */
            /* Force Right Content to match Left Content width to create a "Center Sandwich" */
            ytmusic-nav-bar .right-content {
              margin-right: 140px !important; /* Space for Min/Max/Close */
              width: 40px !important; /* 180px (Total) - 140px (Margin) = 40px effective visual */
              flex: 0 0 180px !important; /* Right Side Total Width (180px) - Asymmetric to Left (300px) */
              
              -webkit-app-region: no-drag !important;
              justify-content: flex-end !important;
              display: flex !important;
              flex-shrink: 0 !important;
            }

            /* FIX SEARCH SUGGESTIONS DROPDOWN */
            /* Ensure it follows the Asymmetric Layout */
            ytmusic-search-suggestions-section {
              position: fixed !important;
              top: 52px !important; /* Align just under the search bar */
              left: 300px !important; /* Match Left Spacer */
              right: 180px !important; /* Match Right Spacer */
              width: auto !important;
              max-width: 1000px !important; /* Match Search Box Max-Width */
              margin: 0 auto !important; /* Center within the available space */
              z-index: 9999 !important;
            }
            
            /* Ensure the dropdown content itself doesn't overflow */
            ytmusic-search-suggestions-section #suggestions {
              max-width: 1000px !important;
              margin: 0 auto !important;
            }

            /* Custom Button Styling */
            #browser-ui-buttons .nav-btn {
              width: 32px !important;
              height: 32px !important;
              border: none !important;
              background: transparent !important;
              color: rgba(255, 255, 255, 0.7) !important;
              cursor: pointer !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              border-radius: 8px !important;
              transition: all 0.15s ease !important;
              padding: 0 !important;
              outline: none !important;
              -webkit-app-region: no-drag !important; /* Force no-drag on buttons specifically */
              pointer-events: auto !important; /* Ensure clicks are captured */
            }
            
            #browser-ui-buttons .nav-btn:hover {
              background: rgba(255, 255, 255, 0.1) !important;
              color: #fff !important;
            }
            
            #browser-ui-buttons .nav-btn:active {
              transform: scale(0.92) !important;
            }
            
            #browser-ui-buttons .nav-btn svg {
              width: 18px !important;
              height: 18px !important;
              stroke-width: 2 !important;
            }
            
            #browser-ui-buttons .nav-btn.settings-btn {
              background: rgba(138, 43, 226, 0.15) !important;
              color: rgba(180, 120, 255, 0.95) !important;
              margin-left: 6px !important;
            }
            
            #browser-ui-buttons .nav-btn.settings-btn:hover {
              background: rgba(138, 43, 226, 0.35) !important;
              color: #d4a5ff !important;
            }
            
            #browser-ui-buttons .divider {
              width: 1px !important;
              height: 20px !important;
              background: rgba(255, 255, 255, 0.12) !important;
              margin: 0 6px !important;
            }
            
            /* Hide the old floating settings button */
            #better-youtube-settings-btn,
            #custom-settings-btn {
              display: none !important;
            }
            
            /* CONTENT LAYOUT - content starts AFTER the 64px header */
            ytmusic-app-layout {
              margin-top: 64px !important;
              height: calc(100vh - 64px) !important;
              overflow-y: auto !important; /* Allow scrolling */
              scrollbar-width: thin !important;
            }
            
            /* Global scroll fix settings */
            html, body {
              height: 100vh !important;
              overflow: hidden !important; /* Hide native scrollbar on body */
              margin: 0 !important;
              padding: 0 !important;
              background: #030303 !important;
            }
            
            ytmusic-app {
              height: 100% !important;
              overflow: hidden !important;
            }
            
            /* Sidebar positioning */
            ytmusic-guide-renderer,
            ytmusic-app-layout #guide-wrapper,
            #mini-guide-layer {
              top: 64px !important;
              height: calc(100vh - 64px - 72px) !important;
            }
            
            /* Player bar */
            ytmusic-player-bar {
              position: fixed !important;
              bottom: 0 !important;
              left: 0 !important;
              right: 0 !important;
              width: 100% !important;
              height: 72px !important;
              z-index: 2023 !important;
              background: #030303 !important;
            }
          \`;
          document.head.appendChild(style);
          
          // Create button container
          const container = document.createElement('div');
          container.id = 'browser-ui-buttons';
          
          // Helper to create buttons
          const createBtn = (title, svgContent, onClick, className = '') => {
            const btn = document.createElement('button');
            btn.className = 'nav-btn' + (className ? ' ' + className : '');
            btn.title = title;
            btn.innerHTML = svgContent;
            btn.onclick = (e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('[BrowserUI] Button clicked:', title);
              onClick();
            };
            // Stop drag propagation on mousedown
            btn.onmousedown = (e) => {
              e.stopPropagation();
              // Do not preventDefault here, or focus might not work (though generic buttons don't need it)
            };
            return btn;
          };
          
          // Back button
          const backBtn = createBtn('Go back', 
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
            () => window.electronAPI?.navigate?.('back') || window.history.back()
          );
          
          // Forward button
          const fwdBtn = createBtn('Go forward',
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>',
            () => window.electronAPI?.navigate?.('forward') || window.history.forward()
          );
          
          // Refresh button
          const refreshBtn = createBtn('Refresh',
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 11-3-6.7"/><path d="M21 4v5h-5"/></svg>',
            () => window.electronAPI?.navigate?.('refresh') || window.location.reload()
          );
          
          // Divider
          const divider = document.createElement('div');
          divider.className = 'divider';
          
          // Settings button (purple accent)
          const settingsBtn = createBtn('Settings',
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>',
            () => {
              console.log('[BrowserUI] Settings button clicked');
              window.electronAPI?.openSettings?.().catch(err => console.error('[BrowserUI] Failed to open settings:', err));
            },
            'settings-btn'
          );
          
          // Assemble buttons
          container.appendChild(backBtn);
          container.appendChild(fwdBtn);
          container.appendChild(refreshBtn);
          container.appendChild(divider);
          container.appendChild(settingsBtn);
          
          // Insert at end of body to ensure it sits on top of other elements
          if (document.body) {
             document.body.appendChild(container);
          }
          
          console.log('[BrowserUI] ✅ Title bar buttons injected!');
        }

          // FORCE REMOVE CAST BUTTON (Deep Shadow DOM Traversal)
          function forceRemoveCastButton() {
            // 1. Simple Selectors
            const selectors = [
              'ytmusic-cast-button-renderer',
              '[aria-label="Cast to a device"]',
              '.cast-button'
            ];
            
            selectors.forEach(sel => {
              document.querySelectorAll(sel).forEach(el => {
                el.remove();
                console.log('[BrowserUI] 🗑️ Standard removed:', sel);
              });
            });

            // 2. Deep Shadow DOM Traversal (Recursive)
            function walk(root) {
              if (!root) return;
              
              // Check Children
              if (root.querySelectorAll) {
                selectors.forEach(sel => {
                  root.querySelectorAll(sel).forEach(el => {
                    el.style.display = 'none'; // Hide first
                    el.remove(); // Then remove
                    console.log('[BrowserUI] 🕵️ Deep removed:', sel);
                  });
                });
              }

              // Walk Shadow Roots
              // Note: We can only access open shadow roots, or via specific properties
              if (root.shadowRoot) {
                walk(root.shadowRoot);
              }
              
              // Walk Children manually to find other Shadow Roots
              if (root.children) {
                 for (let i = 0; i < root.children.length; i++) {
                   walk(root.children[i]);
                 }
              }
            }
            
            // Start walk from body and likely containers
            walk(document.body);
            const nav = document.querySelector('ytmusic-nav-bar');
            if (nav) walk(nav);
          }
          
          // --- RUN INITIALIZATION ---
          injectTitleBarButtons();
          forceRemoveCastButton();

          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', injectTitleBarButtons);
          }
          
          setTimeout(injectTitleBarButtons, 500);
          setTimeout(injectTitleBarButtons, 1500);
          
          // Hammer Cast Button Removal
          setInterval(forceRemoveCastButton, 2000);
          
          // SPA Navigation Watcher
          let lastUrl = location.href;
          const observer = new MutationObserver(() => {
            if (location.href !== lastUrl) {
              lastUrl = location.href;
              setTimeout(injectTitleBarButtons, 100);
              setTimeout(forceRemoveCastButton, 500); 
            }
          });
          observer.observe(document, { subtree: true, childList: true });
      })();
    `;
  }

  public async onRendererLoaded(window: BrowserWindow): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    try {
      const url = window.webContents.getURL();
      if (!url.includes('youtube.com')) return;

      const script = this.getRendererScript();
      await window.webContents.executeJavaScript(script, true);
      console.log('[BrowserUI] ✅ Overlay buttons script executed');

      // Re-inject after delays
      setTimeout(async () => {
        try {
          const currentUrl = window.webContents.getURL();
          if (currentUrl.includes('youtube.com')) {
            await window.webContents.executeJavaScript(script, true);
          }
        } catch (err) {
          console.error('[BrowserUI] Error re-injecting:', err);
        }
      }, 1500);
    } catch (error) {
      console.error('[BrowserUI] ❌ Error injecting script:', error);
    }
  }

  public getConfig(): any {
    const baseConfig = super.getConfig();
    return {
      ...baseConfig,
      enabled: baseConfig.enabled !== false,
    };
  }
}
