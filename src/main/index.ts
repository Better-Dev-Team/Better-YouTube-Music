import { app, BrowserWindow, ipcMain, session } from 'electron';
import { autoUpdater } from 'electron-updater';
import { join } from 'path';
import { existsSync } from 'fs';
import { createConnection } from 'net';
import {
  PluginLoader,
  AdBlocker,
  SponsorBlock,
  Downloader,
  Unhook,
  AlbumColorTheme,
  BetterFullscreen,
  Visualizer,
  InAppMenu,
  AppMenuBar,
  DiscordRPCPlugin,
  LastFM,
  AudioCompressor,
  ExponentialVolume,
  VolumeBooster,
  BrowserUI,
} from '../plugins';
import { config } from '../config/Config';
import { copyDefaultPlugins } from './copy-plugins';

let mainWindow: BrowserWindow | null = null;
let settingsWindow: BrowserWindow | null = null;
let pluginLoader: PluginLoader | null = null;

const isDev = !app.isPackaged;

function checkDevServer(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection(port, 'localhost');
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('error', () => {
      resolve(false);
    });
    socket.setTimeout(200); // Fast timeout
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function createMainWindow() {
  console.log('--- Operation Terminator - Version 2.3.0-M2-Terminator Loaded ---');
  // Icon path - try .ico first, then .png
  let iconPath: string | undefined;
  if (app.isPackaged) {
    // In packaged app, icon is embedded by electron-builder
    // Try to find it in resources
    const icoPath = join(process.resourcesPath, 'build', 'icon.ico');
    const pngPath = join(process.resourcesPath, 'build', 'icon.png');
    if (existsSync(icoPath)) {
      iconPath = icoPath;
    } else if (existsSync(pngPath)) {
      iconPath = pngPath;
    }
  } else {
    // In development, use build folder
    const icoPath = join(__dirname, '../../build/icon.ico');
    const pngPath = join(__dirname, '../../build/icon.png');
    if (existsSync(icoPath)) {
      iconPath = icoPath;
    } else if (existsSync(pngPath)) {
      iconPath = pngPath;
    }
  }

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: iconPath,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Allow cross-origin requests for plugins
      backgroundThrottling: false // Prevent throttling when window loses focus
    },
    autoHideMenuBar: true,
    frame: false, // Frameless to allow custom title bar
    titleBarStyle: 'hidden',
    show: false
  });

  // Remove Trusted Types from CSP headers
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = { ...details.responseHeaders };
    delete responseHeaders['content-security-policy'];
    callback({ responseHeaders });
  });

  // Inject Trusted Types bypass into MAIN WORLD before page scripts run
  // Using worldId: 'main' runs in the main world, not isolated context
  mainWindow.webContents.on('did-start-loading', () => {
    mainWindow?.webContents.executeJavaScript(`
      (function() {
        if (window.trustedTypes && window.trustedTypes.createPolicy) {
          try {
            window.trustedTypes.createPolicy('default', {
              createHTML: (string) => string,
              createScript: (string) => string,
              createScriptURL: (string) => string
            });
          } catch(e) {
            try {
              window.trustedTypes.createPolicy('electron-permissive', {
                createHTML: (string) => string,
                createScript: (string) => string,
                createScriptURL: (string) => string
              });
            } catch(e2) {}
          }
        }
      })();
    `, { worldId: 'main' } as any).catch(() => { });
  });

  // Open DevTools only in development
  if (!app.isPackaged && process.env.NODE_ENV !== 'production') {
    mainWindow.webContents.openDevTools();
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Error handling
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load:', errorCode, errorDescription, validatedURL);
    if (mainWindow && !mainWindow.isDestroyed()) {
      const errorHTML = `
        <div style="padding: 40px; text-align: center; font-family: sans-serif;">
          <h1>Failed to load YouTube Music</h1>
          <p>Error: ${errorCode} - ${errorDescription}</p>
          <p>URL: ${validatedURL}</p>
          <button onclick="location.reload()" style="padding: 10px 20px; margin-top: 20px; cursor: pointer;">Retry</button>
        </div>
      `;
      mainWindow.webContents.executeJavaScript(`
        document.body.innerHTML = ${JSON.stringify(errorHTML)};
      `).catch(console.error);
    }
  });

  mainWindow.webContents.on('console-message', (_event, level, message) => {
    console.log(`[Renderer ${level}]:`, message);
  });

  // Inject Trusted Types bypass before loading
  mainWindow.webContents.executeJavaScript(`
    (function() {
      // Disable Trusted Types before page loads
      if (window.trustedTypes && window.trustedTypes.createPolicy) {
        try {
          window.trustedTypes.createPolicy('default', {
            createHTML: (string) => string,
            createScript: (string) => string,
            createScriptURL: (string) => string
          });
        } catch(e) {}
      }
    })();
  `, true).catch(() => { });

  // Load YouTube
  console.log('Loading YouTube Music...');
  mainWindow.loadURL('https://music.youtube.com').catch(err => {
    console.error('Error loading URL:', err);
  });

  // Inject plugins when page finishes loading
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page finished loading');
    if (mainWindow) {
      // Ensure Trusted Types policy exists (preload should have set it, but double-check)
      mainWindow.webContents.executeJavaScript(`
        (function() {
          try {
            if (window.trustedTypes && window.trustedTypes.createPolicy) {
              // Try to create default policy
              try {
                window.trustedTypes.createPolicy('default', {
                  createHTML: (string) => string,
                  createScript: (string) => string,
                  createScriptURL: (string) => string
                });
              } catch(e) {
                // Default might exist, create custom one
                window.trustedTypes.createPolicy('electron-permissive', {
                  createHTML: (string) => string,
                  createScript: (string) => string,
                  createScriptURL: (string) => string
                });
              }
            }
          } catch(e) {
            console.warn('Trusted Types setup error:', e);
          }
        })();
      `, true).catch(() => { });

      if (pluginLoader) {
        pluginLoader.callOnRendererLoaded(mainWindow);
      }

      // Inject settings button
      injectSettingsButton(mainWindow);
    }
  });

  // Handle navigation (including YouTube SPA navigation)
  mainWindow.webContents.on('did-navigate', () => {
    setTimeout(() => {
      if (mainWindow && pluginLoader) {
        pluginLoader.callOnRendererLoaded(mainWindow);
      }
    }, 1000);
  });

  // Handle in-page navigation (YouTube uses SPA, so this is important)
  mainWindow.webContents.on('did-navigate-in-page', () => {
    setTimeout(() => {
      if (mainWindow && pluginLoader) {
        pluginLoader.callOnRendererLoaded(mainWindow);
      }
    }, 1000);
  });

  // Discord RPC is handled by DiscordRPCPlugin

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Call onWindowCreated for all enabled plugins
  if (pluginLoader) {
    await pluginLoader.callOnWindowCreated(mainWindow);
  }
}

async function createSettingsWindow(show = true) {
  if (settingsWindow) {
    if (show) {
      settingsWindow.show();
      settingsWindow.focus();
    }
    return;
  }

  // Icon path - try .ico first, then .png
  let iconPath: string | undefined;
  if (app.isPackaged) {
    const icoPath = join(process.resourcesPath, 'build', 'icon.ico');
    const pngPath = join(process.resourcesPath, 'build', 'icon.png');
    if (existsSync(icoPath)) {
      iconPath = icoPath;
    } else if (existsSync(pngPath)) {
      iconPath = pngPath;
    }
  } else {
    const icoPath = join(__dirname, '../../build/icon.ico');
    const pngPath = join(__dirname, '../../build/icon.png');
    if (existsSync(icoPath)) {
      iconPath = icoPath;
    } else if (existsSync(pngPath)) {
      iconPath = pngPath;
    }
  }

  settingsWindow = new BrowserWindow({
    width: 800,
    height: 600,
    parent: mainWindow || undefined,
    modal: false,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, '../preload/index.js')
    },
    autoHideMenuBar: true,
    show: false // Hidden until ready or requested
  });

  // Show window ONLY if show is true
  settingsWindow.once('ready-to-show', () => {
    if (show) {
      settingsWindow?.show();
    }
  });

  // Determine if we should use dev server or built files
  // Only use dev server if port 5173 is reachable
  const devServerActive = isDev && await checkDevServer(5173);

  // Get the correct path for settings.html
  let settingsPath: string;
  if (app.isPackaged) {
    // In packaged app, files are in app.asar
    settingsPath = join(app.getAppPath(), 'dist', 'settings.html');
  } else {
    // In dev, check both dist and root
    settingsPath = join(__dirname, '../../dist/settings.html');
  }

  // Track if we've tried the fallback to avoid infinite loops
  let triedFallback = false;

  // Show error message if settings can't load
  const showSettingsError = () => {
    if (!settingsWindow || settingsWindow.isDestroyed()) return;

    const errorHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Settings - Error</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 40px;
            text-align: center;
            background: #1a1a1a;
            color: #fff;
          }
          h1 { color: #ff4444; }
          p { color: #ccc; margin: 10px 0; }
          code {
            background: #2a2a2a;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: monospace;
            color: #4CAF50;
          }
          .instructions {
            text-align: left;
            max-width: 500px;
            margin: 20px auto;
            background: #2a2a2a;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          }
        </style>
      </head>
      <body>
        <h1>Settings Window Error</h1>
        <p>Could not load settings window.</p>
        <div class="instructions">
          <p><strong>Option 1 (Recommended for development):</strong></p>
          <p>Run <code>npm run dev</code> in a separate terminal, then try again.</p>
          <p style="margin-top: 15px;"><strong>Option 2:</strong></p>
          <p>Build the renderer: <code>npm run build:renderer</code>, then try again.</p>
        </div>
      </body>
      </html>
    `;

    settingsWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHTML)}`).catch(console.error);
  };

  // Handle failed loads and fallback to built file
  settingsWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error('Settings window failed to load:', errorCode, errorDescription, validatedURL);

    // Only handle connection refused errors for dev server
    if (isDev && errorCode === -102 && validatedURL.includes('localhost:5173') && !triedFallback) {
      triedFallback = true;
      console.warn('Dev server not available, trying built file...');

      if (settingsWindow && !settingsWindow.isDestroyed()) {
        if (existsSync(settingsPath)) {
          settingsWindow.loadFile(settingsPath).catch(err2 => {
            console.error('Failed to load settings from built file:', err2);
            showSettingsError();
          });
        } else {
          console.warn('Settings file not found at:', settingsPath);
          showSettingsError();
        }
      }
    } else if (!isDev && errorCode !== 0 && !triedFallback) {
      // Production: try alternative paths
      triedFallback = true;
      const pathsToTry = [
        join(app.getAppPath(), 'dist', 'settings.html'),
        join(app.getAppPath(), 'settings.html'),
      ];

      let pathIndex = 0;
      const tryNextPath = () => {
        if (pathIndex >= pathsToTry.length || !settingsWindow || settingsWindow.isDestroyed()) {
          showSettingsError();
          return;
        }

        const path = pathsToTry[pathIndex];
        if (existsSync(path)) {
          settingsWindow.loadFile(path).catch(() => {
            pathIndex++;
            tryNextPath();
          });
        } else {
          pathIndex++;
          tryNextPath();
        }
      };
      tryNextPath();
    } else if (!triedFallback) {
      // Other errors - show error message
      showSettingsError();
    }
  });

  // Function to load settings with fallbacks
  const loadSettings = () => {
    if (!settingsWindow || settingsWindow.isDestroyed()) return;

    triedFallback = false;

    if (devServerActive) {
      // Use dev server
      settingsWindow.loadURL('http://localhost:5173/settings.html').catch(() => {
        // Fallback handled by did-fail-load or initial check
      });
    } else {
      // Production: try primary path first
      if (existsSync(settingsPath)) {
        settingsWindow.loadFile(settingsPath).catch(() => {
          // If primary fails, did-fail-load will try alternatives
        });
      } else {
        // Try alternative paths
        const pathsToTry = [
          join(app.getAppPath(), 'dist', 'settings.html'),
          join(app.getAppPath(), 'settings.html'),
        ];

        let pathIndex = 0;
        const tryNextPath = () => {
          if (pathIndex >= pathsToTry.length || !settingsWindow || settingsWindow.isDestroyed()) {
            showSettingsError();
            return;
          }

          const path = pathsToTry[pathIndex];
          if (existsSync(path)) {
            settingsWindow.loadFile(path).catch(() => {
              pathIndex++;
              tryNextPath();
            });
          } else {
            pathIndex++;
            tryNextPath();
          }
        };
        tryNextPath();
      }
    }
  };

  // Load settings
  loadSettings();

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

// Inject settings button overlay
function injectSettingsButton(window: BrowserWindow) {
  const script = `
    (function() {
      function createSettingsButton() {
        if (!document.body || !(document.body instanceof Node)) {
          setTimeout(createSettingsButton, 100);
          return;
        }
        
        try {
          // Remove existing button if present
          const existing = document.getElementById('better-youtube-settings-btn');
          if (existing) existing.remove();
          
          // Create button element directly (avoid innerHTML for Trusted Types)
          const button = document.createElement('div');
          button.id = 'better-youtube-settings-btn';
          button.textContent = '⚙️ Settings';
          button.style.cssText = 'position: fixed; top: 10px; right: 10px; z-index: 999999; background: rgba(0, 0, 0, 0.8); border-radius: 8px; padding: 8px 12px; cursor: pointer; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 12px; color: white; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3); transition: background 0.2s;';
          
          button.addEventListener('mouseover', () => {
            button.style.background = 'rgba(0, 0, 0, 0.95)';
          });
          button.addEventListener('mouseout', () => {
            button.style.background = 'rgba(0, 0, 0, 0.8)';
          });
          
          // Add click handler
          if (window.electronAPI) {
            button.addEventListener('click', () => {
              window.electronAPI.openSettings();
            });
          }
          
          document.body.appendChild(button);
        } catch (error) {
          console.error('Error creating settings button:', error);
        }
      }
      
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createSettingsButton);
      } else {
        setTimeout(createSettingsButton, 100);
      }
    })();
  `;

  window.webContents.executeJavaScript(script, true).catch(err => {
    console.error('Error injecting settings button:', err);
  });
}

// IPC Handlers
ipcMain.handle('open-settings', () => {
  createSettingsWindow();
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-plugins', async () => {
  if (!pluginLoader) return [];
  return pluginLoader.getAllPlugins().map(plugin => ({
    name: plugin.metadata.name,
    description: plugin.metadata.description,
    enabled: plugin.isEnabled(),
  }));
});

ipcMain.handle('toggle-plugin', async (_event, pluginName: string, enabled: boolean) => {
  if (!pluginLoader) return false;

  if (enabled) {
    pluginLoader.enablePlugin(pluginName);
  } else {
    pluginLoader.disablePlugin(pluginName);
  }

  // Reload renderer plugins if main window exists
  if (mainWindow) {
    pluginLoader.callOnRendererLoaded(mainWindow);
  }
  return true;
});

ipcMain.handle('get-plugin-config', async (_event, pluginName: string) => {
  const plugin = pluginLoader?.getPlugin(pluginName);
  return plugin ? plugin.getConfig() : {};
});

ipcMain.handle('set-plugin-config', async (_event, pluginName: string, pluginConfig: any) => {
  const plugin = pluginLoader?.getPlugin(pluginName);
  if (plugin) {
    plugin.setConfig(pluginConfig);

    // Special handling for Discord RPC - reinitialize when config changes
    if (pluginName === 'discord-rpc' && (plugin as any).onConfigChanged) {
      await (plugin as any).onConfigChanged();
    }

    if (mainWindow) {
      pluginLoader?.callOnRendererLoaded(mainWindow);
    }
    return true;
  }
  return false;
});


// Last.fm API signature generation (MD5 not available in Web Crypto)
ipcMain.handle('lastfm-signature', (_event, params: Record<string, string>, secret: string) => {
  const crypto = require('crypto');
  const sortedKeys = Object.keys(params).sort();
  const sigString = sortedKeys
    .map(key => key + params[key])
    .join('') + secret;
  return crypto.createHash('md5').update(sigString).digest('hex');
});

ipcMain.handle('navigate', (_event, action: 'back' | 'forward' | 'refresh') => {
  if (!mainWindow) return;
  switch (action) {
    case 'back':
      if (mainWindow.webContents.canGoBack()) mainWindow.webContents.goBack();
      break;
    case 'forward':
      if (mainWindow.webContents.canGoForward()) mainWindow.webContents.goForward();
      break;
    case 'refresh':
      mainWindow.webContents.reload();
      break;
  }
});


ipcMain.handle('window-action', (_event, action: string) => {
  if (!mainWindow && action !== 'restart') return;

  switch (action) {
    case 'minimize':
      mainWindow?.minimize();
      break;
    case 'maximize':
      if (mainWindow?.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow?.maximize();
      }
      break;
    case 'close':
      mainWindow?.close();
      break;
    case 'restart':
      app.relaunch();
      app.exit(0);
      break;
  }
});

// Auto-updater event listeners
autoUpdater.on('checking-for-update', () => {
  mainWindow?.webContents.send('update-status', 'checking');
});

autoUpdater.on('update-available', (_info) => {
  mainWindow?.webContents.send('update-available', _info);
});

autoUpdater.on('update-not-available', (_info) => {
  mainWindow?.webContents.send('update-status', 'up-to-date');
});

autoUpdater.on('error', (err) => {
  mainWindow?.webContents.send('update-error', err.message);
});

autoUpdater.on('download-progress', (progressObj) => {
  mainWindow?.webContents.send('update-progress', progressObj);
});

autoUpdater.on('update-downloaded', (_info) => {
  mainWindow?.webContents.send('update-downloaded', _info);
});

ipcMain.handle('check-for-updates', () => {
  autoUpdater.checkForUpdatesAndNotify();
});

ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall();
});

// App lifecycle
app.whenReady().then(async () => {
  // Initialize plugin loader
  const userDataPath = app.getPath('userData');
  const pluginsDir = join(userDataPath, 'plugins');
  pluginLoader = new PluginLoader(pluginsDir);
  pluginLoader.setSession(session.defaultSession);

  // Check for updates immediately
  autoUpdater.checkForUpdatesAndNotify().catch(err => {
    console.error('Failed to check for updates:', err);
  });

  // Register all plugins
  const adBlocker = new AdBlocker('adblocker');
  adBlocker.setSession(session.defaultSession);
  pluginLoader.registerPlugin(adBlocker);

  // Load plugins from directory FIRST (filesystem plugins)
  await pluginLoader.loadPlugins();

  // THEN register programmatic plugins (these will override filesystem plugins)
  pluginLoader.registerPlugin(new SponsorBlock('sponsorblock'));
  pluginLoader.registerPlugin(new Downloader('downloader'));
  pluginLoader.registerPlugin(new Unhook('unhook'));

  pluginLoader.registerPlugin(new AlbumColorTheme('album-color-theme'));
  pluginLoader.registerPlugin(new BetterFullscreen('better-fullscreen'));
  pluginLoader.registerPlugin(new Visualizer('visualizer'));
  pluginLoader.registerPlugin(new InAppMenu('in-app-menu'));
  pluginLoader.registerPlugin(new AppMenuBar('app-menu-bar'));
  pluginLoader.registerPlugin(new BrowserUI('browser-ui'));
  pluginLoader.registerPlugin(new DiscordRPCPlugin('discord-rpc'));
  pluginLoader.registerPlugin(new LastFM('lastfm'));
  pluginLoader.registerPlugin(new AudioCompressor('audio-compressor'));
  pluginLoader.registerPlugin(new ExponentialVolume('exponential-volume'));
  pluginLoader.registerPlugin(new VolumeBooster('volume-booster'));

  // Copy default plugins to user data directory
  await copyDefaultPlugins();

  // Call onAppReady for all enabled plugins
  await pluginLoader.callOnAppReady();

  // Create main window
  await createMainWindow();

  // Pre-create settings window in background for instant opening
  createSettingsWindow(false);

  // Check for updates on startup (after a short delay to ensure window is ready)
  setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify().catch(err => {
      console.warn('Auto-update check failed:', err);
    });
  }, 5000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Shutdown plugins
  if (pluginLoader) {
    const plugins = pluginLoader.getAllPlugins();
    for (const plugin of plugins) {
      if (plugin.onDisabled) {
        plugin.onDisabled();
      }
    }
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

