const fs = require('fs');
const path = require('path');
const { app } = require('electron');

/**
 * Get the path to the user-plugins directory
 */
function getPluginsDirectory() {
  const userDataPath = app.getPath('userData');
  const pluginsPath = path.join(userDataPath, 'user-plugins');
  return pluginsPath;
}

/**
 * Ensure the user-plugins directory exists
 */
function ensurePluginsDirectory() {
  const pluginsPath = getPluginsDirectory();
  if (!fs.existsSync(pluginsPath)) {
    fs.mkdirSync(pluginsPath, { recursive: true });
  }
  return pluginsPath;
}

/**
 * Read all .js files from the user-plugins directory
 * @returns {Array<{name: string, content: string}>} Array of plugin objects
 */
function loadPlugins() {
  try {
    const pluginsPath = ensurePluginsDirectory();
    const files = fs.readdirSync(pluginsPath);
    
    const plugins = files
      .filter(file => file.endsWith('.js'))
      .map(file => {
        const filePath = path.join(pluginsPath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        return {
          name: file,
          content: content
        };
      });
    
    return plugins;
  } catch (error) {
    console.error('Error loading plugins:', error);
    return [];
  }
}

/**
 * Get list of plugin filenames (for settings display)
 */
function getPluginList() {
  try {
    const pluginsPath = ensurePluginsDirectory();
    const files = fs.readdirSync(pluginsPath);
    return files.filter(file => file.endsWith('.js'));
  } catch (error) {
    console.error('Error getting plugin list:', error);
    return [];
  }
}

module.exports = {
  loadPlugins,
  getPluginList,
  getPluginsDirectory,
  ensurePluginsDirectory
};

