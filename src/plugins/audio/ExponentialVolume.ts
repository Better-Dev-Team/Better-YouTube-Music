import { BrowserWindow } from 'electron';
import { BasePlugin } from '../Plugin';
import type { PluginMetadata } from '../Plugin';

/**
 * Exponential Volume Plugin
 * Logarithmic volume slider for more natural volume control
 */
export class ExponentialVolume extends BasePlugin {
  public metadata: PluginMetadata = {
    name: 'exponential-volume',
    description: 'Logarithmic volume slider for better volume control',
    version: '1.0.0',
  };

  private getRendererScript(): string {
    const config = JSON.stringify(this.getConfig());
    return `
    (function() {
      'use strict';
      
      const config = ${config};
      if (!config.enabled) return;
      
      // Convert linear volume (0-1) to exponential (more natural)
      function linearToExponential(linear) {
        // Use exponential curve: y = (e^(kx) - 1) / (e^k - 1)
        const k = config.curve || 3; // Steepness of curve
        return (Math.exp(k * linear) - 1) / (Math.exp(k) - 1);
      }
      
      // Convert exponential volume back to linear
      function exponentialToLinear(exponential) {
        const k = config.curve || 3;
        return Math.log(exponential * (Math.exp(k) - 1) + 1) / k;
      }
      
      // Override volume slider
      function overrideVolumeSlider() {
        const volumeSlider = document.querySelector('input[aria-label*="Volume"], .ytp-volume-panel input');
        if (!volumeSlider) return;
        
        // Store original value
        const originalValue = volumeSlider.value;
        
        // Convert to exponential scale
        const exponentialValue = linearToExponential(originalValue / 100);
        volumeSlider.value = exponentialValue * 100;
        
        // Override input handler
        volumeSlider.addEventListener('input', (e) => {
          const exponentialValue = e.target.value / 100;
          const linearValue = exponentialToLinear(exponentialValue);
          
          const video = document.querySelector('video');
          if (video) {
            video.volume = linearValue;
          }
        });
      }
      
      // Watch for volume slider with debouncing
      let checkSliderTimeout: any = null;
      const checkSlider = () => {
        if (checkSliderTimeout) return;
        checkSliderTimeout = setTimeout(() => {
          checkSliderTimeout = null;
          overrideVolumeSlider();
        }, 300); // Debounce slider checks
      };
      
      function setupObserver() {
        if (!document.body || !(document.body instanceof Node)) {
          setTimeout(setupObserver, 500);
          return;
        }
        
        try {
          // Only observe controls area, not entire body
          const controlsArea = document.querySelector('.ytp-chrome-bottom, ytd-watch-flexy');
          const target = controlsArea || document.body;
          
          const observer = new MutationObserver(checkSlider);
          observer.observe(target, {
            childList: true,
            subtree: controlsArea ? true : false
          });
        } catch (error) {
          console.error('ExponentialVolume: Observer error', error);
        }
      }
      
      function startPlugin() {
        if (!document.body) {
          setTimeout(startPlugin, 100);
          return;
        }
        setTimeout(overrideVolumeSlider, 1000);
        setupObserver();
      }
      
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          setTimeout(startPlugin, 100);
        });
      } else {
        setTimeout(startPlugin, 100);
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
      curve: 3, // Exponential curve steepness (higher = more exponential)
      ...super.getConfig(),
    };
  }
}

