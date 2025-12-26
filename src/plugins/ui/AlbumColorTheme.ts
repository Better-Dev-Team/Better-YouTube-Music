import { BrowserWindow } from 'electron';
import { BasePlugin } from '../Plugin';
import type { PluginMetadata } from '../Plugin';

/**
 * Album Color Theme Plugin
 * Extracts dominant colors from album art/video thumbnails and applies them to the UI
 */
export class AlbumColorTheme extends BasePlugin {
  public metadata: PluginMetadata = {
    name: 'album-color-theme',
    description: 'Extract colors from album art to theme the UI',
    version: '1.0.0',
  };

  private getRendererScript(): string {
    const config = JSON.stringify(this.getConfig());
    return `
    (function() {
      'use strict';
      
      const config = ${config};
      if (!config.enabled) return;
      
      // Color extraction using canvas
      function extractColors(imageUrl) {
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            // Simple color extraction - get dominant color
            const colorCounts = {};
            const sampleSize = 100; // Sample every Nth pixel
            
            for (let i = 0; i < data.length; i += sampleSize * 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              const key = \`\${Math.floor(r/10)*10},\${Math.floor(g/10)*10},\${Math.floor(b/10)*10}\`;
              colorCounts[key] = (colorCounts[key] || 0) + 1;
            }
            
            // Find dominant color
            let maxCount = 0;
            let dominantColor = 'rgb(0, 0, 0)';
            for (const [color, count] of Object.entries(colorCounts)) {
              if (count > maxCount) {
                maxCount = count;
                dominantColor = \`rgb(\${color})\`;
              }
            }
            
            // Calculate complementary colors
            const rgb = dominantColor.match(/\\d+/g).map(Number);
            const complementary = rgb.map(c => 255 - c);
            const light = rgb.map(c => Math.min(255, c + 50));
            const dark = rgb.map(c => Math.max(0, c - 50));
            
            resolve({
              dominant: dominantColor,
              complementary: \`rgb(\${complementary.join(',')})\`,
              light: \`rgb(\${light.join(',')})\`,
              dark: \`rgb(\${dark.join(',')})\`,
            });
          };
          img.onerror = () => resolve(null);
          img.src = imageUrl;
        });
      }
      
      // Apply theme colors
      function applyTheme(colors) {
        if (!colors) return;
        
        const style = document.createElement('style');
        style.id = 'album-color-theme';
        style.textContent = \`
          :root {
            --yt-theme-dominant: \${colors.dominant};
            --yt-theme-complementary: \${colors.complementary};
            --yt-theme-light: \${colors.light};
            --yt-theme-dark: \${colors.dark};
          }
          
          ytd-watch-flexy #player-container {
            background: linear-gradient(135deg, \${colors.dominant}22, \${colors.complementary}22);
          }
          
          ytd-watch-flexy #player-container-inner {
            border-color: \${colors.dominant};
          }
        \`;
        
        const existing = document.getElementById('album-color-theme');
        if (existing) existing.remove();
        document.head.appendChild(style);
      }
      
      // Watch for video changes with debouncing
      let checkThumbnailTimeout: any = null;
      let lastThumbnailSrc = '';
      const checkThumbnail = () => {
        if (checkThumbnailTimeout) return;
        checkThumbnailTimeout = setTimeout(() => {
          checkThumbnailTimeout = null;
          const thumbnail = document.querySelector('ytd-watch-flexy img, ytd-video-primary-info-renderer img');
          if (thumbnail && thumbnail.src && thumbnail.src !== lastThumbnailSrc) {
            lastThumbnailSrc = thumbnail.src;
            extractColors(thumbnail.src).then(applyTheme);
          }
        }, 500); // Debounce thumbnail checks
      };
      
      function watchVideo() {
        if (!document.body || !(document.body instanceof Node)) {
          setTimeout(watchVideo, 500);
          return;
        }
        
        try {
          // Only observe video info area, not entire body
          const videoInfo = document.querySelector('ytd-watch-flexy, ytd-video-primary-info-renderer');
          const target = videoInfo || document.body;
          
          const observer = new MutationObserver(checkThumbnail);
          observer.observe(target, {
            childList: true,
            subtree: videoInfo ? true : false
          });
        } catch (error) {
          console.error('AlbumColorTheme: Observer error', error);
        }
        
        // Initial check
        setTimeout(() => {
          const thumbnail = document.querySelector('ytd-watch-flexy img, ytd-video-primary-info-renderer img');
          if (thumbnail && thumbnail.src) {
            lastThumbnailSrc = thumbnail.src;
            extractColors(thumbnail.src).then(applyTheme);
          }
        }, 1000);
      }
      
      // Wait for DOM
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          setTimeout(watchVideo, 100);
        });
      } else {
        setTimeout(watchVideo, 100);
      }
    })();
    `;
  }

  public async onRendererLoaded(window: BrowserWindow): Promise<void> {
    if (!this.isEnabled()) return;
    await this.injectRendererScript(window, this.getRendererScript());
  }

  public getConfig() {
    return {
      intensity: 0.3, // How much to apply the theme (0-1)
      ...super.getConfig(),
    };
  }
}

