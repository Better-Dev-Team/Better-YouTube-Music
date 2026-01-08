// Unhook / UI Cleaner Plugin
// Allows hiding various YouTube UI elements

(function () {
  'use strict';

  // Default configuration
  const defaultConfig = {
    hideShorts: false,
    hideComments: false,
    hideRecommendations: false,
    hideHomeFeed: false
  };

  // Get configuration (would be injected from main process)
  let config = { ...defaultConfig };

  // CSS to hide elements
  function injectCSS() {
    const styleId = 'unhook-custom-css';
    if (document.getElementById(styleId)) {
      return;
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      ${config.hideShorts ? `
        ytd-rich-shelf-renderer[is-shorts],
        ytd-reel-shelf-renderer,
        #shorts-container,
        a[href*="/shorts/"] {
          display: none !important;
        }
      ` : ''}
      
      ${config.hideComments ? `
        #comments,
        ytd-comments {
          display: none !important;
        }
      ` : ''}
      
      ${config.hideRecommendations ? `
        #secondary,
        #related {
          display: none !important;
        }
      ` : ''}
      
      ${config.hideHomeFeed ? `
        ytd-rich-grid-renderer,
        ytd-rich-item-renderer {
          display: none !important;
        }
      ` : ''}
    `;

    document.head.appendChild(style);
  }

  // Initialize
  function init() {
    injectCSS();
  }

  // Run on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-inject on navigation
  let lastUrl = location.href;
  setInterval(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(init, 500);
    }
  }, 2000);

})();

