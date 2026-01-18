import { BasePlugin } from '../Plugin';
import type { PluginMetadata } from '../Plugin';
import { BrowserWindow } from 'electron';

/**
 * BrowserUI Plugin for YouTube Music
 * Adds browser-like navigation controls and a unified title bar with integrated search
 */
export class BrowserUI extends BasePlugin {
    public metadata: PluginMetadata = {
        name: 'browser-ui',
        description: 'Adds browser navigation controls and unified title bar to YouTube Music',
        version: '2.0.0',
    };

    private getRendererScript(): string {
        const config = JSON.stringify(this.getConfig());
        return `
      (function() {
        'use strict';
        console.log('[BrowserUI] ========== Initializing YouTube Music Title Bar ==========');
        const config = ${config};
        const isEnabled = config.enabled !== false;
        
        if (!isEnabled) return;

        let titleBarInjected = false;

        // --- CSS Styles ---
        function injectStyles() {
            if (document.getElementById('browser-ui-ytm-style')) return;
            
            const style = document.createElement('style');
            style.id = 'browser-ui-ytm-style';
            style.textContent = \`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap');

                /* --- Custom Title Bar --- */
                #better-ytm-titlebar {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 48px;
                    background: #0f0f0f;
                    border-bottom: 1px solid #272727;
                    z-index: 999999;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 8px;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    -webkit-app-region: drag;
                }

                /* --- Left Section (Nav) --- */
                #better-ytm-titlebar .nav-section {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    -webkit-app-region: no-drag;
                }

                /* --- Center Section (Search) --- */
                #better-ytm-titlebar .search-section {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    max-width: 600px;
                    margin: 0 20px;
                    -webkit-app-region: no-drag;
                }

                #better-ytm-titlebar .search-section ytmusic-search-box {
                    width: 100%;
                    --ytmusic-search-box-height: 36px;
                }

                /* --- Right Section (Buttons + Window Controls) --- */
                #browser-ui-buttons {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    -webkit-app-region: no-drag;
                }

                #browser-ui-buttons .divider {
                    width: 1px;
                    height: 24px;
                    background: rgba(255, 255, 255, 0.1);
                    margin: 0 8px;
                }

                /* --- Buttons Shared Styles --- */
                .nav-btn, .window-btn {
                    background: transparent;
                    border: none;
                    color: rgba(255, 255, 255, 0.7);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.15s ease;
                    border-radius: 6px;
                    font-family: 'Inter', sans-serif;
                    padding: 0;
                    outline: none;
                    -webkit-app-region: no-drag;
                }

                .nav-btn:hover, .window-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: #fff;
                }

                .nav-btn:active, .window-btn:active {
                    transform: scale(0.92);
                }

                /* Buttons Sizing */
                .nav-btn { width: 36px; height: 36px; }
                .nav-btn svg { width: 18px; height: 18px; stroke-width: 2; }
                .window-btn { width: 44px; height: 36px; }
                .window-btn svg { width: 14px; height: 14px; }

                /* Settings Button (Purple) */
                .settings-btn { 
                    color: #a855f7 !important;
                }
                .settings-btn:hover { 
                    background: rgba(168, 85, 247, 0.15) !important; 
                    color: #c084fc !important; 
                }

                /* Close Button (Red on hover) */
                .window-btn.close-btn:hover { 
                    background: #e81123 !important; 
                    color: white !important; 
                }
                
                /* --- Body offset to account for title bar --- */
                body {
                    padding-top: 48px !important;
                }

                /* --- Fix YTMusic nav bar (hide it, we replace it) --- */
                /* We hide the nav bar but keep it in the DOM so that SVG <symbol> definitions 
                   inside it remain accessible for the sidebar icons (which use <use> references). 
                   Using clip and opacity instead of position:absolute off-screen. */
                ytmusic-nav-bar {
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 1px !important;
                    height: 1px !important;
                    opacity: 0 !important;
                    overflow: hidden !important;
                    clip: rect(0, 0, 0, 0) !important;
                    pointer-events: none !important;
                    z-index: -1 !important;
                }

                /* --- Fix content positioning --- */
                ytmusic-app {
                    margin-top: 0 !important;
                }

                #layout {
                    margin-top: 0 !important;
                }

                /* --- Hide native voice search & cast --- */
                #voice-search-button,
                ytmusic-voice-search-renderer,
                ytmusic-cast-button-renderer { 
                    display: none !important; 
                }

                /* --- Moved Profile Button Styles --- */
                .moved-profile-btn {
                    -webkit-app-region: no-drag;
                    /* Reset potentially conflicting styles */
                    position: static !important;
                    margin: 0 4px !important;
                    display: inline-flex !important;
                    align-items: center;
                    justify-content: center;
                    vertical-align: middle;
                }

                /* Ensure img inside profile button is visible and sized correctly if needed */
                .moved-profile-btn img {
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                }

                /* --- Fullscreen: Hide title bar --- */
                :fullscreen #better-ytm-titlebar,
                :-webkit-full-screen #better-ytm-titlebar {
                    display: none !important;
                }
                :fullscreen body,
                :-webkit-full-screen body {
                    padding-top: 0 !important;
                }
            \`;
            document.head.appendChild(style);
        }

        // --- Create Button Helper ---
        function createBtn(type, svg, onClick) {
            const btn = document.createElement('button');
            btn.className = (type === 'minimize' || type === 'maximize' || type === 'close') ? 'window-btn' : 'nav-btn';
            if (type === 'close') btn.classList.add('close-btn');
            if (type === 'settings') btn.classList.add('settings-btn');
            btn.innerHTML = svg;
            btn.title = type.charAt(0).toUpperCase() + type.slice(1);
            btn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); onClick(); };
            return btn;
        }

        // --- Move Profile Button ---
        function moveProfileButton() {
            const buttonsContainer = document.getElementById('browser-ui-buttons');
            if (!buttonsContainer) return;

            // Check if we already have a profile button
            if (buttonsContainer.querySelector('.moved-profile-btn')) return;

            // Strategy 1: Look for ytmusic-settings-button (specific component)
            let profileBtn = document.querySelector('ytmusic-settings-button');

            // Strategy 2: Look in nav-bar right content
            if (!profileBtn) {
                const navBar = document.querySelector('ytmusic-nav-bar');
                if (navBar) {
                    // Try to find the right-content container
                    // It's usually a div with class 'right-content' or similar
                    // We iterate over children of nav-bar to find candidates
                    const rightContent = navBar.querySelector('.right-content') ||
                                         navBar.querySelector('#right-content') ||
                                         navBar.lastElementChild; // Fallback

                    if (rightContent) {
                        // Iterate children to find the profile button
                        // We exclude known elements like cast button, voice search, etc.
                        const candidates = Array.from(rightContent.children);
                        for (const candidate of candidates) {
                            const tagName = candidate.tagName.toLowerCase();
                            const id = candidate.id || '';
                            const className = candidate.className || '';

                            // Skip hidden or known non-profile elements
                            if (tagName.includes('cast-button') ||
                                tagName.includes('voice-search') ||
                                tagName.includes('search-box') ||
                                tagName.includes('logo') ||
                                id === 'voice-search-button' ||
                                className.includes('cast-button')) {
                                continue;
                            }

                            // Heuristic: Profile button usually contains an image (avatar)
                            if (candidate.querySelector('img') || candidate.querySelector('yt-img-shadow')) {
                                profileBtn = candidate;
                                break;
                            }

                            // Fallback: if it's the last element and not known bad
                            // profileBtn = candidate;
                        }
                    }
                }
            }

            if (profileBtn) {
                // Move it
                profileBtn.classList.add('moved-profile-btn');
                buttonsContainer.insertBefore(profileBtn, buttonsContainer.firstChild);
                console.log('[BrowserUI] 👤 Profile button relocated');
            }
        }

        // --- Create Title Bar ---
        function createTitleBar() {
            if (document.getElementById('better-ytm-titlebar')) return;

            const titleBar = document.createElement('div');
            titleBar.id = 'better-ytm-titlebar';

            // === Left Section: Navigation ===
            const navSection = document.createElement('div');
            navSection.className = 'nav-section';

            const backBtn = createBtn('back', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>', () => {
                if (window.electronAPI?.navigate) window.electronAPI.navigate('back'); else window.history.back();
            });
            const fwdBtn = createBtn('forward', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>', () => {
                if (window.electronAPI?.navigate) window.electronAPI.navigate('forward'); else window.history.forward();
            });
            const refreshBtn = createBtn('refresh', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 11-3-6.7"/><path d="M21 4v5h-5"/></svg>', () => {
                if (window.electronAPI?.navigate) window.electronAPI.navigate('refresh'); else window.location.reload();
            });

            navSection.appendChild(backBtn);
            navSection.appendChild(fwdBtn);
            navSection.appendChild(refreshBtn);

            // === Center Section: Search ===
            const searchSection = document.createElement('div');
            searchSection.className = 'search-section';
            
            // Clone the native search box into our title bar
            const nativeSearchBox = document.querySelector('ytmusic-search-box');
            if (nativeSearchBox) {
                const searchClone = nativeSearchBox.cloneNode(true);
                searchSection.appendChild(searchClone);
                
                // Forward search events to native
                searchClone.addEventListener('input', (e) => {
                    const target = e.target;
                    if (target && target.value !== undefined && nativeSearchBox.querySelector('input')) {
                        nativeSearchBox.querySelector('input').value = target.value;
                    }
                });
            }

            // === Right Section: Buttons Container ===
            const buttonsContainer = document.createElement('div');
            buttonsContainer.id = 'browser-ui-buttons';

            // Settings button
            const settingsBtn = createBtn('settings', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>', () => {
                window.electronAPI?.openSettings?.().catch(() => {});
            });
            settingsBtn.id = 'better-youtube-settings-btn-v2';

            // Divider
            const divider = document.createElement('div');
            divider.className = 'divider';

            // Window controls
            const minBtn = createBtn('minimize', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>', () => window.electronAPI?.windowAction?.('minimize'));
            const maxBtn = createBtn('maximize', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>', () => window.electronAPI?.windowAction?.('maximize'));
            const closeBtn = createBtn('close', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>', () => window.electronAPI?.windowAction?.('close'));

            // Note: VolumeBooster will inject itself before the divider
            buttonsContainer.appendChild(settingsBtn);
            buttonsContainer.appendChild(divider);
            buttonsContainer.appendChild(minBtn);
            buttonsContainer.appendChild(maxBtn);
            buttonsContainer.appendChild(closeBtn);

            // === Assemble Title Bar ===
            titleBar.appendChild(navSection);
            titleBar.appendChild(searchSection);
            titleBar.appendChild(buttonsContainer);

            document.body.insertBefore(titleBar, document.body.firstChild);
            titleBarInjected = true;
            console.log('[BrowserUI] ✅ Title bar injected');
        }

        // --- Init ---
        function init() {
            injectStyles();
            createTitleBar();
            // Try to move profile button immediately, but it might not be ready yet
            setTimeout(moveProfileButton, 1000);
        }

        // Run when ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
        
        // Resilience: Check periodically (handles both missing elements and SPA navigation)
        let lastUrl = location.href;
        setInterval(() => {
          // Re-inject if title bar was removed
          if (!document.getElementById('better-ytm-titlebar')) {
            titleBarInjected = false;
            init();
          } else {
            // Also check if profile button needs moving (e.g. after re-render)
            moveProfileButton();
          }
          // Re-inject on URL change (SPA navigation) - only if actually changed
          const currentUrl = location.href;
          if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;
            // Debounce: only re-init after navigation settles
            setTimeout(() => {
                init();
                // Check for profile button again after navigation settle
                setTimeout(moveProfileButton, 2000);
            }, 500);
          }
        }, 5000); // Check every 5 seconds (slightly more frequent to catch profile button load)

        console.log('[BrowserUI] ✅ YouTube Music Title Bar Configured');
      })();
    `;
    }

    public async onRendererLoaded(window: BrowserWindow): Promise<void> {
        if (!this.isEnabled()) return;
        const script = this.getRendererScript();
        await window.webContents.executeJavaScript(script, true);

        // Inject again on navigation events
        window.webContents.on('did-navigate-in-page', () => {
            window.webContents.executeJavaScript(script, true).catch(() => { });
        });
    }
}
