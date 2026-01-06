/**
 * Plugin System Entry Point
 * Exports all plugin-related classes and interfaces
 */

export { BasePlugin } from './Plugin';
export type { Plugin, PluginHooks, PluginMetadata, PluginConfig } from './Plugin';
export { PluginLoader } from './PluginLoader';

// Core Plugins
export { AdBlocker } from './core/AdBlocker';
export { SponsorBlock } from './core/SponsorBlock';
export { Downloader } from './core/Downloader';
export { Unhook } from './core/Unhook';


// UI Plugins
export { AlbumColorTheme } from './ui/AlbumColorTheme';
export { BetterFullscreen } from './ui/BetterFullscreen';

export { InAppMenu } from './ui/InAppMenu';
export { AppMenuBar } from './ui/AppMenuBar';
export { BrowserUI } from './ui/BrowserUI';
export { BetterLyrics } from './ui/BetterLyrics';

// Integration Plugins
export { DiscordRPCPlugin } from './integrations/DiscordRPC';
export { LastFM } from './integrations/LastFM';
export { ListenBrainz } from './integrations/ListenBrainz';
export { CompanionServer } from './integrations/CompanionServer';

// Audio Plugins
export { AudioCompressor } from './audio/AudioCompressor';
export { ExponentialVolume } from './audio/ExponentialVolume';
export { VolumeBooster } from './audio/VolumeBooster';
export { AudioOutput } from './audio/AudioOutput';


