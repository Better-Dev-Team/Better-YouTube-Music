import { BasePlugin } from '../Plugin';
import type { PluginMetadata } from '../Plugin';
import { BrowserWindow } from 'electron';

/**
 * BrowserUI Plugin
 * Adds browser-like navigation controls (back, forward, refresh) to the YouTube interface
 */
export class BrowserUI extends BasePlugin {
  public metadata: PluginMetadata = {
    name: 'browser-ui',
    description: 'Adds browser navigation controls (back, forward, refresh) to YouTube',
    version: '1.0.0',
  };

  private getRendererScript(): string {
    const config = JSON.stringify(this.getConfig());
    return `
      (function() {
        console.log('[BrowserUI RENDERER] ========== SCRIPT STARTED ==========');
        const config = ${config};
        const isEnabled = config.enabled !== false;
        
        if (!isEnabled) {
          console.log('[BrowserUI RENDERER] Plugin disabled');
          return;
        }
        
        function injectTitleBarButtons() {
          // Remove existing title bar if present
          const existing = document.getElementById('browser-ui-titlebar');
          if (existing) existing.remove();
          const existingStyle = document.getElementById('browser-ui-titlebar-style');
          if (existingStyle) existingStyle.remove();
          
          // Title bar height
          const titleBarHeight = 38;
          
          // Inject modern styles
          const style = document.createElement('style');
          style.id = 'browser-ui-titlebar-style';
          style.textContent = \`
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap');
            
            #browser-ui-titlebar {
              position: fixed !important;
              top: 0 !important;
              left: 0 !important;
              right: 0 !important;
              width: 100vw !important;
              height: \${titleBarHeight}px !important;
              display: flex !important;
              align-items: center !important;
              justify-content: space-between !important;
              background: rgba(18, 18, 22, 0.92) !important;
              backdrop-filter: blur(24px) saturate(180%) !important;
              -webkit-backdrop-filter: blur(24px) saturate(180%) !important;
              z-index: 999999999 !important;
              -webkit-app-region: drag !important;
              border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
              user-select: none !important;
              box-sizing: border-box !important;
              padding: 0 10px !important;
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            }

            /* Scaling Fix */
            body {
              zoom: 1.0 !important;
              /* YT Music specific background to avoid white flashes if gaps appear */
              background: #030303 !important; 
            }
            
            /* Hide titlebar in fullscreen */
            body:fullscreen #browser-ui-titlebar {
              display: none !important;
            }
            
            #browser-ui-titlebar .nav-section,
            #browser-ui-titlebar .window-section {
              display: flex !important;
              align-items: center !important;
              gap: 4px !important;
              -webkit-app-region: no-drag !important;
              flex-shrink: 0 !important;
            }
            
            #browser-ui-titlebar .nav-btn {
              width: 38px !important;
              height: 34px !important;
              border: none !important;
              background: transparent !important;
              color: rgba(255, 255, 255, 0.65) !important;
              cursor: pointer !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              border-radius: 8px !important;
              transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1) !important;
              padding: 0 !important;
              -webkit-app-region: no-drag !important;
              outline: none !important;
              position: relative !important;
              overflow: hidden !important;
            }
            
            #browser-ui-titlebar .nav-btn::before {
              content: '' !important;
              position: absolute !important;
              inset: 0 !important;
              background: radial-gradient(circle at center, rgba(255, 255, 255, 0.2), transparent 70%) !important;
              opacity: 0 !important;
              transition: opacity 0.2s !important;
            }
            
            #browser-ui-titlebar .nav-btn:hover {
              background: rgba(255, 255, 255, 0.1) !important;
              color: rgba(255, 255, 255, 0.95) !important;
            }
            
            #browser-ui-titlebar .nav-btn:hover::before {
              opacity: 1 !important;
            }
            
            #browser-ui-titlebar .nav-btn:active {
              transform: scale(0.94) !important;
              background: rgba(255, 255, 255, 0.15) !important;
            }
            
            #browser-ui-titlebar .nav-btn svg {
              width: 20px !important;
              height: 20px !important;
              stroke-width: 2 !important;
              position: relative !important;
              z-index: 1 !important;
              transition: transform 0.2s !important;
            }
            
            #browser-ui-titlebar .nav-btn:hover svg {
              transform: scale(1.1) !important;
            }

            #browser-ui-titlebar .nav-btn:active svg {
              transform: scale(0.9) !important;
              opacity: 0.7 !important;
            }
            
            #browser-ui-titlebar .nav-btn.settings-btn {
              background: rgba(138, 43, 226, 0.18) !important;
              color: rgba(180, 120, 255, 0.95) !important;
              margin-left: 0 !important;
              margin-right: 12px !important;
            }
            
            #browser-ui-titlebar .nav-btn.settings-btn:hover {
              background: rgba(138, 43, 226, 0.3) !important;
              color: #d4a5ff !important;
            }
            
            #browser-ui-titlebar .divider {
              width: 1px !important;
              height: 18px !important;
              background: linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.12), transparent) !important;
              margin: 0 6px !important;
            }
            
            #browser-ui-titlebar .spacer {
              flex: 1 !important;
              -webkit-app-region: drag !important;
            }
            
            #browser-ui-titlebar .window-section {
              gap: 0 !important;
            }
            
            #browser-ui-titlebar .window-btn {
              width: 46px !important;
              height: 34px !important;
              border: none !important;
              background: transparent !important;
              color: rgba(255, 255, 255, 0.7) !important;
              cursor: pointer !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              transition: all 0.15s !important;
              padding: 0 !important;
              -webkit-app-region: no-drag !important;
              outline: none !important;
              border-radius: 0 !important;
            }
            
            #browser-ui-titlebar .window-btn:first-child {
              border-radius: 6px 0 0 6px !important;
            }
            
            #browser-ui-titlebar .window-btn:last-child {
              border-radius: 0 6px 6px 0 !important;
            }
            
            #browser-ui-titlebar .window-btn:hover {
              background: rgba(255, 255, 255, 0.1) !important;
              color: #fff !important;
            }
            
            #browser-ui-titlebar .window-btn svg {
              width: 18px !important;
              height: 18px !important;
              stroke-width: 2 !important;
            }
            
            #browser-ui-titlebar .window-btn.close-btn:hover {
              background: linear-gradient(135deg, #ff4757 0%, #c0392b 100%) !important;
              color: white !important;
            }
            
            html, body {
              padding-top: \${titleBarHeight}px !important;
              margin-top: 0 !important;
              box-sizing: border-box !important;
              overflow-x: hidden !important;
            }

            /* Compatibility with AppMenuBar */
            body:has(#better-youtube-menu-bar) {
              padding-top: 78px !important; /* 38 + 40 */
            }

            body:has(#better-youtube-menu-bar) ytd-app {
              margin-top: 78px !important;
            }

            body:has(#better-youtube-menu-bar) #masthead-container,
            body:has(#better-youtube-menu-bar) ytd-masthead {
              top: 78px !important;
            }
            
            body:has(#better-youtube-menu-bar) #guide.ytd-app {
              top: calc(78px + 56px) !important;
            }

            /* =========================================================================
               YouTube Music Specific Layout Fixes
               ========================================================================= */

            /* Push the main app down to accommodate our titlebar */
            html, body, ytmusic-app {
              margin-top: 0 !important;
              padding-top: 0 !important; /* CRITICAL: Remove body padding to prevent double-spacing causing black bar */
            }

            /* The main navigation bar in YouTube Music */
            ytmusic-nav-bar {
              position: fixed !important;
              top: \${titleBarHeight}px !important; /* Move it down below our titlebar */
              width: 100% !important;
              z-index: 2022 !important; /* Ensure it's above everything else but below titlebar (999...) */
            }

            /* The content area needs to be pushed down */
            
            /* Main content area - needs to clear both titlebar (38px) and navbar (64px) */
            #browse-page, 
            ytmusic-browse-response,
            ytmusic-player-page {
               padding-top: calc(\${titleBarHeight}px + 64px) !important;
            }
            
            /* For Search page results */
            ytmusic-search-page {
              padding-top: calc(\${titleBarHeight}px + 64px) !important;
            }

            /* Ensure the nav-bar background is solid so content doesn't show behind it */
            ytmusic-nav-bar {
              background-color: #030303 !important;
            }

            /* Fix "Giant Black Bar" / Scrolling overlay issue */
            ytmusic-app {
              padding-top: 0 !important; 
              display: flex !important;
              flex-direction: column !important;
              height: 100vh !important;
            }
            
            /* Enable scrolling on the layout container */
            ytmusic-app-layout {
              flex: 1 !important;
              overflow-x: hidden !important;
              overflow-y: auto !important; /* CRITICAL: Allow scrolling */
              display: flex !important;
              flex-direction: column !important;
              scrollbar-width: thin !important;
            }
            
            /* Fix Sidebar/Guide Clipping */
            /* The sidebar sits below the nav bar (64px) + title bar (38px) */
            ytmusic-guide-renderer,
            ytmusic-app-layout #guide-wrapper,
            #mini-guide-layer {
              position: fixed !important;
              top: calc(\${titleBarHeight}px + 64px) !important;
              left: 0 !important;
              max-height: calc(100vh - \${titleBarHeight}px - 64px - 72px) !important; /* Account for player bar */
              height: calc(100vh - \${titleBarHeight}px - 64px - 72px) !important;
              overflow-y: auto !important;
              overflow-x: hidden !important;
              z-index: 100 !important; /* Below navbar (2022) but above content */
              background-color: #030303 !important; /* Match background to prevent see-through */
            }
            
            /* Ensure sidebar content scrolls properly */
            ytmusic-guide-renderer #guide-content,
            ytmusic-guide-renderer #guide-inner-content {
              max-height: 100% !important;
              overflow-y: auto !important;
              overflow-x: hidden !important;
            }
            
            /* Ensure the drawer (if opened) covers correctly */
            tp-yt-app-drawer {
              z-index: 2050 !important; /* Above everything */
              top: calc(\${titleBarHeight}px + 64px) !important;
              max-height: calc(100vh - \${titleBarHeight}px - 64px - 72px) !important;
            }
            
            /* Prevent sidebar from being covered by nav bar */
            ytmusic-nav-bar {
              z-index: 2022 !important; /* Above sidebar (100) */
            }
            
            /* Ensure title bar is always on top */
            #browser-ui-titlebar {
              z-index: 999999999 !important; /* Highest z-index */
            }

             /* Hide the old custom settings button overlay */
            #better-youtube-settings-btn,
            #custom-settings-btn {
              display: none !important;
            }

            /* PLAYER BAR FIXES - Vital for preventing the black overlay */
            ytmusic-player-bar {
              position: fixed !important;
              bottom: 0 !important;
              left: 0 !important;
              right: 0 !important;
              width: 100% !important;
              height: 72px !important; /* Enforce standard height */
              z-index: 2023 !important; /* Ensure it stays on top but contained */
              background: #030303 !important;
              transform: none !important; /* Prevent JS from sliding it up wrongly */
              transition: transform 0.2s cubic-bezier(0.2,0,0.6,1) !important;
            }

            /* Only allow transform when it's actually the fullscreen player or intended */
            /* We trust the app's 'expanded' attribute or class usually, but if it's bugging out, 
               we enforce the docked state default. */

            /* Make sure the player page (fullscreen player) behaves */
            ytmusic-player-page {
              /* If this is the element sliding up, we need to let it, but often the 
                 misbehavior is the bar itself thinking it should cover more space. */
              z-index: 2000 !important;
            }

            /* Adjust content scroll area */
            #browse-page, 
            ytmusic-browse-response {
               padding-bottom: 80px !important; /* Space for player bar */
            }
            
            /* Ensure smooth scaling */
            @media (max-width: 1200px) {
              #browser-ui-titlebar {
                padding: 0 6px !important;
              }
            }
          \`;
          document.head.appendChild(style);

          // Create title bar structure
          const titleBar = document.createElement('div');
          titleBar.id = 'browser-ui-titlebar';

          // Navigation section (left)
          const navSection = document.createElement('div');
          navSection.className = 'nav-section';

          // Back button
          const backBtn = document.createElement('button');
          backBtn.className = 'nav-btn';
          backBtn.title = 'Go back';
          backBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>';
          backBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (window.electronAPI && window.electronAPI.navigate) {
              window.electronAPI.navigate('back');
            } else {
              window.history.back();
            }
          };

          // Forward button
          const forwardBtn = document.createElement('button');
          forwardBtn.className = 'nav-btn';
          forwardBtn.title = 'Go forward';
          forwardBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>';
          forwardBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (window.electronAPI && window.electronAPI.navigate) {
              window.electronAPI.navigate('forward');
            } else {
              window.history.forward();
            }
          };

          // Refresh button
          const refreshBtn = document.createElement('button');
          refreshBtn.className = 'nav-btn';
          refreshBtn.title = 'Refresh';
          refreshBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 11-3-6.7"/><path d="M21 4v5h-5"/></svg>';
          refreshBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (window.electronAPI && window.electronAPI.navigate) {
              window.electronAPI.navigate('refresh');
            } else {
              window.location.reload();
            }
          };

          navSection.appendChild(backBtn);
          navSection.appendChild(forwardBtn);
          navSection.appendChild(refreshBtn);

          // Spacer for draggable area
          const spacer = document.createElement('div');
          spacer.className = 'spacer';

          // Window controls section (right)
          const windowSection = document.createElement('div');
          windowSection.className = 'window-section';

          // Settings button (purple accent)
          const settingsBtn = document.createElement('button');
          settingsBtn.className = 'nav-btn settings-btn';
          settingsBtn.title = 'Settings';
          settingsBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
          settingsBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (window.electronAPI && window.electronAPI.openSettings) {
              window.electronAPI.openSettings().catch(() => { });
            }
          };

          windowSection.appendChild(settingsBtn);

          // Minimize
          const minimizeBtn = document.createElement('button');
          minimizeBtn.className = 'window-btn';
          minimizeBtn.title = 'Minimize';
          minimizeBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>';
          minimizeBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (window.electronAPI && window.electronAPI.windowAction) {
              window.electronAPI.windowAction('minimize');
            }
          };

          // Maximize
          const maximizeBtn = document.createElement('button');
          maximizeBtn.className = 'window-btn';
          maximizeBtn.title = 'Maximize';
          maximizeBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>';
          maximizeBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (window.electronAPI && window.electronAPI.windowAction) {
              window.electronAPI.windowAction('maximize');
            }
          };

          // Close
          const closeBtn = document.createElement('button');
          closeBtn.className = 'window-btn close-btn';
          closeBtn.title = 'Close';
          closeBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>';
          closeBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (window.electronAPI && window.electronAPI.windowAction) {
              window.electronAPI.windowAction('close');
            }
          };

          windowSection.appendChild(minimizeBtn);
          windowSection.appendChild(maximizeBtn);
          windowSection.appendChild(closeBtn);

          // Assemble title bar
          titleBar.appendChild(navSection);
          titleBar.appendChild(spacer);
          titleBar.appendChild(windowSection);

          // Insert at beginning of body
          if (document.body) {
            document.body.insertBefore(titleBar, document.body.firstChild);
          }

          console.log('[BrowserUI RENDERER] ✅ Modern title bar created!');
        }
        
        function init() {
          injectTitleBarButtons();
        }

        // Run immediately and after delays
        init();
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', init);
        }
        setTimeout(init, 500);
        setTimeout(init, 1500);
        setTimeout(init, 3000);

        // Re-inject on SPA navigation
        let lastUrl = location.href;
        const observer = new MutationObserver(() => {
          if (location.href !== lastUrl) {
            lastUrl = location.href;
            setTimeout(init, 100);
          }
        });
        observer.observe(document, { subtree: true, childList: true });
      }) ();
    `;
  }

  public async onRendererLoaded(window: BrowserWindow): Promise<void> {
    console.log('[BrowserUI] onRendererLoaded called');
    console.log('[BrowserUI] Plugin enabled?', this.isEnabled());
    console.log('[BrowserUI] Config:', this.getConfig());

    if (!this.isEnabled()) {
      console.log('[BrowserUI] Plugin is disabled, skipping');
      return;
    }

    try {
      const url = window.webContents.getURL();
      console.log('[BrowserUI] Current URL:', url);

      if (!url.includes('youtube.com')) {
        console.log('[BrowserUI] Not a YouTube URL, skipping');
        return;
      }

      console.log('[BrowserUI] Executing renderer script...');
      const script = this.getRendererScript();
      console.log('[BrowserUI] Script length:', script.length);

      // Inject the main script
      await window.webContents.executeJavaScript(script, true);
      console.log('[BrowserUI] ✅ Navigation bar script executed successfully');

      // Re-inject after delays to ensure it's visible
      setTimeout(async () => {
        try {
          const currentUrl = window.webContents.getURL();
          if (currentUrl.includes('youtube.com')) {
            console.log('[BrowserUI] Re-injecting after 1s...');
            await window.webContents.executeJavaScript(script, true);
          }
        } catch (err) {
          console.error('[BrowserUI] Error re-injecting script:', err);
        }
      }, 1000);

      setTimeout(async () => {
        try {
          const currentUrl = window.webContents.getURL();
          if (currentUrl.includes('youtube.com')) {
            console.log('[BrowserUI] Re-injecting after 3s...');
            await window.webContents.executeJavaScript(script, true);
          }
        } catch (err) {
          console.error('[BrowserUI] Error re-injecting script:', err);
        }
      }, 3000);
    } catch (error) {
      console.error('[BrowserUI] ❌ Error injecting script:', error);
      console.error('[BrowserUI] Error stack:', error instanceof Error ? error.stack : 'No stack');
    }
  }

  public getConfig(): any {
    const baseConfig = super.getConfig();
    const config = {
      ...baseConfig,
      enabled: baseConfig.enabled !== false, // Default to enabled if not explicitly set
    };
    console.log('[BrowserUI] getConfig() called, returning:', config);
    return config;
  }
}

