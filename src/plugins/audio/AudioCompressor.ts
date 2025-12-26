import { BrowserWindow } from 'electron';
import { BasePlugin } from '../Plugin';
import type { PluginMetadata } from '../Plugin';

/**
 * Audio Compressor Plugin
 * Applies audio compression using Web Audio API
 */
export class AudioCompressor extends BasePlugin {
  public metadata: PluginMetadata = {
    name: 'audio-compressor',
    description: 'Audio compression and dynamic range control',
    version: '1.0.0',
  };

  private getRendererScript(): string {
    const config = JSON.stringify(this.getConfig());
    return `
    (function() {
      'use strict';
      
      const config = ${config};
      if (!config.enabled) return;
      
      let audioContext = null;
      let compressor = null;
      let sourceNode = null;
      let mediaElementSource = null;
      
      // Initialize audio context
      function initAudioContext() {
        if (audioContext) return;
        
        try {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          audioContext = new AudioContext();
          
          // Create compressor node
          compressor = audioContext.createDynamicsCompressor();
          compressor.threshold.value = config.threshold || -24;
          compressor.knee.value = config.knee || 30;
          compressor.ratio.value = config.ratio || 12;
          compressor.attack.value = config.attack || 0.003;
          compressor.release.value = config.release || 0.25;
          
          compressor.connect(audioContext.destination);
        } catch (error) {
          console.error('AudioCompressor: Error initializing', error);
        }
      }
      
      // Connect video to compressor
      function connectVideo(video) {
        if (!audioContext || !video || mediaElementSource) return;
        
        try {
          if (sourceNode) {
            sourceNode.disconnect();
          }
          
          mediaElementSource = audioContext.createMediaElementSource(video);
          sourceNode = mediaElementSource;
          
          // Connect: video -> compressor -> destination
          sourceNode.connect(compressor);
        } catch (error) {
          console.error('AudioCompressor: Error connecting video', error);
          mediaElementSource = null;
        }
      }
      
      // Update compressor settings
      function updateCompressor() {
        if (!compressor) return;
        compressor.threshold.value = config.threshold || -24;
        compressor.knee.value = config.knee || 30;
        compressor.ratio.value = config.ratio || 12;
        compressor.attack.value = config.attack || 0.003;
        compressor.release.value = config.release || 0.25;
      }
      
      // Initialize
      function init() {
        const video = document.querySelector('video');
        if (!video) return;
        
        initAudioContext();
        
        if (audioContext && audioContext.state === 'suspended') {
          const resume = () => {
            audioContext.resume();
            document.removeEventListener('click', resume);
            document.removeEventListener('touchstart', resume);
          };
          document.addEventListener('click', resume);
          document.addEventListener('touchstart', resume);
        }
        
        connectVideo(video);
        updateCompressor();
      }
      
      // Watch for video element with debouncing
      let checkVideoTimeout: any = null;
      function checkForVideo() {
        if (checkVideoTimeout) return;
        checkVideoTimeout = setTimeout(() => {
          checkVideoTimeout = null;
          const video = document.querySelector('video');
          if (video && !mediaElementSource) {
            init();
          }
        }, 500); // Debounce video checks
      }
      
      function setupObserver() {
        if (!document.body || !(document.body instanceof Node)) {
          setTimeout(setupObserver, 500);
          return;
        }
        
        try {
          // Only observe player container, not entire body
          const playerContainer = document.querySelector('ytd-watch-flexy, #player-container');
          const target = playerContainer || document.body;
          
          const observer = new MutationObserver(checkForVideo);
          observer.observe(target, {
            childList: true,
            subtree: playerContainer ? true : false // Only subtree if we found player container
          });
        } catch (error) {
          console.error('AudioCompressor: Observer error', error);
        }
      }
      
      function startPlugin() {
        if (!document.body) {
          setTimeout(startPlugin, 100);
          return;
        }
        setTimeout(init, 1000);
        setupObserver();
      }
      
      // Re-initialize on navigation (use events instead of MutationObserver)
      let lastUrl = location.href;
      const checkNavigation = () => {
        const currentUrl = location.href;
        if (currentUrl !== lastUrl) {
          lastUrl = currentUrl;
          mediaElementSource = null;
          setTimeout(init, 1000);
        }
      };
      
      window.addEventListener('popstate', checkNavigation);
      window.addEventListener('hashchange', checkNavigation);
      setInterval(checkNavigation, 2000); // Fallback check
      
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          setTimeout(startPlugin, 100);
          setTimeout(setupNavigationObserver, 200);
        });
      } else {
        setTimeout(startPlugin, 100);
        setTimeout(setupNavigationObserver, 200);
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
      threshold: -24, // dB
      knee: 30, // dB
      ratio: 12, // Compression ratio
      attack: 0.003, // seconds
      release: 0.25, // seconds
      ...super.getConfig(),
    };
  }
}

