# Thought Drop

A Spotlight-like quick note capture application built with Electron. Instantly capture thoughts and ideas with a global keyboard shortcut, seamlessly saving them directly to your local notes folder.

![Thought Drop](https://img.shields.io/badge/Platform-macOS-blue?style=flat-square)
![Electron](https://img.shields.io/badge/Built%20with-Electron-47848F?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

## ✨ Features

- **Global Hotkey**: Press `⌘+Shift+Space` from anywhere to instantly open the note capture window
- **Spotlight-like UI**: Beautiful, translucent interface that appears centered on your screen
- **Quick Capture**: Minimal, distraction-free interface for rapid note-taking
- **Local Storage**: Notes are automatically saved to your configured local folder
- **Smart Naming**: Auto-generates timestamped filenames if no title is provided
- **Keyboard Shortcuts**: 
  - `⌘+Enter` to save
  - `ESC` to cancel
- **Auto-hide**: Window automatically hides when it loses focus or after saving

## 🚀 Installation

### Prerequisites

- macOS (tested on macOS 10.15+)
- Node.js 16+ 
- A folder to save your notes

### Quick Start (Development)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "Thought Drop"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the app easily**
   ```bash
   # Option 1: Use the launch script (recommended)
   ./launch.sh
   
   # Option 2: Use npm directly
   npm start
   ```

### Production Installation

1. **Build the macOS app bundle**
   ```bash
   npm run dist
   ```

2. **Install the app**
   - The built app will be in `dist/mac-arm64/Thought Drop.app`
   - Drag it to your Applications folder
   - Double-click to launch (it will run in the background)
   - Press `⌘+Shift+Space` from anywhere to capture notes!

### Alternative: Use the DMG installer

- Open `dist/Thought Drop-1.0.0-arm64.dmg`
- Drag the app to Applications folder
- Launch from Applications or Spotlight

## 📖 Usage

1. **Launch the app** - The app will start in the background and register the global hotkey
2. **Capture a note** - Press `⌘+Shift+Space` from anywhere to open the note capture window
3. **Type your note** - Enter a title (optional) and your note content
4. **Save** - Press `⌘+Enter` or click the Save button
5. **Auto-save** - The note will be automatically saved to your configured folder and the window will close

### Note Naming Convention

- If you provide a title: Uses your custom title
- If no title provided: Auto-generates `Mac-Note-YYYY-MM-DD-HH-MM-SS`

## ⚙️ Configuration

The app saves notes to `~/Documents/Thought Drop` by default. To change this:

1. Click the "Change" button next to the folder path in the app UI
2. Select your desired folder
3. The setting will be saved automatically

## 🛠️ Development

### Project Structure

```
├── main.js          # Main Electron process
├── preload.js       # Preload script for secure IPC
├── renderer.js      # Renderer process logic
├── index.html       # UI template
├── package.json     # Dependencies and build config
└── README.md        # This file
```

### Key Technologies

- **Electron**: Cross-platform desktop app framework
- **Node.js**: JavaScript runtime
- **HTML/CSS/JavaScript**: Frontend technologies
- **Local File System**: Direct file saving

### Building

The app uses `electron-builder` for packaging:

- `npm run build` - Build for current platform
- `npm run dist` - Create macOS distribution package

## 🔧 Troubleshooting

### Global Hotkey Not Working

- Ensure the app is running (check Activity Monitor)
- Try restarting the app
- Check if another app is using the same hotkey combination

### Notes Not Saving

- Verify the folder path exists and is writable
- Check folder permissions
- Try selecting a different folder via the app UI

### App Won't Start

- Check Node.js version: `node --version` (requires 16+)
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check for port conflicts

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📧 Support

If you encounter any issues or have questions:

1. Check the troubleshooting section above
2. Search existing issues
3. Create a new issue with detailed information about your problem

---

**Enjoy capturing your thoughts instantly with Thought Drop!** 🎉
