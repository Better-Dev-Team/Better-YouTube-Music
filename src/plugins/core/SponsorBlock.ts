import { BrowserWindow } from 'electron';
import { BasePlugin } from '../Plugin';
import type { PluginMetadata } from '../Plugin';

/**
 * SponsorBlock Plugin
 * Automatically skips sponsored segments in YouTube videos
 * Uses the SponsorBlock API: https://sponsor.ajay.app/
 */
export class SponsorBlock extends BasePlugin {
  public metadata: PluginMetadata = {
    name: 'sponsorblock',
    description: 'Automatically skips sponsored segments, intros, outros, and more',
    version: '1.0.0',
  };

  private getRendererScript(): string {
    const config = JSON.stringify(this.getConfig());
    return `
    (function() {
      'use strict';
      
      let segments = [];
      let skipButton = null;
      let skipTimeout = null;
      
      const config = ${config};
      
      // Get video ID from URL
      function getVideoId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('v');
      }
      
      // Fetch skip segments from SponsorBlock API
      async function fetchSegments(videoId) {
        try {
          const categories = config.categories || ['sponsor', 'intro', 'outro', 'selfpromo', 'interaction'];
          const actionTypes = config.actionTypes || ['skip', 'mute'];
          
          const params = new URLSearchParams({
            videoID: videoId,
            categories: JSON.stringify(categories),
            actionTypes: JSON.stringify(actionTypes)
          });
          
          const response = await fetch(\`https://sponsor.ajay.app/api/skipSegments?\${params}\`);
          if (response.ok) {
            const data = await response.json();
            return Array.isArray(data) ? data : [];
          }
        } catch (error) {
          console.error('SponsorBlock: Error fetching segments', error);
        }
        return [];
      }
      
      // Create skip button
      function createSkipButton() {
        if (skipButton) return;
        
        skipButton = document.createElement('button');
        skipButton.id = 'sponsorblock-skip';
        skipButton.textContent = '⏭️ Skip';
        skipButton.style.cssText = \`
          position: fixed;
          bottom: 100px;
          right: 20px;
          z-index: 9999;
          padding: 10px 20px;
          background: #00d400;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
          font-weight: bold;
          display: none;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        \`;
        
        skipButton.addEventListener('click', () => {
          skipSegment();
        });
        
        document.body.appendChild(skipButton);
      }
      
      // Skip current segment
      function skipSegment() {
        const video = document.querySelector('video');
        if (!video) return;
        
        const currentTime = video.currentTime;
        
        for (const segment of segments) {
          if (currentTime >= segment.segment[0] && currentTime < segment.segment[1]) {
            video.currentTime = segment.segment[1];
            hideSkipButton();
            break;
          }
        }
      }
      
      // Show skip button
      function showSkipButton(segment) {
        if (skipButton) {
          skipButton.textContent = \`⏭️ Skip \${segment.category || 'segment'}\`;
          skipButton.style.display = 'block';
        }
      }
      
      // Hide skip button
      function hideSkipButton() {
        if (skipButton) {
          skipButton.style.display = 'none';
        }
      }
      
      // Auto-skip segments
      function checkSegment() {
        const video = document.querySelector('video');
        if (!video || segments.length === 0) {
          hideSkipButton();
          return;
        }
        
        const currentTime = video.currentTime;
        
        for (const segment of segments) {
          const [start, end] = segment.segment;
          const autoSkip = config.autoSkip !== false;
          
          if (currentTime >= start && currentTime < end) {
            if (autoSkip && segment.actionType === 'skip') {
              if (skipTimeout) clearTimeout(skipTimeout);
              skipTimeout = setTimeout(() => {
                video.currentTime = end;
                hideSkipButton();
              }, 50);
            } else {
              showSkipButton(segment);
            }
            return;
          }
        }
        
        hideSkipButton();
      }
      
      async function init(video) {
        const videoId = getVideoId();
        if (!videoId) return;
        
        segments = await fetchSegments(videoId);
        createSkipButton();
        
        video.removeEventListener('timeupdate', checkSegment);
        video.addEventListener('timeupdate', checkSegment);
      }
      
      if (window.BetterYouTubeUtils) {
        window.BetterYouTubeUtils.onNavigation(() => {
          segments = [];
          hideSkipButton();
        });
        window.BetterYouTubeUtils.onVideoFound((video) => {
          init(video);
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
      autoSkip: true,
      categories: ['sponsor', 'intro', 'outro', 'selfpromo', 'interaction'],
      actionTypes: ['skip', 'mute'],
      ...super.getConfig(),
    };
  }
}

