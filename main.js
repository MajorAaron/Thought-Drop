const { app, BrowserWindow, globalShortcut, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let isVisible = false;
let registeredShortcut = null;
let settingsPath;

const DEFAULT_SHORTCUT = 'CommandOrControl+Shift+=';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 250,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    show: false,
    skipTaskbar: true,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');

  // Center window on screen
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  mainWindow.setPosition(
    Math.round((width - 600) / 2),
    Math.round(height * 0.15)
  );

  // Hide when loses focus
  mainWindow.on('blur', () => {
    if (isVisible) {
      hideWindow();
    }
  });
}

function toggleWindow() {
  if (isVisible) {
    hideWindow();
  } else {
    showWindow();
  }
}

function showWindow() {
  mainWindow.show();
  mainWindow.focus();
  isVisible = true;
}

function hideWindow() {
  mainWindow.hide();
  isVisible = false;
  mainWindow.webContents.send('clear-form');
}

function ensureSettingsPath() {
  if (!settingsPath) {
    settingsPath = path.join(app.getPath('userData'), 'settings.json');
  }
  return settingsPath;
}

function readShortcutFromDisk() {
  const filePath = ensureSettingsPath();

  if (!fs.existsSync(filePath)) {
    return DEFAULT_SHORTCUT;
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.globalShortcut === 'string' && parsed.globalShortcut.trim()) {
      return parsed.globalShortcut.trim();
    }
  } catch (error) {
    console.warn('Failed to read shortcut settings:', error);
  }

  return DEFAULT_SHORTCUT;
}

function persistShortcut(shortcut) {
  try {
    const filePath = ensureSettingsPath();
    const payload = { globalShortcut: shortcut };
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');
  } catch (error) {
    console.warn('Failed to save shortcut settings:', error);
  }
}

function setGlobalShortcut(accelerator, options = {}) {
  const { persist = true } = options;

  if (!accelerator || typeof accelerator !== 'string' || !accelerator.trim()) {
    return { success: false, error: 'Invalid shortcut' };
  }

  const trimmedAccelerator = accelerator.trim();
  const previousShortcut = registeredShortcut;

  if (previousShortcut) {
    globalShortcut.unregister(previousShortcut);
  }

  const success = globalShortcut.register(trimmedAccelerator, () => {
    toggleWindow();
  });

  if (!success) {
    if (previousShortcut) {
      globalShortcut.register(previousShortcut, () => {
        toggleWindow();
      });
    }
    return { success: false, error: 'Shortcut is already in use' };
  }

  registeredShortcut = trimmedAccelerator;

  if (persist) {
    persistShortcut(trimmedAccelerator);
  }

  return { success: true, shortcut: trimmedAccelerator };
}

app.whenReady().then(() => {
  // Set dock icon for macOS
  if (process.platform === 'darwin') {
    app.dock.setIcon(path.join(__dirname, 'icon.png'));
  }

  const settingsFilePath = ensureSettingsPath();
  const settingsExists = fs.existsSync(settingsFilePath);
  const storedShortcut = settingsExists ? readShortcutFromDisk() : DEFAULT_SHORTCUT;
  const initialResult = setGlobalShortcut(storedShortcut, { persist: !settingsExists });

  if (!initialResult.success) {
    if (storedShortcut !== DEFAULT_SHORTCUT) {
      const fallbackResult = setGlobalShortcut(DEFAULT_SHORTCUT, { persist: true });
      if (!fallbackResult.success) {
        console.warn('Unable to register default global shortcut.');
      }
    } else {
      console.warn('Unable to register default global shortcut.');
    }
  }

  ipcMain.handle('get-shortcut', () => ({
    shortcut: registeredShortcut || DEFAULT_SHORTCUT,
    registered: !!registeredShortcut
  }));

  ipcMain.handle('set-shortcut', (event, accelerator) => {
    const result = setGlobalShortcut(accelerator);
    if (!result.success) {
      return {
        success: false,
        error: result.error,
        shortcut: registeredShortcut || DEFAULT_SHORTCUT
      };
    }

    return {
      success: true,
      shortcut: result.shortcut
    };
  });

  createWindow();

  // Handle save note
  ipcMain.handle('save-note', async (event, { title, body }) => {
    // Generate filename: Mac-Note-YYYY-MM-DD-HH-MM-SS
    const now = new Date();
    const dateTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
    const noteTitle = title || `Mac-Note-${dateTime}`;
    const encodedBody = encodeURIComponent(body);
    const encodedPath = encodeURIComponent(noteTitle);
    // Using 'create' instead of 'new' to create note without opening it
    const obsidianUrl = `obsidian://new?vault=OBSIDIAN&file=${encodedPath}&content=${encodedBody}&silent=true`;

    shell.openExternal(obsidianUrl);
    hideWindow();
    return { success: true };
  });

  // Handle escape
  ipcMain.handle('close-window', () => {
    hideWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow) {
    showWindow();
  }

  if (registeredShortcut) {
    if (!globalShortcut.isRegistered(registeredShortcut)) {
      const result = setGlobalShortcut(registeredShortcut, { persist: false });
      if (!result.success) {
        console.warn('Failed to restore global shortcut on activate.');
      }
    }
  } else {
    const fallbackResult = setGlobalShortcut(DEFAULT_SHORTCUT, { persist: false });
    if (!fallbackResult.success) {
      console.warn('Failed to register fallback shortcut on activate.');
    }
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
