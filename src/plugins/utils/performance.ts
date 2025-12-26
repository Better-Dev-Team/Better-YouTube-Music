/**
 * Performance utilities for plugins
 * Shared observers and debouncing to reduce overhead
 */

// Shared navigation observer (URL changes)
let navigationObserver: MutationObserver | null = null;
let navigationCallbacks: Set<(url: string) => void> = new Set();
let lastUrl = location.href;

export function onNavigationChange(callback: (url: string) => void): () => void {
  navigationCallbacks.add(callback);
  
  // Initialize observer if this is the first callback
  if (!navigationObserver && document.body) {
    navigationObserver = new MutationObserver(() => {
      const currentUrl = location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        // Debounce navigation callbacks
        setTimeout(() => {
          navigationCallbacks.forEach(cb => cb(currentUrl));
        }, 100);
      }
    });
    
    try {
      navigationObserver.observe(document.body, {
        childList: true,
        subtree: false // Only watch direct children, not entire subtree
      });
    } catch (error) {
      console.error('Navigation observer error:', error);
    }
  }
  
  // Return cleanup function
  return () => {
    navigationCallbacks.delete(callback);
    if (navigationCallbacks.size === 0 && navigationObserver) {
      navigationObserver.disconnect();
      navigationObserver = null;
    }
  };
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Shared video element observer
let videoObserver: MutationObserver | null = null;
let videoCallbacks: Set<(video: HTMLVideoElement | null) => void> = new Set();
let lastVideo: HTMLVideoElement | null = null;

export function onVideoElementChange(callback: (video: HTMLVideoElement | null) => void): () => void {
  videoCallbacks.add(callback);
  
  // Check immediately
  const video = document.querySelector('video') as HTMLVideoElement | null;
  if (video !== lastVideo) {
    lastVideo = video;
    setTimeout(() => callback(video), 0);
  }
  
  // Initialize observer if this is the first callback
  if (!videoObserver && document.body) {
    const checkVideo = debounce(() => {
      const currentVideo = document.querySelector('video') as HTMLVideoElement | null;
      if (currentVideo !== lastVideo) {
        lastVideo = currentVideo;
        videoCallbacks.forEach(cb => cb(currentVideo));
      }
    }, 300); // Debounce video checks
    
    videoObserver = new MutationObserver(checkVideo);
    
    try {
      // Only observe the player container area, not entire body
      const playerContainer = document.querySelector('ytd-watch-flexy, #player-container, #movie_player');
      if (playerContainer) {
        videoObserver.observe(playerContainer, {
          childList: true,
          subtree: true
        });
      } else {
        // Fallback to body but with debouncing
        videoObserver.observe(document.body, {
          childList: true,
          subtree: false // Only direct children
        });
      }
    } catch (error) {
      console.error('Video observer error:', error);
    }
  }
  
  // Return cleanup function
  return () => {
    videoCallbacks.delete(callback);
    if (videoCallbacks.size === 0 && videoObserver) {
      videoObserver.disconnect();
      videoObserver = null;
    }
  };
}

