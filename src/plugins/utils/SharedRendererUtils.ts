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

  // 2. Video Discovery (Optimized)
  let checkInterval = null;

  function checkForVideo() {
    const video = document.querySelector('video');
    if (video && !videoFound) {
      videoFound = true;
      listeners.videoFound.forEach(cb => {
        try { cb(video); } catch(e) { console.error('[BetterYouTubeUtils] Video error:', e); }
      });
      // Slow down checks once found
      if (checkInterval) clearInterval(checkInterval);
      checkInterval = setInterval(checkForVideo, 5000);
    } else if (!video) {
        videoFound = false;
        // Search more aggressively if lost
        if (checkInterval) clearInterval(checkInterval);
        checkInterval = setInterval(checkForVideo, 1000);
    }
  }

  // Check on important events
  window.addEventListener('yt-navigate-finish', checkForVideo);
  window.addEventListener('click', () => setTimeout(checkForVideo, 500));
  
  // Initial check loop
  checkInterval = setInterval(checkForVideo, 1000);

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
