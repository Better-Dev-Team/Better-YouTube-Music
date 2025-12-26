import { BrowserWindow, ipcMain } from 'electron';
import { BasePlugin } from '../Plugin';
import type { PluginMetadata } from '../Plugin';
import { app } from 'electron';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

/**
 * Downloader Plugin
 * Downloads YouTube videos using yt-dlp or ytdl-core
 */
export class Downloader extends BasePlugin {
  public metadata: PluginMetadata = {
    name: 'downloader',
    description: 'Download YouTube videos and audio',
    version: '1.0.0',
  };

  private downloadQueue: Map<string, any> = new Map();

  public async onAppReady(): Promise<void> {
    if (!this.isEnabled()) return;

    // Set up IPC handlers for download requests
    ipcMain.handle('downloader:download', async (event, videoUrl: string, options: any) => {
      return this.downloadVideo(videoUrl, options);
    });

    ipcMain.handle('downloader:get-progress', async (event, downloadId: string) => {
      return this.downloadQueue.get(downloadId);
    });

    // Ensure download directory exists
    const downloadDir = this.getDownloadDirectory();
    if (!existsSync(downloadDir)) {
      mkdirSync(downloadDir, { recursive: true });
    }
  }

  private getDownloadDirectory(): string {
    const config = this.getConfig();
    if (config.downloadPath) {
      return config.downloadPath;
    }
    return join(app.getPath('userData'), 'downloads');
  }

  private async downloadVideo(videoUrl: string, options: any): Promise<any> {
    const downloadId = `download_${Date.now()}`;
    
    try {
      // Try to use yt-dlp if available, otherwise fall back to ytdl-core
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      const downloadDir = this.getDownloadDirectory();
      const config = this.getConfig();
      
      // Check if yt-dlp is available
      try {
        await execAsync('yt-dlp --version');
        
        // Use yt-dlp
        const format = options.format || 'best';
        const outputPath = join(downloadDir, '%(title)s.%(ext)s');
        
        const command = `yt-dlp -f "${format}" -o "${outputPath}" "${videoUrl}"`;
        
        this.downloadQueue.set(downloadId, {
          id: downloadId,
          status: 'downloading',
          progress: 0,
        });
        
        // Execute download
        exec(command, (error, stdout, stderr) => {
          if (error) {
            this.downloadQueue.set(downloadId, {
              id: downloadId,
              status: 'error',
              error: error.message,
            });
          } else {
            this.downloadQueue.set(downloadId, {
              id: downloadId,
              status: 'completed',
              progress: 100,
            });
          }
        });
        
        return { downloadId, status: 'started' };
      } catch {
        // yt-dlp not available, try ytdl-core
        return this.downloadWithYtdlCore(videoUrl, options, downloadId);
      }
    } catch (error: any) {
      console.error('Downloader: Error starting download:', error);
      return { downloadId, status: 'error', error: error.message };
    }
  }

  private async downloadWithYtdlCore(videoUrl: string, options: any, downloadId: string): Promise<any> {
    try {
      // Dynamic import to avoid requiring ytdl-core if not installed
      // @ts-ignore - ytdl-core may not be installed
      const ytdl = await import('ytdl-core').catch(() => null);
      
      if (!ytdl) {
        throw new Error('ytdl-core not installed. Install it with: npm install ytdl-core');
      }
      
      const info = await ytdl.getInfo(videoUrl);
      const format = ytdl.chooseFormat(info.formats, { quality: options.quality || 'highest' });
      
      const { createWriteStream } = await import('fs');
      const { pipeline } = await import('stream/promises');
      const path = await import('path');
      
      const downloadDir = this.getDownloadDirectory();
      const filename = `${info.videoDetails.title.replace(/[^a-z0-9]/gi, '_')}.${format.container}`;
      const outputPath = join(downloadDir, filename);
      
      const videoStream = ytdl.default ? ytdl.default(videoUrl, { format }) : (ytdl as any)(videoUrl, { format });
      const writeStream = createWriteStream(outputPath);
      
      this.downloadQueue.set(downloadId, {
        id: downloadId,
        status: 'downloading',
        progress: 0,
      });
      
      await pipeline(videoStream, writeStream);
      
      this.downloadQueue.set(downloadId, {
        id: downloadId,
        status: 'completed',
        progress: 100,
        path: outputPath,
      });
      
      return { downloadId, status: 'completed', path: outputPath };
    } catch (error: any) {
      console.error('Downloader: Error with ytdl-core:', error);
      throw error;
    }
  }

  public getConfig() {
    return {
      downloadPath: null, // Will use default
      defaultQuality: 'highest',
      defaultFormat: 'best',
      ...super.getConfig(),
    };
  }
}

