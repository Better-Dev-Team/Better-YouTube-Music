import { BrowserWindow } from 'electron';
import { BasePlugin } from '../Plugin';
import type { PluginMetadata } from '../Plugin';

export class AudioOutput extends BasePlugin {
    public metadata: PluginMetadata = {
        name: 'audio-output',
        description: 'Select specific audio output device',
        version: '1.0.0',
    };

    public async onRendererLoaded(window: BrowserWindow): Promise<void> {
        const script = this.getRendererScript();
        try {
            await window.webContents.executeJavaScript(script);
        } catch (error) {
            console.error('[AudioOutput] Error injecting script:', error);
        }
    }

    public async onConfigChanged(): Promise<void> {
        if (this.mainWindow) {
            const config = this.getConfig();
            const deviceId = config.deviceId || '';
            const code = `if (window.__setAudioOutputDevice) window.__setAudioOutputDevice('${deviceId}');`;
            await this.mainWindow.webContents.executeJavaScript(code).catch(() => { });
        }
    }

    private mainWindow: BrowserWindow | null = null;

    public async onWindowCreated(window: BrowserWindow): Promise<void> {
        this.mainWindow = window;
    }

    private getRendererScript(): string {
        const config = this.getConfig();
        const deviceId = config.deviceId || '';

        // We wrap in a function that runs periodically or observes video creation
        return `
      (function() {
        if (window.__audioOutputInjected) return;
        window.__audioOutputInjected = true;

        let targetDeviceId = '${deviceId}';

        async function updateAudioDevice() {
           const video = document.querySelector('video');
           if (!video || typeof video.setSinkId !== 'function') return;
           
           if (video.sinkId !== targetDeviceId) {
               try {
                   await video.setSinkId(targetDeviceId);
                   console.log('[AudioOutput] Applied audio device:', targetDeviceId || 'default');
               } catch (err) {
                   console.warn('[AudioOutput] Error setting sinkId:', err);
               }
           }
        }

        // Observer for video element addition
        const observer = new MutationObserver(() => {
            updateAudioDevice();
        });
        observer.observe(document.body, { childList: true, subtree: true });
        
        // Also interval check
        setInterval(updateAudioDevice, 2000);
        
        // Listen for config changes from main process if we set up IPC? 
        // For now, onConfigChanged in main re-executes the setter, which is fine.
        // But to make the script aware of updates from the re-execution, 
        // the re-execution snippet (in onConfigChangedFunc) works.
        // This script's primary job is ensuring NEW video elements get the device.
        
        // We need to allow the renderer to receive updates.
        // Actually, re-declaring 'targetDeviceId' in a new execution context won't update THIS closure.
        // So we should expose a global function or variable.
        
        window.__setAudioOutputDevice = (id) => {
            targetDeviceId = id;
            updateAudioDevice();
        };
        
        updateAudioDevice();
      })();
    `;
    }


}
