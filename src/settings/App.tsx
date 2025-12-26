import { useEffect, useState } from 'react';
import './App.css';

interface Plugin {
  name: string;
  description?: string;
  enabled: boolean;
}

interface PluginConfig {
  [key: string]: any;
}

type MenuTab = 'plugins' | 'about';

function App() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlugin, setSelectedPlugin] = useState<string | null>(null);
  const [pluginConfigs, setPluginConfigs] = useState<Record<string, PluginConfig>>({});
  const [activeMenuTab, setActiveMenuTab] = useState<MenuTab>('plugins');

  const [version, setVersion] = useState('');
  const [updateStatus, setUpdateStatus] = useState<{
    type: string;
    message?: string;
    progress?: number;
    downloaded?: boolean;
  }>({ type: 'idle' });

  useEffect(() => {
    loadPlugins();
    window.electronAPI.getAppVersion().then(setVersion);

    // Listen for update status
    window.electronAPI.onUpdateStatus((status) => {
      console.log('Update status:', status);
      switch (status.type) {
        case 'update-status':
          if (status.data === 'checking') setUpdateStatus({ type: 'checking' });
          if (status.data === 'up-to-date') setUpdateStatus({ type: 'idle', message: 'App is up to date' });
          break;
        case 'update-available':
          setUpdateStatus({ type: 'available', message: `Update available: ${status.data.version}` });
          break;
        case 'update-progress':
          setUpdateStatus({ type: 'downloading', progress: status.data.percent });
          break;
        case 'update-downloaded':
          setUpdateStatus({ type: 'downloaded', message: 'Update ready to install' });
          break;
        case 'update-error':
          setUpdateStatus({ type: 'error', message: `Error: ${status.data}` });
          break;
      }
    });
  }, []);

  const loadPlugins = async () => {
    try {
      const pluginList = await window.electronAPI.getPlugins();
      setPlugins(pluginList);

      // Load configs for all plugins
      const configs: Record<string, PluginConfig> = {};
      for (const plugin of pluginList) {
        configs[plugin.name] = await window.electronAPI.getPluginConfig(plugin.name);
      }
      setPluginConfigs(configs);

    } catch (error) {
      console.error('Error loading plugins:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePlugin = async (pluginName: string, enabled: boolean) => {
    try {
      await window.electronAPI.togglePlugin(pluginName, enabled);
      setPlugins(prev =>
        prev.map(p => (p.name === pluginName ? { ...p, enabled } : p))
      );
    } catch (error) {
      console.error('Error toggling plugin:', error);
    }
  };

  const updatePluginConfig = async (pluginName: string, key: string, value: any) => {
    try {
      const currentConfig = pluginConfigs[pluginName] || {};
      const newConfig = { ...currentConfig, [key]: value };
      await window.electronAPI.setPluginConfig(pluginName, newConfig);
      setPluginConfigs(prev => ({
        ...prev,
        [pluginName]: newConfig,
      }));
    } catch (error) {
      console.error('Error updating plugin config:', error);
    }
  };


  const checkForUpdates = () => {
    setUpdateStatus({ type: 'checking' });
    window.electronAPI.checkForUpdates();
  };

  const installUpdate = () => {
    window.electronAPI.installUpdate();
  };


  const renderPluginSettings = (plugin: Plugin) => {
    const config = pluginConfigs[plugin.name] || {};

    switch (plugin.name) {
      case 'adblocker':
        return (
          <div className="plugin-settings">
            <p className="plugin-description">Blocks ads and trackers using filter lists</p>
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={config.enabled !== false}
                  onChange={e => updatePluginConfig(plugin.name, 'enabled', e.target.checked)}
                />
                Enable AdBlocker
              </label>
            </div>
          </div>
        );

      case 'sponsorblock':
        return (
          <div className="plugin-settings">
            <p className="plugin-description">Automatically skips sponsored segments, intros, outros, and more</p>
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={config.autoSkip !== false}
                  onChange={e => updatePluginConfig(plugin.name, 'autoSkip', e.target.checked)}
                />
                Auto-skip segments
              </label>
            </div>
            <div className="setting-item">
              <label>Categories to skip:</label>
              <div className="checkbox-group">
                {['sponsor', 'intro', 'outro', 'selfpromo', 'interaction'].map(cat => (
                  <label key={cat} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={(config.categories || []).includes(cat)}
                      onChange={e => {
                        const categories = config.categories || [];
                        const newCategories = e.target.checked
                          ? [...categories, cat]
                          : categories.filter((c: string) => c !== cat);
                        updatePluginConfig(plugin.name, 'categories', newCategories);
                      }}
                    />
                    {cat}
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 'downloader':
        return (
          <div className="plugin-settings">
            <p className="plugin-description">Download YouTube videos and audio</p>
            <div className="setting-item">
              <label>Download Path:</label>
              <input
                type="text"
                value={config.downloadPath || ''}
                onChange={e => updatePluginConfig(plugin.name, 'downloadPath', e.target.value)}
                placeholder="Default: userData/downloads"
              />
            </div>
          </div>
        );

      case 'unhook':
        return (
          <div className="plugin-settings">
            <p className="plugin-description">
              Hide YouTube related videos, shorts, comments, suggestions, homepage recommendations, and other distractions.
            </p>
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={config.hideHomeFeed === true}
                  onChange={e => updatePluginConfig(plugin.name, 'hideHomeFeed', e.target.checked)}
                />
                Hide Homepage Feed
              </label>
            </div>
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={config.hideShorts === true}
                  onChange={e => updatePluginConfig(plugin.name, 'hideShorts', e.target.checked)}
                />
                Hide YouTube Shorts
              </label>
            </div>
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={config.hideComments === true}
                  onChange={e => updatePluginConfig(plugin.name, 'hideComments', e.target.checked)}
                />
                Hide Comments
              </label>
            </div>
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={config.hideRecommended === true}
                  onChange={e => updatePluginConfig(plugin.name, 'hideRecommended', e.target.checked)}
                />
                Hide Recommended (Related Videos)
              </label>
            </div>
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={config.hideSidebar === true}
                  onChange={e => updatePluginConfig(plugin.name, 'hideSidebar', e.target.checked)}
                />
                Hide Video Sidebar
              </label>
            </div>
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={config.hideEndScreen === true}
                  onChange={e => updatePluginConfig(plugin.name, 'hideEndScreen', e.target.checked)}
                />
                Hide End Screen Videowall
              </label>
            </div>
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={config.disableAutoplay === true}
                  onChange={e => updatePluginConfig(plugin.name, 'disableAutoplay', e.target.checked)}
                />
                Disable Autoplay
              </label>
            </div>
          </div>
        );

      case 'lastfm':
        return (
          <div className="plugin-settings">
            <p className="plugin-description">Scrobble YouTube Music to Last.fm</p>
            <div className="setting-item">
              <label>API Key:</label>
              <input
                type="text"
                value={config.apiKey || ''}
                onChange={e => updatePluginConfig(plugin.name, 'apiKey', e.target.value)}
                placeholder="Your Last.fm API key"
              />
            </div>
            <div className="setting-item">
              <label>API Secret:</label>
              <input
                type="password"
                value={config.apiSecret || ''}
                onChange={e => updatePluginConfig(plugin.name, 'apiSecret', e.target.value)}
                placeholder="Your Last.fm API secret"
              />
            </div>
            <small>Get your API credentials from https://www.last.fm/api/account/create</small>
          </div>
        );

      case 'visualizer':
        return (
          <div className="plugin-settings">
            <p className="plugin-description">Audio visualizer with customizable styles</p>
            <div className="setting-item">
              <label>Height (px):</label>
              <input
                type="number"
                value={config.height || 100}
                onChange={e => updatePluginConfig(plugin.name, 'height', parseInt(e.target.value))}
                min="50"
                max="300"
              />
            </div>
            <div className="setting-item">
              <label>Opacity:</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={config.opacity || 0.7}
                onChange={e => updatePluginConfig(plugin.name, 'opacity', parseFloat(e.target.value))}
              />
              <span>{(config.opacity || 0.7).toFixed(1)}</span>
            </div>
            <div className="setting-item">
              <label>Start Color:</label>
              <input
                type="color"
                value={config.startColor || '#ff0000'}
                onChange={e => updatePluginConfig(plugin.name, 'startColor', e.target.value)}
              />
            </div>
            <div className="setting-item">
              <label>End Color:</label>
              <input
                type="color"
                value={config.endColor || '#0000ff'}
                onChange={e => updatePluginConfig(plugin.name, 'endColor', e.target.value)}
              />
            </div>
          </div>
        );

      case 'audio-compressor':
        return (
          <div className="plugin-settings">
            <p className="plugin-description">Audio compression for better sound quality</p>
            <div className="setting-item">
              <label>Threshold (dB):</label>
              <input
                type="range"
                min="-60"
                max="0"
                step="1"
                value={config.threshold || -24}
                onChange={e => updatePluginConfig(plugin.name, 'threshold', parseInt(e.target.value))}
              />
              <span>{config.threshold || -24} dB</span>
            </div>
            <div className="setting-item">
              <label>Ratio:</label>
              <input
                type="range"
                min="1"
                max="20"
                step="0.5"
                value={config.ratio || 4}
                onChange={e => updatePluginConfig(plugin.name, 'ratio', parseFloat(e.target.value))}
              />
              <span>{config.ratio || 4}:1</span>
            </div>
          </div>
        );

      case 'exponential-volume':
        return (
          <div className="plugin-settings">
            <p className="plugin-description">Logarithmic volume slider for better volume control</p>
            <div className="setting-item">
              <label>Curve Steepness:</label>
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={config.curve || 3}
                onChange={e => updatePluginConfig(plugin.name, 'curve', parseFloat(e.target.value))}
              />
              <span>{config.curve || 3}</span>
            </div>
          </div>
        );

      case 'album-color-theme':
        return (
          <div className="plugin-settings">
            <p className="plugin-description">Extract colors from album art to theme the UI</p>
            <div className="setting-item">
              <label>Intensity:</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={config.intensity || 0.3}
                onChange={e => updatePluginConfig(plugin.name, 'intensity', parseFloat(e.target.value))}
              />
              <span>{(config.intensity || 0.3).toFixed(1)}</span>
            </div>
          </div>
        );

      case 'better-fullscreen':
        return (
          <div className="plugin-settings">
            <p className="plugin-description">Enhanced fullscreen experience with better controls</p>
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={config.autoHideControls !== false}
                  onChange={e => updatePluginConfig(plugin.name, 'autoHideControls', e.target.checked)}
                />
                Auto-hide controls
              </label>
            </div>
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={config.hideTitleBar === true}
                  onChange={e => updatePluginConfig(plugin.name, 'hideTitleBar', e.target.checked)}
                />
                Hide title bar
              </label>
            </div>
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={config.showMenuBar !== false}
                  onChange={e => updatePluginConfig(plugin.name, 'showMenuBar', e.target.checked)}
                />
                Show menu bar
              </label>
            </div>
          </div>
        );

      case 'discord-rpc':
        return (
          <div className="plugin-settings">
            <p className="plugin-description">Show what you're watching on Discord</p>
            <div className="setting-item">
              <label>Discord Client ID (Optional):</label>
              <input
                type="text"
                value={config.clientId || ''}
                onChange={e => updatePluginConfig(plugin.name, 'clientId', e.target.value || undefined)}
                placeholder="Leave empty to use default"
              />
            </div>
            <small style={{ color: '#888', display: 'block', marginTop: '8px' }}>
              A default Client ID is included and works out of the box. You can optionally set your own from{' '}
              <a
                href="https://discord.com/developers/applications"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#4a9eff' }}
              >
                Discord Developer Portal
              </a>
            </small>
          </div>
        );

      default:
        return (
          <div className="plugin-settings">
            <p className="plugin-description">{plugin.description || 'No additional settings available'}</p>
          </div>
        );
    }
  };

  const renderMenuContent = () => {
    switch (activeMenuTab) {
      case 'plugins':
        return (
          <div className="menu-content">
            <h2>Plugins</h2>
            <div className="plugin-grid">
              {/* Unhook Plugin */}
              {plugins.find(p => p.name === 'unhook') && (
                <div
                  className={`plugin-card ${selectedPlugin === 'unhook' ? 'active' : ''}`}
                  onClick={() => setSelectedPlugin(selectedPlugin === 'unhook' ? null : 'unhook')}
                >
                  <div className="plugin-card-header">
                    <span className="plugin-card-name">Unhook</span>
                    <label className="toggle-switch" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={plugins.find(p => p.name === 'unhook')?.enabled || false}
                        onChange={e => {
                          e.stopPropagation();
                          togglePlugin('unhook', e.target.checked);
                        }}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                  <p className="plugin-card-desc">Remove YouTube recommendations, shorts, comments, and distractions</p>
                  {selectedPlugin === 'unhook' && (
                    <div className="plugin-card-settings">
                      {renderPluginSettings(plugins.find(p => p.name === 'unhook')!)}
                    </div>
                  )}
                </div>
              )}

              {plugins
                .filter(plugin => {
                  // Only show essential/commonly used plugins (bad-ui is secret!)
                  const essentialPlugins = ['adblocker', 'sponsorblock', 'downloader', 'unhook', 'discord-rpc', 'browser-ui'];
                  return essentialPlugins.includes(plugin.name);
                })
                .map(plugin => (
                  <div
                    key={plugin.name}
                    className={`plugin-card ${selectedPlugin === plugin.name ? 'active' : ''}`}
                    onClick={() => setSelectedPlugin(selectedPlugin === plugin.name ? null : plugin.name)}
                  >
                    <div className="plugin-card-header">
                      <span className="plugin-card-name">
                        {plugin.name.split('-').map(word =>
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}
                      </span>
                      <label className="toggle-switch" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={plugin.enabled}
                          onChange={e => {
                            e.stopPropagation();
                            togglePlugin(plugin.name, e.target.checked);
                          }}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                    {plugin.description && (
                      <p className="plugin-card-desc">{plugin.description}</p>
                    )}
                    {selectedPlugin === plugin.name && (
                      <div className="plugin-card-settings">
                        {renderPluginSettings(plugin)}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        );


      case 'about':
        return (
          <div className="menu-content">
            <h2>About</h2>
            <div className="about-content">
              <div className="about-header">
                <h3>Better YouTube Music</h3>
                <p className="version">Version {version}</p>
              </div>

              <div className="update-section">
                {updateStatus.type === 'downloaded' ? (
                  <button className="update-btn ready" onClick={installUpdate}>
                    Restart to Install Update
                  </button>
                ) : (
                  <button
                    className="update-btn"
                    onClick={checkForUpdates}
                    disabled={updateStatus.type === 'checking' || updateStatus.type === 'downloading'}
                  >
                    {updateStatus.type === 'checking' ? 'Checking...' :
                      updateStatus.type === 'downloading' ? `Downloading (${updateStatus.progress?.toFixed(0)}%)` :
                        'Check for Updates'}
                  </button>
                )}
                {updateStatus.message && (
                  <p className={`update-status-msg ${updateStatus.type}`}>
                    {updateStatus.message}
                  </p>
                )}
              </div>

              <p className="about-description">
                Open Source YouTube Desktop Client with Plugin System
              </p>
              <div className="about-links">
                <a
                  href="https://github.com/Yabosen/Better-Youtube"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="github-link"
                >
                  GitHub Repository
                </a>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading plugins...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="title-bar">
        <div className="title-bar-title">Better YouTube Music - Settings</div>
      </div>
      <div className="menu-bar">
        <button
          className={`menu-tab ${activeMenuTab === 'plugins' ? 'active' : ''}`}
          onClick={() => setActiveMenuTab('plugins')}
        >
          Plugins
        </button>
        <button
          className={`menu-tab ${activeMenuTab === 'about' ? 'active' : ''}`}
          onClick={() => setActiveMenuTab('about')}
        >
          About
        </button>
      </div>
      <div className="content-area">
        {renderMenuContent()}
      </div>
    </div>
  );
}

export default App;
