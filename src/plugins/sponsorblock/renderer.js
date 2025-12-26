// SponsorBlock Plugin
// Skips sponsored segments in YouTube videos

(function() {
  'use strict';

  let currentVideoId = null;
  let segments = [];
  let skipButton = null;

  // Get video ID from URL
  function getVideoId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('v');
  }

  // Fetch skip segments from SponsorBlock API
  async function fetchSegments(videoId) {
    try {
      const response = await fetch(
        `https://sponsor.ajay.app/api/skipSegments?videoID=${videoId}`
      );
      if (response.ok) {
        const data = await response.json();
        return data || [];
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
    skipButton.textContent = '⏭️ Skip Sponsor';
    skipButton.style.cssText = `
      position: fixed;
      bottom: 100px;
      right: 20px;
      z-index: 9999;
      padding: 10px 20px;
      background: #ff0000;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
      font-weight: bold;
      display: none;
    `;
    
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
  function showSkipButton() {
    if (skipButton) {
      skipButton.style.display = 'block';
    }
  }

  // Hide skip button
  function hideSkipButton() {
    if (skipButton) {
      skipButton.style.display = 'none';
    }
  }

  // Check if we're in a segment and show skip button
  function checkSegment() {
    const video = document.querySelector('video');
    if (!video || segments.length === 0) {
      hideSkipButton();
      return;
    }

    const currentTime = video.currentTime;
    
    for (const segment of segments) {
      if (currentTime >= segment.segment[0] && currentTime < segment.segment[1]) {
        showSkipButton();
        return;
      }
    }
    
    hideSkipButton();
  }

  // Initialize SponsorBlock
  async function init() {
    const videoId = getVideoId();
    
    if (!videoId) {
      return;
    }

    if (videoId === currentVideoId) {
      return; // Already loaded
    }

    currentVideoId = videoId;
    segments = await fetchSegments(videoId);
    
    createSkipButton();

    // Check for segments periodically
    const video = document.querySelector('video');
    if (video) {
      video.addEventListener('timeupdate', checkSegment);
    }
  }

  // Run on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-initialize on navigation
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(init, 1000);
    }
  }).observe(document, { subtree: true, childList: true });

})();

