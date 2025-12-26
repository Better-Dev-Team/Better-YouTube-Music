import { Session } from 'electron';
import { ElectronBlocker } from '@cliqz/adblocker-electron';
import fetch from 'cross-fetch';
let blocker: ElectronBlocker | null = null;

// Known ad domains to block
const AD_DOMAINS = [
  '*://*.doubleclick.net/*',
  '*://*.googlesyndication.com/*',
  '*://*.googleadservices.com/*',
  '*://*.adservice.google.*/*',
  '*://*.googletagmanager.com/gtm.js*',
  '*://*.ads.youtube.com/*',
  '*://*.advertising.com/*',
  '*://*.adnxs.com/*',
  '*://*.adsafeprotected.com/*',
];

/**
 * Initialize the adblocker
 */
export async function initializeAdBlocker(
  session: Session,
  store: any
): Promise<void> {
  try {
    const enableAdBlock = store?.get('adblocker.enabled', false) ?? false; // Disabled by default
    
    if (!enableAdBlock) {
      console.log('Adblocker is disabled');
      return;
    }

    console.log('Initializing adblocker with selective blocking...');
    
    // Use webRequest to block ads selectively - only block known ad domains
    // Be very careful not to block video resources
    session.webRequest.onBeforeRequest(
      {
        urls: AD_DOMAINS
      },
      (details, callback) => {
        // Never block video resources or YouTube API calls
        const url = details.url.toLowerCase();
        if (url.includes('/videoplayback') || 
            url.includes('/api/stats/') ||
            url.includes('/get_video_info') ||
            url.includes('/youtubei/') ||
            url.includes('/youtube.com/api/') ||
            url.includes('/watchtime') ||
            url.includes('/ptracking') ||
            url.includes('/pagead/') === false) {
          // Allow video and API resources
          callback({});
          return;
        }
        // Block ad requests
        console.log('Blocking ad request:', details.url);
        callback({ cancel: true });
      }
    );
    
    console.log('Adblocker initialized - blocking known ad domains only');
  } catch (error) {
    console.error('Error initializing adblocker:', error);
    console.log('Continuing without adblocker to ensure YouTube works');
  }
}

/**
 * Get the blocker instance
 */
export function getBlocker(): ElectronBlocker | null {
  return blocker;
}

