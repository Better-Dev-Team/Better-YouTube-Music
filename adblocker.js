const { session } = require('electron');
const { ElectronBlocker } = require('@cliqz/adblocker-electron');
const fetch = require('cross-fetch');

let blocker = null;

/**
 * Initialize the adblocker using filter lists
 * Uses uBlock Origin compatible filter lists (EasyList, EasyPrivacy, etc.)
 * Currently disabled by default to avoid breaking YouTube
 */
async function initializeAdBlocker() {
  try {
    // Check if adblocker is enabled in settings (default: false to prevent breaking YouTube)
    const Store = (await import('electron-store')).default;
    const store = new Store();
    const enableAdBlock = store.get('enableAdBlock', false);
    
    if (!enableAdBlock) {
      console.log('Adblocker is disabled by default (can be enabled in settings)');
      return null;
    }
    
    console.log('Initializing adblocker with filter lists...');
    
    // Initialize blocker with prebuilt filter lists
    blocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch);
    
    // Enable blocking in the default session
    blocker.enableBlockingInSession(session.defaultSession);
    
    console.log('Adblocker initialized successfully');
    return blocker;
  } catch (error) {
    console.error('Error initializing adblocker:', error);
    console.error('Adblocker will be disabled to prevent breaking YouTube');
    // Continue even if adblocker fails
    return null;
  }
}

/**
 * Get the current blocker instance
 */
function getBlocker() {
  return blocker;
}

/**
 * Update filter lists (can be called periodically)
 */
async function updateFilterLists() {
  if (!blocker) {
    return;
  }
  
  try {
    console.log('Updating adblocker filter lists...');
    await blocker.update();
    console.log('Filter lists updated successfully');
  } catch (error) {
    console.error('Error updating filter lists:', error);
  }
}

module.exports = {
  initializeAdBlocker,
  getBlocker,
  updateFilterLists
};

