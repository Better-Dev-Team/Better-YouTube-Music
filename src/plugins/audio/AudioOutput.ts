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
        let availableDevices = [];

        async function updateDeviceList() {
           try {
               const devices = await navigator.mediaDevices.enumerateDevices();
               availableDevices = devices.filter(d => d.kind === 'audiooutput');
               updateAudioDevice();
           } catch (e) {
               console.warn('[AudioOutput] Error enumerating devices:', e);
           }
        }

        async function updateAudioDevice() {
           const video = document.querySelector('video');
           if (!video || typeof video.setSinkId !== 'function') return;
           
           // If target is empty, we just want default
           if (!targetDeviceId) {
               if (video.sinkId !== '') {
                   try {
                       await video.setSinkId('');
                       console.log('[AudioOutput] Reset to default audio device');
                   } catch (err) {
                       console.warn('[AudioOutput] Error resetting sinkId:', err.name, err.message);
                   }
               }
               return;
           }

           // Validate device exists using cache
           const deviceExists = availableDevices.some(d => d.deviceId === targetDeviceId);

           if (!deviceExists) {
               // We refrain from logging here on every mutation to avoid spamming console
               // if the device is disconnected.
               return;
           }

           if (video.sinkId !== targetDeviceId) {
               try {
                   await video.setSinkId(targetDeviceId);
                   console.log('[AudioOutput] Applied audio device:', targetDeviceId);
               } catch (err) {
                   console.warn('[AudioOutput] Error setting sinkId:', err.name, err.message);
               }
           }
        }

        // Observer for video element addition
        const observer = new MutationObserver(() => {
            updateAudioDevice();
        });
        observer.observe(document.body, { childList: true, subtree: true });
        
        // Listen for device changes
        if (navigator.mediaDevices) {
            navigator.mediaDevices.addEventListener('devicechange', updateDeviceList);
        }
        
        window.__setAudioOutputDevice = (id) => {
            targetDeviceId = id;
            // When config changes, we might want to refresh list just in case,
            // or just try to apply. For performance, assuming list is up to date via listener.
            updateAudioDevice();
        };
        
        // Initial check
        updateDeviceList();
      })();
    `;
    }


}
