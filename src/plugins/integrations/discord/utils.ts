import { HANGUL_FILLER } from './constants';

/**
 * Truncates a string to a specified length, adding ellipsis if truncated.
 * @param str - The string to truncate.
 * @param length - The maximum allowed length.
 * @returns The truncated string.
 */
export const truncateString = (str: string, length: number): string => {
  if (str.length > length) {
    return `${str.substring(0, length - 3)}...`;
  }
  return str;
};

/**
 * Video information structure for Discord Rich Presence
 */
export interface VideoInfo {
  id: string;
  title: string;
  channel: string;
  startTime: number;
  url?: string;
  imageSrc?: string;
  isPaused?: boolean;
  elapsedSeconds?: number;
  songDuration?: number;
  alternativeTitle?: string;
  artist?: string;
  album?: string;
  artistUrl?: string;
  tags?: string[];
  videoId?: string;
}

/**
 * Builds the array of buttons for the Discord Rich Presence activity.
 * @param config - The plugin configuration.
 * @param videoInfo - The current video information.
 * @returns An array of buttons or undefined if no buttons are configured.
 */
export const buildDiscordButtons = (
  config: any,
  videoInfo: VideoInfo,
): Array<{ label: string; url: string }> | undefined => {
  const buttons: Array<{ label: string; url: string }> = [];
  if (config.playOnYouTube && videoInfo.url) {
    buttons.push({
      label: 'Watch on YouTube',
      url: videoInfo.url,
    });
  }
  if (!config.hideGitHubButton) {
    buttons.push({
      label: 'View App On GitHub',
      url: 'https://github.com/Yabosen/Better-Youtube',
    });
  }
  return buttons.length ? buttons : undefined;
};

/**
 * Pads Hangul fields (title, artist, album) in VideoInfo if they are less than 2 characters long.
 * Discord requires fields to be at least 2 characters.
 * @param videoInfo - The video information object (will be mutated).
 */
export const padHangulFields = (videoInfo: VideoInfo): void => {
  (['title', 'artist', 'album'] as const).forEach((key) => {
    const value = videoInfo[key];
    if (typeof value === 'string' && value.length > 0 && value.length < 2) {
      videoInfo[key] = value + HANGUL_FILLER.repeat(2 - value.length);
    }
  });
};

/**
 * Checks if the difference between two time values indicates a seek operation.
 * @param oldSeconds - The previous elapsed time in seconds.
 * @param newSeconds - The current elapsed time in seconds.
 * @returns True if the time difference suggests a seek, false otherwise.
 */
export const isSeek = (oldSeconds: number, newSeconds: number): boolean => {
  // Consider it a seek if the time difference is greater than 2 seconds
  // (allowing for minor discrepancies in reporting)
  return Math.abs(newSeconds - oldSeconds) > 2;
};

