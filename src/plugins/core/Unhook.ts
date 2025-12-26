import { BasePlugin } from '../Plugin';
import type { PluginMetadata } from '../Plugin';
import { BrowserWindow } from 'electron';

/**
 * Unhook Plugin
 * Removes YouTube recommendations, shorts, comments, and other distractions
 */
export class Unhook extends BasePlugin {
  public metadata: PluginMetadata = {
    name: 'unhook',
    description: 'Remove YouTube recommendations, shorts, comments, and distractions',
    version: '1.0.0',
  };

  private getRendererScript(): string {
    const config = JSON.stringify(this.getConfig());
    return `
      (function() {
        const config = ${config};
        if (!config.enabled) return;
        
        function injectUnhookCSS() {
          const styleId = 'unhook-styles';
          let style = document.getElementById(styleId);
          
          if (!style) {
            style = document.createElement('style');
            style.id = styleId;
            document.head.appendChild(style);
          }
          
          // Build CSS based on config
          let css = '';
          
          // Hide Homepage Feed (only hide the grid, not the entire page structure)
          if (config.hideHomeFeed === true) {
            css += \`
              ytd-rich-grid-renderer #contents,
              ytd-rich-grid-renderer ytd-rich-item-renderer {
                display: none !important;
              }
            \`;
          }
          
          // Hide Video Sidebar (Recommended) - only on watch pages
          if (config.hideSidebar === true) {
            css += \`
              ytd-watch-flexy #secondary,
              ytd-watch-flexy #related {
                display: none !important;
              }
            \`;
          }
          
          // Hide Recommended (Related Videos) - only on watch pages
          if (config.hideRecommended === true) {
            css += \`
              ytd-watch-next-secondary-results-renderer,
              ytd-watch-flexy #related {
                display: none !important;
              }
            \`;
          }
          
          // Hide Comments - only on watch pages
          if (config.hideComments === true) {
            css += \`
              ytd-watch-flexy #comments,
              ytd-watch-flexy ytd-comments {
                display: none !important;
              }
            \`;
          }
          
          // Hide YouTube Shorts - be more specific
          if (config.hideShorts === true) {
            css += \`
              ytd-rich-shelf-renderer[is-shorts] #contents,
              ytd-reel-shelf-renderer,
              #shorts-container {
                display: none !important;
              }
            \`;
          }
          
          // Hide End Screen Videowall
          if (config.hideEndScreen === true) {
            css += \`
              .ytp-endscreen-content,
              .ytp-videowall-still {
                display: none !important;
              }
            \`;
          }
          
          // Disable Autoplay
          if (config.disableAutoplay === true) {
            css += \`
              .ytp-autoplay-overlay {
                display: none !important;
              }
            \`;
          }
          
          style.textContent = css;
        }
        
        function init() {
          injectUnhookCSS();
        }
        
        // Run on page load
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', init);
        } else {
          init();
        }
        
        // Re-inject on navigation
        let lastUrl = location.href;
        const observer = new MutationObserver(() => {
          const url = location.href;
          if (url !== lastUrl) {
            lastUrl = url;
            setTimeout(init, 500);
          }
        });
        
        observer.observe(document, { subtree: true, childList: true });
        
        // Also re-inject when DOM changes (YouTube is very dynamic)
        const domObserver = new MutationObserver(() => {
          init();
        });
        
        domObserver.observe(document.body || document.documentElement, {
          childList: true,
          subtree: true
        });
      })();
    `;
  }

  public async onRendererLoaded(window: BrowserWindow): Promise<void> {
    if (!this.isEnabled()) return;

    try {
      await window.webContents.executeJavaScript(this.getRendererScript(), true);
      console.log('Unhook: Injected successfully');
    } catch (error) {
      console.error('Unhook: Error injecting script', error);
    }
  }

  public getConfig(): any {
    return {
      ...super.getConfig(),
      enabled: false, // Default to disabled
      hideHomeFeed: false,
      hideSidebar: false,
      hideRecommended: false,
      hideComments: false,
      hideShorts: false,
      hideEndScreen: false,
      disableAutoplay: false,
    };
  }
}

