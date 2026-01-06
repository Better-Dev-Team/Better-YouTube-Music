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

           // Validate device exists
           try {
               const devices = await navigator.mediaDevices.enumerateDevices();
               const audioDevices = devices.filter(d => d.kind === 'audiooutput');
               const deviceExists = audioDevices.some(d => d.deviceId === targetDeviceId);
               
               if (!deviceExists) {
                   console.log('[AudioOutput] Target device not found:', targetDeviceId, 'Available:', audioDevices.map(d => d.label));
                   return; 
               }
           } catch (e) {
               console.warn('[AudioOutput] Error enumerating devices:', e);
               // Proceed anyway if enumeration fails, might be a permission issue but setSinkId might work
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
        
        // Also interval check
        setInterval(updateAudioDevice, 2000);
        
        window.__setAudioOutputDevice = (id) => {
            targetDeviceId = id;
            updateAudioDevice();
        };
        
        updateAudioDevice();
      })();
    `;
    }


}
