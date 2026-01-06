import { BrowserWindow } from 'electron';
import { BasePlugin } from '../Plugin';
import type { PluginMetadata } from '../Plugin';

/**
 * Volume Booster Plugin
 * Amplifies volume up to 10x using Web Audio API
 */
export class VolumeBooster extends BasePlugin {
  public metadata: PluginMetadata = {
    name: 'volume-booster',
    description: 'Boost volume up to 10x (1000%)',
    version: '1.0.0',
  };

  private getRendererScript(): string {
    const config = JSON.stringify(this.getConfig());
    return `
    (function() {
      'use strict';
      
      const config = ${config};
      if (!config.enabled) return;

      console.log('[VolumeBooster] Initializing...');

      let audioContext = null;
      let sourceNode = null;
      let gainNode = null;
      let isHooked = false;

      // Initialize Web Audio API
      function initAudio() {
        if (isHooked) return;
        
        const video = document.querySelector('video');
        if (!video) return;

        try {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (!AudioContext) return;

          if (!audioContext) audioContext = new AudioContext();

          if (!video.__volumeBoosterAttached) {
             sourceNode = audioContext.createMediaElementSource(video);
             gainNode = audioContext.createGain();
             
             sourceNode.connect(gainNode);
             gainNode.connect(audioContext.destination);
             
             video.__volumeBoosterAttached = true;
             video.__gainNode = gainNode;
             isHooked = true;
          } else {
             gainNode = video.__gainNode;
             isHooked = true;
          }
        } catch (e) {
          console.error('[VolumeBooster] Error initializing audio:', e);
        }
      }

      function injectIntoTitleBar() {
        // Target the new button container from BrowserUI
        const container = document.getElementById('browser-ui-buttons');
        if (!container) return;
        
        if (document.getElementById('volume-booster-btn')) return;

        // Try to insert before the divider (separating nav from settings)
        // If no divider, insert before settings button, or just append
        let referenceNode = container.querySelector('.divider');
        if (!referenceNode) {
          referenceNode = container.querySelector('.settings-btn');
        }

        const btn = document.createElement('button');
        btn.id = 'volume-booster-btn';
        btn.className = 'nav-btn'; // Re-use nav-btn class from BrowserUI
        btn.title = 'Volume Boost';
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>';
        
        // Match style with BrowserUI buttons
        // Note: .nav-btn class in BrowserUI handles most styles (hover, transition)
        // We just ensure specific overrides if needed
        btn.style.cssText = \`
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          transition: all 0.15s ease;
          padding: 0;
          outline: none;
          position: relative;
          -webkit-app-region: no-drag;
        \`;

        btn.addEventListener('mouseenter', () => {
          btn.style.background = 'rgba(255, 255, 255, 0.1)';
          btn.style.color = '#fff';
          showVolumeDropdown(btn);
        });

        btn.addEventListener('mouseleave', () => {
           btn.style.background = 'transparent';
           btn.style.color = 'rgba(255, 255, 255, 0.7)';
           // Let dropdown logic handle closing
        });
        
        btn.addEventListener('mousedown', () => {
           btn.style.transform = 'scale(0.92)';
        });
        
        btn.addEventListener('mouseup', () => {
           btn.style.transform = 'scale(1)';
        });

        // Insert at correct position
        if (referenceNode) {
          container.insertBefore(btn, referenceNode);
        } else {
          container.appendChild(btn);
        }
        
        // Init audio
        initAudio();
      }

      function showVolumeDropdown(parentItem) {
         if (document.getElementById('volume-booster-dropdown')) return;
         
         const dropdown = document.createElement('div');
         dropdown.id = 'volume-booster-dropdown';
         dropdown.style.cssText = \`
            position: fixed; /* Fixed relative to window since title bar is fixed */
            top: 38px; /* Height of title bar */
            right: 120px; /* Approximate position, will adjust dynamically */
            background: #212121;
            border: 1px solid #303030;
            border-radius: 8px;
            padding: 15px;
            min-width: 200px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
            z-index: 1000000;
            display: flex;
            flex-direction: column;
            gap: 10px;
         \`;
         
         // Calculate position dynamically
         const rect = parentItem.getBoundingClientRect();
         dropdown.style.left = (rect.left - 100) + 'px'; // Center-ish or align
         dropdown.style.top = (rect.bottom + 5) + 'px';
         dropdown.style.right = 'auto';

         const title = document.createElement('div');
         title.textContent = 'Volume Multiplier';
         title.style.fontSize = '12px';
         title.style.color = '#aaa';
         title.style.fontWeight = '600';
         title.style.textTransform = 'uppercase';
         title.style.letterSpacing = '0.5px';
         
         const sliderContainer = document.createElement('div');
         sliderContainer.style.display = 'flex';
         sliderContainer.style.alignItems = 'center';
         sliderContainer.style.gap = '10px';
         
         const slider = document.createElement('input');
         slider.type = 'range';
         slider.min = '1';
         slider.max = '10';
         slider.step = '0.1';
         slider.value = (gainNode && gainNode.gain.value) || '1';
         slider.style.width = '100%';
         slider.style.accentColor = '#a855f7'; // Match purple theme
         
         const label = document.createElement('span');
         label.textContent = Math.round(slider.value * 100) + '%';
         label.style.minWidth = '45px';
         label.style.textAlign = 'right';
         label.style.fontSize = '12px';
         label.style.fontVariantNumeric = 'tabular-nums';
         
         slider.oninput = (e) => {
            const val = parseFloat(e.target.value);
            if (gainNode) gainNode.gain.value = val;
            label.textContent = Math.round(val * 100) + '%';
            
            if (audioContext && audioContext.state === 'suspended') {
                audioContext.resume();
            }
            if (!isHooked) initAudio();
         };
         
         sliderContainer.appendChild(slider);
         sliderContainer.appendChild(label);
         
         // Scroll to change volume
         sliderContainer.addEventListener('wheel', (e) => {
            e.preventDefault();
            const current = parseFloat(slider.value);
            // Scroll Up (deltaY < 0) = Increase, Scroll Down (deltaY > 0) = Decrease
            const delta = e.deltaY < 0 ? 0.1 : -0.1;
            let newVal = current + delta;
            
            // Clamp between 1 and 10
            newVal = Math.min(Math.max(newVal, 1), 10);
            
            // Apply if changed
            if (newVal !== current) {
                slider.value = newVal.toString();
                // Trigger input event to update gain
                slider.dispatchEvent(new Event('input'));
            }
         });
         
         dropdown.appendChild(title);
         dropdown.appendChild(sliderContainer);
         
         document.body.appendChild(dropdown); // Append to body to avoid clipping
         
         // Cleanup logic
         let isHoveringDropdown = false;
         
         dropdown.addEventListener('mouseenter', () => isHoveringDropdown = true);
         dropdown.addEventListener('mouseleave', () => {
             isHoveringDropdown = false;
             dropdown.remove();
         });
         
         parentItem.addEventListener('mouseleave', () => {
             setTimeout(() => {
                 if (!isHoveringDropdown) dropdown.remove();
             }, 100);
         });
      }

      // Main loop
      const interval = setInterval(() => {
         injectIntoTitleBar();
      }, 1000);
      
      // Initial try
      injectIntoTitleBar();

    })();
    `;
  }

  public async onRendererLoaded(window: BrowserWindow): Promise<void> {
    if (!this.isEnabled()) return;
    await this.injectRendererScript(window, this.getRendererScript());
  }
}
