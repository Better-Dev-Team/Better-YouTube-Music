// Discord RPC - using discord-rpc package
// Note: You'll need to create a Discord application and get a client ID
const DiscordRPC = require('discord-rpc');

let rpc: any = null;
let isReady = false;

/**
 * Initialize Discord RPC
 */
export async function initializeDiscordRPC(): Promise<void> {
  try {
    const clientId = 'YOUR_DISCORD_CLIENT_ID'; // Replace with your Discord app client ID
    rpc = new DiscordRPC.Client({ transport: 'ipc' });

    rpc.on('ready', () => {
      isReady = true;
      console.log('Discord RPC connected');
    });

    await rpc.login({ clientId }).catch(() => {
      console.log('Discord RPC: Not connected (Discord may not be running)');
      rpc = null;
    });
  } catch (error) {
    console.error('Error initializing Discord RPC:', error);
    rpc = null;
  }
}

/**
 * Update Discord RPC with current video
 */
export async function updateDiscordRPC(title: string): Promise<void> {
  if (!rpc || !isReady) {
    return;
  }

  try {
    // Extract video title from YouTube page title
    const videoTitle = title.replace(' - YouTube', '').trim();
    
    await rpc.setActivity({
      details: `Watching ${videoTitle}`,
      state: 'on YouTube',
      largeImageKey: 'youtube',
      largeImageText: 'YouTube',
      startTimestamp: Date.now(),
      instance: false
    });
  } catch (error) {
    console.error('Error updating Discord RPC:', error);
  }
}

/**
 * Shutdown Discord RPC
 */
export async function shutdownDiscordRPC(): Promise<void> {
  if (rpc) {
    try {
      await rpc.destroy();
    } catch (error) {
      console.error('Error shutting down Discord RPC:', error);
    }
    rpc = null;
    isReady = false;
  }
}

