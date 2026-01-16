import { mkdir, copyFile, readdir, stat } from 'fs/promises';
import { join } from 'path';
import { app } from 'electron';

export async function copyPlugins(srcPluginsDir: string, pluginsDir: string): Promise<void> {
  try {
    // Create plugins directory if it doesn't exist
    await mkdir(pluginsDir, { recursive: true });

    // Get all plugin directories from src/plugins
    const entries = await readdir(srcPluginsDir, { withFileTypes: true });

    await Promise.all(
      entries.map(async (entry) => {
        if (entry.isDirectory()) {
          const srcPluginPath = join(srcPluginsDir, entry.name);
          const destPluginPath = join(pluginsDir, entry.name);

          // Check if plugin already exists
          try {
            await stat(destPluginPath);
            // Plugin exists, skip
            return;
          } catch {
            // Plugin doesn't exist, copy it
          }

          // Create destination directory
          await mkdir(destPluginPath, { recursive: true });

          // Copy renderer.js if it exists
          try {
            await copyFile(
              join(srcPluginPath, 'renderer.js'),
              join(destPluginPath, 'renderer.js')
            );
          } catch {
            // renderer.js doesn't exist, skip
          }

          // Copy preload.js if it exists
          try {
            await copyFile(
              join(srcPluginPath, 'preload.js'),
              join(destPluginPath, 'preload.js')
            );
          } catch {
            // preload.js doesn't exist, skip
          }

          console.log(`Copied plugin: ${entry.name}`);
        }
      })
    );
  } catch (error) {
    console.error('Error copying plugins:', error);
  }
}

/**
 * Copy default plugins from src/plugins to user data directory
 */
export async function copyDefaultPlugins(): Promise<void> {
  const userDataPath = app.getPath('userData');
  const pluginsDir = join(userDataPath, 'plugins');
  // In production, plugins are in the app's resources, in dev they're in src/plugins
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  const srcPluginsDir = isDev
    ? join(__dirname, '../../src/plugins')
    : join(process.resourcesPath, 'plugins');

  await copyPlugins(srcPluginsDir, pluginsDir);
}
