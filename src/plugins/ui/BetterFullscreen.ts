import { BrowserWindow } from 'electron';
import { BasePlugin } from '../Plugin';
import type { PluginMetadata } from '../Plugin';

/**
 * Better Fullscreen Plugin
 * CSS/JS tweaks for improved fullscreen experience
 */
export class BetterFullscreen extends BasePlugin {
  public metadata: PluginMetadata = {
    name: 'better-fullscreen',
    description: 'Enhanced fullscreen experience with better controls',
    version: '1.0.0',
  };

  private getRendererScript(): string {
    const config = JSON.stringify(this.getConfig());
    return `
    (function() {
      'use strict';
      
      const config = ${config};
      if (!config.enabled) return;
      
      function injectStyles() {
        if (!document.head && !document.documentElement) {
          setTimeout(injectStyles, 100);
          return;
        }
        
        try {
          // Remove existing style if present
          const existing = document.getElementById('better-fullscreen-styles');
          if (existing) existing.remove();
          
          // Inject CSS
          const style = document.createElement('style');
          style.id = 'better-fullscreen-styles';
          const cssText = \`/* Hide UI elements in fullscreen */
        .ytp-chrome-top,
        .ytp-chrome-bottom {
          opacity: 0;
          transition: opacity 0.3s;
        }
        
        .ytp-chrome-top:hover,
        .ytp-chrome-bottom:hover {
          opacity: 1;
        }
        
        /* Better fullscreen video sizing */
        video.video-stream {
          object-fit: contain !important;
        }
        
        /* Hide sidebar in fullscreen */
        ytd-watch-flexy[theater] #secondary {
          display: none !important;
        }
        
        /* Custom fullscreen controls */
        .better-fullscreen-controls {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.8);
          padding: 10px 20px;
          border-radius: 25px;
          display: none;
          z-index: 10000;
        }
        
        .better-fullscreen-controls.visible {
          display: flex;
          gap: 15px;
          align-items: center;
        }\`;
          style.textContent = cssText;
          
          if (document.head) {
            document.head.appendChild(style);
          } else if (document.documentElement) {
            document.documentElement.appendChild(style);
          }
        } catch (error) {
          console.error('BetterFullscreen: Error injecting styles', error);
        }
      }
      
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          setTimeout(injectStyles, 100);
        });
      } else {
        setTimeout(injectStyles, 100);
      }
      
      // Enhanced fullscreen keyboard shortcuts
      document.addEventListener('keydown', (e) => {
        if (document.fullscreenElement) {
          const video = document.querySelector('video');
          if (!video) return;
          
          // Space: Play/Pause
          if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
            e.preventDefault();
            video.paused ? video.play() : video.pause();
          }
          
          // Arrow keys: Seek
          if (e.code === 'ArrowLeft') {
            e.preventDefault();
            video.currentTime -= 10;
          }
          if (e.code === 'ArrowRight') {
            e.preventDefault();
            video.currentTime += 10;
          }
          
          // F: Toggle fullscreen
          if (e.code === 'KeyF') {
            e.preventDefault();
            if (document.fullscreenElement) {
              document.exitFullscreen();
            } else {
              document.documentElement.requestFullscreen();
            }
          }
          
          // M: Mute/Unmute
          if (e.code === 'KeyM') {
            e.preventDefault();
            video.muted = !video.muted;
          }
        }
      });
      
      // Auto-hide controls in fullscreen
      let hideControlsTimeout;
      function resetHideControls() {
        clearTimeout(hideControlsTimeout);
        const controls = document.querySelector('.ytp-chrome-bottom');
        if (controls && document.fullscreenElement) {
          controls.style.opacity = '1';
          hideControlsTimeout = setTimeout(() => {
            if (document.fullscreenElement) {
              controls.style.opacity = '0';
            }
          }, 3000);
        }
      }
      
      document.addEventListener('mousemove', resetHideControls);
      document.addEventListener('fullscreenchange', () => {
        if (document.fullscreenElement) {
          resetHideControls();
        }
      });
    })();
    `;
  }

  public async onRendererLoaded(window: BrowserWindow): Promise<void> {
    if (!this.isEnabled()) return;
    await this.injectRendererScript(window, this.getRendererScript());
  }

  public getConfig() {
    return {
      autoHideControls: true,
      keyboardShortcuts: true,
      ...super.getConfig(),
    };
  }
}

