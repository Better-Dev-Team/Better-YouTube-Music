# Better YouTube Music

An open-source YouTube Desktop Client built with Electron, TypeScript, and Vite. Features a modular plugin system for customizing your YouTube experience.

## Features

- 🎥 Native YouTube experience in a desktop app
- 🔌 Modular plugin system
- 🛡️ Built-in ad blocker
- ⚙️ React-based settings window
- 🎨 Customizable via plugins

## Plugins

### Included Plugins

1. **AdBlocker** - Blocks ads at the network level using filter lists
2. **SponsorBlock** - Automatically skips sponsored segments
3. **Return YouTube Dislike** - Shows dislike counts using the RYD API
4. **Unhook / UI Cleaner** - Hide Shorts, Comments, Recommendations
5. **Discord RPC** - Show "Watching [Video]" on Discord

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

3. Run in development mode:
```bash
npm run electron:dev
```

### Project Structure

```
better-youtube/
├── src/
│   ├── main/           # Electron main process
│   │   ├── index.ts    # Main window setup
│   │   ├── plugins.ts  # Plugin loader
│   │   └── discord-rpc.ts
│   ├── preload/        # Preload scripts
│   ├── plugins/        # Default plugins
│   │   ├── sponsorblock/
│   │   ├── return-dislike/
│   │   ├── unhook/
│   │   └── volume-booster/
│   └── settings/       # React settings UI
├── dist/               # Build output
└── package.json
```

## Building

```bash
npm run build
npm run electron:build
```

## Plugin Development

Plugins are stored in `%APPDATA%/better-youtube/plugins/` (or equivalent on macOS/Linux).

Each plugin directory should contain:
- `renderer.js` - Code injected into the YouTube page
- `preload.js` (optional) - IPC communication

### Example Plugin

```javascript
// plugins/my-plugin/renderer.js
(function() {
  'use strict';
  
  // Your plugin code here
  console.log('My plugin loaded!');
})();
```

## Configuration

Plugin settings are stored using `electron-store` in the app's user data directory.

## Discord RPC Setup

1. Create a Discord application at https://discord.com/developers/applications
2. Get your Client ID
3. Update `src/main/discord-rpc.ts` with your Client ID

## License

MIT
