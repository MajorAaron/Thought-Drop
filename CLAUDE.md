# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Thought Drop is an Electron-based macOS application that provides a Spotlight-like quick note capture interface for Obsidian. The app uses a global keyboard shortcut (⌘+Shift+Space) to instantly capture thoughts and save them directly to an Obsidian vault.

## Commands

### Development
```bash
# Run in development mode
npm start
# or use the launch script
./launch.sh
```

### Build & Distribution
```bash
# Build macOS app (creates .dmg and .zip in dist/)
npm run dist

# After building, open the app directly
open "dist/mac-arm64/Obsidian Quick Note.app"

# Or install from DMG
open "dist/Obsidian Quick Note-1.0.0-arm64.dmg"
```

## Architecture

### Core Components

1. **main.js:1-101** - Main Electron process
   - Creates frameless, transparent, always-on-top window
   - Manages global shortcut registration (⌘+Shift+Space)
   - Handles IPC communication for note saving via Obsidian URI protocol
   - Auto-hides window on blur or after save

2. **renderer.js** - Renderer process
   - Manages form state (title and body inputs)
   - Handles keyboard shortcuts (⌘+Enter to save, ESC to cancel)
   - Communicates with main process via IPC

3. **preload.js** - Security bridge
   - Exposes limited API to renderer via contextBridge
   - Maintains security with context isolation

### Key Implementation Details

- **Obsidian Integration**: Uses `obsidian://new?vault=OBSIDIAN` URI protocol (main.js:80)
- **Window Configuration**: 600x250px, centered horizontally at 15% from top (main.js:8-22)
- **Note Naming**: Auto-generates `Mac-Note-YYYY-MM-DD-HH-MM-SS` format if no title provided (main.js:75-76)
- **Security**: Context isolation enabled, node integration disabled (main.js:17-20)

## Important Configuration

### Hardcoded Values
- **Obsidian vault name**: "OBSIDIAN" (main.js:80) - Change this to match your vault name
- **Global shortcut**: "CommandOrControl+Shift+Space" (main.js:67)
- **Window dimensions**: 600x250 (main.js:9-10)

### Build Configuration
- **App ID**: com.obsidian.quicknote
- **Icon files**: icon.icns (macOS), icon.png (fallback)
- **Platform**: macOS ARM64 primary target

## Project Structure
```
├── main.js              # Main process
├── preload.js           # IPC bridge
├── renderer.js          # UI logic
├── index.html           # UI template
├── package.json         # Dependencies & scripts
├── icon.icns/.png       # App icons
├── icons/               # Multiple icon sizes
└── dist/                # Built distributions
```

## Common Tasks

### Changing the Obsidian Vault
Edit line 80 in main.js:
```javascript
const obsidianUrl = `obsidian://new?vault=YOUR_VAULT_NAME&file=${encodedPath}&content=${encodedBody}&silent=true`;
```

### Modifying the Global Shortcut
Edit line 67 in main.js:
```javascript
globalShortcut.register('YOUR_SHORTCUT_HERE', () => {
```

### Adjusting Window Size/Position
Edit lines 9-10 and 30-33 in main.js for dimensions and positioning.

## Testing Approach

No automated tests currently. Manual testing involves:
1. Launch app with `npm start`
2. Test global shortcut activation
3. Verify note saves to Obsidian
4. Test ESC and ⌘+Enter shortcuts
5. Verify auto-hide on blur