/**
 * Shared Renderer Utilities for YouTube
 * Centralizes navigation tracking and video element discovery
 * injected into the renderer before plugins
 */
export const SharedRendererUtils = `
(function() {
  if (window.BetterYouTubeUtils) return;

  const listeners = {
    navigation: [],
    videoFound: []
  };

  let lastUrl = location.href;
  let videoFound = false;

  // 1. Navigation Tracking
  function handleNavigation() {
    const currentUrl = location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      videoFound = false;
      listeners.navigation.forEach(cb => {
        try { cb(currentUrl); } catch(e) { console.error('[BetterYouTubeUtils] Nav error:', e); }
      });
    }
  }

  window.addEventListener('yt-navigate-finish', handleNavigation);
  window.addEventListener('popstate', handleNavigation);
  
  // Patch history
  const patch = (type) => {
    const orig = history[type];
    return function() {
      const rv = orig.apply(this, arguments);
      handleNavigation();
      return rv;
    };
  };
  history.pushState = patch('pushState');
  history.replaceState = patch('replaceState');

  // 2. Video Discovery
  let debounceTimer = null;
  const observer = new MutationObserver(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const video = document.querySelector('video');
      if (video && !videoFound) {
        videoFound = true;
        listeners.videoFound.forEach(cb => {
          try { cb(video); } catch(e) { console.error('[BetterYouTubeUtils] Video error:', e); }
        });
      } else if (!video) {
        videoFound = false;
      }
    }, 500);
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }

  // 3. API Export
  window.BetterYouTubeUtils = {
    onNavigation: (cb) => listeners.navigation.push(cb),
    onVideoFound: (cb) => {
      listeners.videoFound.push(cb);
      const video = document.querySelector('video');
      if (video) {
        videoFound = true;
        cb(video);
      }
    }
  };

  console.log('[BetterYouTubeUtils] ✅ Utilities initialized');
})();
`;
