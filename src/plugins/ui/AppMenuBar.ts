import { BrowserWindow } from 'electron';
import { BasePlugin } from '../Plugin';
import type { PluginMetadata } from '../Plugin';

/**
 * App Menu Bar Plugin
 * Injects a menu bar at the top of the YouTube page
 */
export class AppMenuBar extends BasePlugin {
  public metadata: PluginMetadata = {
    name: 'app-menu-bar',
    description: 'Menu bar integrated on YouTube page (Plugins, Options, View, Navigation, About)',
    version: '1.0.0',
  };

  private getRendererScript(): string {
    return `
      (function() {
        'use strict';
        
        let menuBar = null;
        let activeDropdown = null;
        
        function createMenuBar() {
          if (!document.body || !(document.body instanceof Node)) {
            setTimeout(createMenuBar, 100);
            return;
          }
          
          try {
            // Remove existing menu bar if present
            const existing = document.getElementById('better-youtube-menu-bar');
            if (existing) existing.remove();
            
            // Create menu bar container
            menuBar = document.createElement('div');
            menuBar.id = 'better-youtube-menu-bar';
            menuBar.style.cssText = \`
              position: fixed;
              top: 38px;
              left: 0;
              right: 0;
              height: 40px;
              background: #212121;
              border-bottom: 1px solid #303030;
              z-index: 999998;
              display: flex;
              align-items: center;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
              font-size: 14px;
              color: #f1f1f1;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            \`;
            
            // Menu items
            const menuItems = [
              { label: 'Plugins', action: 'plugins' },
              { label: 'Options', action: 'options' },
              { label: 'View', action: 'view' },
              { label: 'Navigation', action: 'navigation' },
              { label: 'About', action: 'about' }
            ];
            
            menuItems.forEach(item => {
              const menuItem = document.createElement('div');
              menuItem.textContent = item.label;
              menuItem.className = 'menu-bar-item';
              menuItem.style.cssText = \`
                padding: 8px 16px;
                cursor: pointer;
                user-select: none;
                transition: background 0.2s;
                position: relative;
              \`;
              
              menuItem.addEventListener('mouseenter', () => {
                menuItem.style.background = '#303030';
              });
              
              menuItem.addEventListener('mouseleave', () => {
                if (activeDropdown !== menuItem) {
                  menuItem.style.background = 'transparent';
                }
              });
              
              menuItem.addEventListener('click', (e) => {
                e.stopPropagation();
                handleMenuClick(item.action, menuItem);
              });
              
              menuBar.appendChild(menuItem);
            });
            
            // Insert at the top of body
            document.body.insertBefore(menuBar, document.body.firstChild);
            
            // Adjust YouTube's layout to account for menu bar
            const style = document.createElement('style');
            style.id = 'better-youtube-menu-bar-styles';
            style.textContent = \`
              body {
                padding-top: 78px !important; /* 38px (TitleBar) + 40px (MenuBar) */
              }
              
              ytd-app {
                margin-top: 78px !important;
              }

              /* Fix Sidebar / Guide Position */
              tp-yt-app-drawer#guide,
              ytd-mini-guide-renderer,
              ytd-guide-renderer#guide-renderer,
              #guide.ytd-app {
                top: calc(78px + 56px) !important; /* TitleBar + MenuBar + Masthead */
              }
              
              /* Fix Masthead Position */
              #masthead-container,
              ytd-masthead {
                top: 78px !important;
              }
              
              #better-youtube-menu-bar .menu-bar-item:hover {
                background: #303030;
              }
              
              #better-youtube-menu-bar .menu-bar-item.active {
                background: #303030;
                border-bottom: 2px solid #3ea6ff;
              }
              
              /* Hide menu bar in fullscreen */
              :fullscreen #better-youtube-menu-bar,
              :-webkit-full-screen #better-youtube-menu-bar,
              :-moz-full-screen #better-youtube-menu-bar,
              :-ms-fullscreen #better-youtube-menu-bar {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                pointer-events: none !important;
              }
              
              :fullscreen body,
              :-webkit-full-screen body,
              :-moz-full-screen body,
              :-ms-fullscreen body {
                padding-top: 0 !important;
              }
              
              :fullscreen ytd-app,
              :-webkit-full-screen ytd-app,
              :-moz-full-screen ytd-app,
              :-ms-fullscreen ytd-app {
                margin-top: 0 !important;
              }
              
              /* Additional fullscreen selectors */
              html:fullscreen #better-youtube-menu-bar,
              html:-webkit-full-screen #better-youtube-menu-bar,
              html:-moz-full-screen #better-youtube-menu-bar {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                pointer-events: none !important;
              }
            \`;
            
            if (!document.getElementById('better-youtube-menu-bar-styles')) {
              document.head.appendChild(style);
            }
            
            // Listen for fullscreen changes with multiple methods
            const fullscreenEvents = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];
            fullscreenEvents.forEach(event => {
              document.addEventListener(event, updateMenuBarVisibility);
              document.documentElement.addEventListener(event, updateMenuBarVisibility);
            });
            
            // Also watch for video player fullscreen (YouTube's own fullscreen)
            const videoObserver = new MutationObserver(() => {
              updateMenuBarVisibility();
            });
            
            // Watch for fullscreen class changes
            const classObserver = new MutationObserver((mutations) => {
              mutations.forEach(mutation => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                  updateMenuBarVisibility();
                }
              });
            });
            
            if (document.documentElement) {
              classObserver.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ['class']
              });
            }
            
            // Check periodically as backup
            const fullscreenCheck = setInterval(() => {
              updateMenuBarVisibility();
            }, 200);
            
            // Clean up on page unload
            window.addEventListener('beforeunload', () => {
              clearInterval(fullscreenCheck);
            });
            
          } catch (error) {
            console.error('Error creating menu bar:', error);
          }
        }
        
        function updateMenuBarVisibility() {
          if (!menuBar) return;
          
          // Check all possible fullscreen states
          const fullscreenElement = document.fullscreenElement || 
            document.webkitFullscreenElement || 
            document.mozFullScreenElement ||
            document.msFullscreenElement;
          
          const isNativeFullscreen = !!fullscreenElement;
          
          // Check YouTube's video player fullscreen
          const video = document.querySelector('video');
          const isVideoFullscreen = video && (
            video.classList.contains('ytp-fullscreen') ||
            document.querySelector('.ytp-fullscreen') ||
            document.querySelector('.html5-video-player.ytp-fullscreen')
          );
          
          // Check body/html classes
          const hasFullscreenClass = document.body && (
            document.body.classList.contains('fullscreen') ||
            document.documentElement.classList.contains('fullscreen')
          );
          
          const isFullscreen = isNativeFullscreen || isVideoFullscreen || hasFullscreenClass;
          
          // Force hide with multiple methods
          if (isFullscreen) {
            menuBar.style.cssText += \`
              display: none !important;
              visibility: hidden !important;
              opacity: 0 !important;
              pointer-events: none !important;
              height: 0 !important;
              overflow: hidden !important;
            \`;
            menuBar.setAttribute('data-fullscreen', 'true');
          } else {
            menuBar.style.cssText = menuBar.style.cssText.replace(/display:\s*none\s*!important/g, '');
            menuBar.style.display = 'flex';
            menuBar.style.visibility = 'visible';
            menuBar.style.opacity = '1';
            menuBar.style.pointerEvents = 'auto';
            menuBar.style.height = '40px';
            menuBar.style.overflow = 'visible';
            menuBar.removeAttribute('data-fullscreen');
          }
        }
        
        function handleMenuClick(action, menuItem) {
          // Remove active class from all items
          const items = menuBar?.querySelectorAll('.menu-bar-item');
          items?.forEach(item => item.classList.remove('active'));
          menuItem.classList.add('active');
          
          switch (action) {
            case 'plugins':
              if (window.electronAPI && window.electronAPI.openSettings) {
                window.electronAPI.openSettings();
              }
              break;
            case 'options':
              if (window.electronAPI && window.electronAPI.openSettings) {
                window.electronAPI.openSettings();
              }
              break;
            case 'view':
              showViewMenu(menuItem);
              break;
            case 'navigation':
              showNavigationMenu(menuItem);
              break;
            case 'about':
              showAboutDialog();
              break;
          }
        }
        
        function showViewMenu(menuItem) {
          const menu = createDropdownMenu([
            { label: 'Reload', action: () => window.location.reload() },
            { label: 'Force Reload', action: () => window.location.reload() },
            { type: 'separator' },
            { label: 'Zoom In', action: () => {
              const currentZoom = window.zoomLevel || 0;
              window.zoomLevel = currentZoom + 0.1;
            }},
            { label: 'Zoom Out', action: () => {
              const currentZoom = window.zoomLevel || 0;
              window.zoomLevel = currentZoom - 0.1;
            }},
            { label: 'Actual Size', action: () => {
              window.zoomLevel = 0;
            }},
            { type: 'separator' },
            { label: 'Toggle Full Screen', action: () => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
              } else {
                document.exitFullscreen();
              }
            }}
          ], menuItem);
        }
        
        function showNavigationMenu(menuItem) {
          const menu = createDropdownMenu([
            { label: 'Go back', action: () => window.history.back() },
            { label: 'Go forward', action: () => window.history.forward() },
            { label: 'Copy current URL', action: () => {
              navigator.clipboard.writeText(window.location.href);
            }},
            { type: 'separator' },
            { label: 'Restart App', action: () => {
              if (window.electronAPI && window.electronAPI.windowAction) {
                window.electronAPI.windowAction('restart');
              }
            }},
            { label: 'Exit', action: () => {
              if (window.electronAPI && window.electronAPI.windowAction) {
                window.electronAPI.windowAction('close');
              }
            }}
          ], menuItem);
        }
        
function showAboutDialog() {
          window.electronAPI.getAppVersion().then(version => {
            const dialog = document.createElement('div');
            dialog.style.position = 'fixed';
            dialog.style.top = '50%';
            dialog.style.left = '50%';
            dialog.style.transform = 'translate(-50%, -50%)';
            dialog.style.background = '#212121';
            dialog.style.border = '1px solid #303030';
            dialog.style.borderRadius = '8px';
            dialog.style.padding = '30px';
            dialog.style.zIndex = '1000000';
            dialog.style.maxWidth = '400px';
            dialog.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.5)';

            const title = document.createElement('h2');
            title.textContent = 'Better YouTube Music';
            title.style.color = '#f1f1f1';
            title.style.marginBottom = '10px';
            title.style.fontSize = '20px';

            const versionP = document.createElement('p');
            versionP.textContent = 'Version ' + version;
            versionP.style.color = '#aaa';
            versionP.style.marginBottom = '8px';
            versionP.style.fontSize = '14px';

            const description = document.createElement('p');
            description.textContent = 'Open Source YouTube Desktop Client with Plugin System';
            description.style.color = '#aaa';
            description.style.marginBottom = '20px';
            description.style.fontSize = '14px';

            const closeButton = document.createElement('button');
            closeButton.id = 'close-about';
            closeButton.textContent = 'Close';
            closeButton.style.padding = '8px 16px';
            closeButton.style.background = '#3ea6ff';
            closeButton.style.color = 'white';
            closeButton.style.border = 'none';
            closeButton.style.borderRadius = '4px';
            closeButton.style.cursor = 'pointer';
            closeButton.style.fontSize = '14px';

            dialog.appendChild(title);
            dialog.appendChild(versionP);
            dialog.appendChild(description);
            dialog.appendChild(closeButton);
            
            document.body.appendChild(dialog);
            
            closeButton.addEventListener('click', () => {
              dialog.remove();
            });
            
            // Close on outside click
            dialog.addEventListener('click', (e) => {
              if (e.target === dialog) {
                dialog.remove();
              }
            });
          });
        }
        
        function createDropdownMenu(items, parentItem) {
          // Remove existing dropdown
          const existing = document.getElementById('better-youtube-dropdown');
          if (existing) existing.remove();
          
          const dropdown = document.createElement('div');
          dropdown.id = 'better-youtube-dropdown';
          dropdown.style.cssText = \`
            position: absolute;
            top: 100%;
            left: 0;
            background: #212121;
            border: 1px solid #303030;
            border-radius: 4px;
            min-width: 200px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 1000000;
            margin-top: 2px;
          \`;
          
          items.forEach(item => {
            if (item.type === 'separator') {
              const separator = document.createElement('div');
              separator.style.cssText = \`
                height: 1px;
                background: #303030;
                margin: 4px 0;
              \`;
              dropdown.appendChild(separator);
            } else {
              const menuItem = document.createElement('div');
              menuItem.textContent = item.label;
              menuItem.style.cssText = \`
                padding: 12px 16px;
                cursor: pointer;
                color: #f1f1f1;
                font-size: 14px;
                transition: background 0.2s;
              \`;
              
              menuItem.addEventListener('mouseenter', () => {
                menuItem.style.background = '#303030';
              });
              
              menuItem.addEventListener('mouseleave', () => {
                menuItem.style.background = 'transparent';
              });
              
              menuItem.addEventListener('click', () => {
                if (item.action) item.action();
                dropdown.remove();
                activeDropdown = null;
                parentItem.classList.remove('active');
              });
              
              dropdown.appendChild(menuItem);
            }
          });
          
          parentItem.style.position = 'relative';
          parentItem.appendChild(dropdown);
          activeDropdown = parentItem;
          
          // Close on outside click
          setTimeout(() => {
            const closeDropdown = (e) => {
              if (!dropdown.contains(e.target as Node) && !parentItem.contains(e.target as Node)) {
                dropdown.remove();
                activeDropdown = null;
                parentItem.classList.remove('active');
                document.removeEventListener('click', closeDropdown);
              }
            };
            document.addEventListener('click', closeDropdown);
          }, 0);
          
          return dropdown;
        }
        
        // Initialize
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', createMenuBar);
        } else {
          createMenuBar();
        }
        
        // Re-inject on navigation
        let lastUrl = location.href;
        const observer = new MutationObserver(() => {
          const url = location.href;
          if (url !== lastUrl) {
            lastUrl = url;
            setTimeout(createMenuBar, 500);
          }
        });
        
        observer.observe(document, { subtree: true, childList: true });
      })();
    `;
  }

  public async onRendererLoaded(window: BrowserWindow): Promise<void> {
    if (!this.isEnabled()) return;

    try {
      await window.webContents.executeJavaScript(this.getRendererScript(), true);
      console.log('AppMenuBar: Injected successfully');
    } catch (error) {
      console.error('AppMenuBar: Error injecting script', error);
    }
  }

  public getConfig(): any {
    return {
      ...super.getConfig(),
      enabled: true,
    };
  }
}

