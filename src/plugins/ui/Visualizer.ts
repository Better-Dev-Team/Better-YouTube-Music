import { BrowserWindow } from 'electron';
import { BasePlugin } from '../Plugin';
import type { PluginMetadata } from '../Plugin';

/**
 * Visualizer Plugin
 * Audio visualizer using Canvas and Web Audio API
 */
export class Visualizer extends BasePlugin {
  public metadata: PluginMetadata = {
    name: 'visualizer',
    description: 'Audio visualizer with customizable styles',
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
      let analyser = null;
      let dataArray = null;
      let canvas = null;
      let ctx = null;
      let animationFrame = null;
      let sourceNode = null;
      let barGradient = null;
      
      function initAudioContext() {
        if (audioContext) return;
        try {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          audioContext = new AudioContext();
          analyser = audioContext.createAnalyser();
          analyser.fftSize = config.fftSize || 256;
          dataArray = new Uint8Array(analyser.frequencyBinCount);
        } catch (error) {
          console.error('Visualizer: Error initializing audio context', error);
        }
      }
      
      function connectVideo(video) {
        if (!audioContext || !video || sourceNode) return;
        try {
          sourceNode = audioContext.createMediaElementSource(video);
          sourceNode.connect(analyser);
          analyser.connect(audioContext.destination);
        } catch (error) {
          console.error('Visualizer: Error connecting video', error);
        }
      }
      
      function createCanvas() {
        if (canvas) return;
        try {
          canvas = document.createElement('canvas');
          canvas.id = 'audio-visualizer';
          canvas.style.cssText = \`position: fixed; bottom: 0; left: 0; width: 100%; height: \${config.height || 100}px; z-index: 9998; pointer-events: none; opacity: \${config.opacity || 0.7};\`;
          document.body.appendChild(canvas);
          ctx = canvas.getContext('2d');
          canvas.width = canvas.offsetWidth;
          canvas.height = canvas.offsetHeight;
          
          barGradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
          barGradient.addColorStop(0, config.colorStart || '#ff0000');
          barGradient.addColorStop(1, config.colorEnd || '#00ff00');
        } catch (error) {
          console.error('Visualizer: Error creating canvas', error);
        }
      }
      
      function draw() {
        if (!analyser || !canvas || !ctx) return;
        analyser.getByteFrequencyData(dataArray);
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const barWidth = canvas.width / dataArray.length;
        let x = 0;
        
        ctx.fillStyle = barGradient;
        for (let i = 0; i < dataArray.length; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height;
          ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
          x += barWidth;
        }
        
        animationFrame = requestAnimationFrame(draw);
      }
      
      function init(video) {
        initAudioContext();
        createCanvas();
        connectVideo(video);
        
        if (audioContext && audioContext.state === 'suspended') {
          const resume = () => audioContext.resume();
          document.addEventListener('click', resume, { once: true });
        }
        
        if (!animationFrame) draw();
      }
      
      if (window.BetterYouTubeUtils) {
        window.BetterYouTubeUtils.onNavigation(() => {
          if (animationFrame) {
            cancelAnimationFrame(animationFrame);
            animationFrame = null;
          }
          sourceNode = null;
        });
        window.BetterYouTubeUtils.onVideoFound((video) => {
          setTimeout(() => init(video), 1000);
        });
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
      height: 100,
      opacity: 0.7,
      fftSize: 256,
      colorStart: '#ff0000',
      colorEnd: '#00ff00',
      ...super.getConfig(),
    };
  }
}

