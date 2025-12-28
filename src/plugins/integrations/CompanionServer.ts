import { BrowserWindow } from 'electron';
import { BasePlugin } from '../Plugin';
import type { PluginMetadata } from '../Plugin';
import * as http from 'http';

/**
 * Companion Server Plugin
 * Emulates the YouTube Music Desktop App API (port 9863)
 * for compatibility with widgets like Amuse.
 */
export class CompanionServer extends BasePlugin {
    public metadata: PluginMetadata = {
        name: 'companion-server',
        description: 'API Server for external widgets (Amuse, Stream Deck)',
        version: '1.0.0',
    };

    private server: http.Server | null = null;
    private currentTrack: any = {
        title: 'Idle',
        artist: 'Waiting for music...',
        album: '',
        duration: 0,
        position: 0,
        isPaused: true,
        cover: ''
    };

    public async onAppReady(): Promise<void> {
        if (this.isEnabled()) {
            this.startServer();
        }
    }

    public async onDisabled(): Promise<void> {
        this.stopServer();
    }

    public async onConfigChanged(): Promise<void> {
        if (this.isEnabled() && !this.server) {
            this.startServer();
        } else if (!this.isEnabled() && this.server) {
            this.stopServer();
        }
    }

    private startServer() {
        if (this.server) return;

        this.server = http.createServer((req, res) => {
            // CORS headers
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

            if (req.method === 'OPTIONS') {
                res.writeHead(204);
                res.end();
                return;
            }

            if (req.url === '/api/v1/state' || req.url === '/query') {
                this.handleStateRequest(res);
            } else if (req.url?.startsWith('/api/v1/auth')) {
                this.handleAuthRequest(req, res);
            } else {
                res.writeHead(404);
                res.end(JSON.stringify({ error: 'Not found' }));
            }
        });

        const port = this.getConfig().port || 9863;
        this.server.listen(port, () => {
            console.log(`[CompanionServer] Listening on port ${port}`);
        });

        this.server.on('error', (err: any) => {
            console.error('[CompanionServer] Server error:', err);
        });
    }

    private stopServer() {
        if (this.server) {
            this.server.close();
            this.server = null;
            console.log('[CompanionServer] Stopped');
        }
    }

    // Update state from main process
    public updateState(videoInfo: any) {
        this.currentTrack = {
            title: videoInfo.title,
            artist: videoInfo.channel || videoInfo.artist,
            album: videoInfo.album || '',
            duration: videoInfo.songDuration || 0,
            position: videoInfo.elapsedSeconds || 0,
            isPaused: videoInfo.isPaused, // Note: YTMDesktop might invert logic or use 'playing', handled in response
            cover: videoInfo.imageSrc || videoInfo.thumbnailUrl,
            id: videoInfo.id
        };
    }

    private handleStateRequest(res: http.ServerResponse) {
        // Format to match YTMDesktop API
        const response = {
            player: {
                track: {
                    title: this.currentTrack.title,
                    author: this.currentTrack.artist,
                    album: this.currentTrack.album,
                    cover: this.currentTrack.cover,
                    duration: this.currentTrack.duration,
                    durationHuman: this.formatTime(this.currentTrack.duration),
                    url: `https://music.youtube.com/watch?v=${this.currentTrack.id}`
                },
                statePercent: this.currentTrack.duration > 0 ? this.currentTrack.position / this.currentTrack.duration : 0,
                likeStatus: 'INDIFFERENT',
                repeatType: 'NONE',
                playState: this.currentTrack.isPaused ? 0 : 1, // 0 = unknown/stopped/paused?, 1 = playing. YTMDesktop: 0=stopped, 1=playing, 2=paused. 
                volume: 100,
                seekbarCurrentPosition: this.currentTrack.position,
                seekbarCurrentPositionHuman: this.formatTime(this.currentTrack.position),
            },
            version: '2.3.0'
        };

        // Adjust playState mapping if needed. YTMDesktop:
        // 0: Unknown, 1: Playing, 2: Paused
        if (this.currentTrack.isPaused) {
            response.player.playState = 2;
        } else {
            response.player.playState = 1;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
    }

    private handleAuthRequest(req: http.IncomingMessage, res: http.ServerResponse) {
        // Dummy auth to satisfy clients
        if (req.url === '/api/v1/auth/requestcode') {
            // Return success, no code needed
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ code: '123456' }));
        } else if (req.url === '/api/v1/auth/request') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ token: 'dummy-token', accessToken: 'dummy-token' }));
        } else {
            res.writeHead(200);
            res.end(JSON.stringify({ success: true }));
        }
    }

    private formatTime(seconds: number): string {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    public getConfig() {
        return {
            port: 9863,
            ...super.getConfig()
        };
    }
}
