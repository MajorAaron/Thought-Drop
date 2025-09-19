const { app, BrowserWindow, globalShortcut, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let isVisible = false;
let registeredShortcut = null;
let settingsPath;

const DEFAULT_SHORTCUT = 'CommandOrControl+Shift+=';
const DEFAULT_VAULT_PATH = path.join(app.getPath('home'), 'Documents', 'Thought Drop');

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

function readSettingsFromDisk() {
  const filePath = ensureSettingsPath();

  if (!fs.existsSync(filePath)) {
    return {
      globalShortcut: DEFAULT_SHORTCUT,
      vaultPath: DEFAULT_VAULT_PATH
    };
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      globalShortcut: parsed.globalShortcut || DEFAULT_SHORTCUT,
      vaultPath: parsed.vaultPath || DEFAULT_VAULT_PATH
    };
  } catch (error) {
    console.warn('Failed to read settings:', error);
    return {
      globalShortcut: DEFAULT_SHORTCUT,
      vaultPath: DEFAULT_VAULT_PATH
    };
  }
}

function readShortcutFromDisk() {
  const settings = readSettingsFromDisk();
  return settings.globalShortcut;
}

function persistSettings(updates) {
  try {
    const filePath = ensureSettingsPath();
    const currentSettings = readSettingsFromDisk();
    const newSettings = { ...currentSettings, ...updates };
    fs.writeFileSync(filePath, JSON.stringify(newSettings, null, 2), 'utf8');
  } catch (error) {
    console.warn('Failed to save settings:', error);
  }
}

function persistShortcut(shortcut) {
  persistSettings({ globalShortcut: shortcut });
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

  // Handle save note - Direct file saving
  ipcMain.handle('save-note', async (event, { title, body }) => {
    try {
      // Get vault path from settings
      const settings = readSettingsFromDisk();
      const vaultPath = settings.vaultPath;

      // Ensure vault directory exists
      if (!fs.existsSync(vaultPath)) {
        fs.mkdirSync(vaultPath, { recursive: true });
      }

      // Generate filename: Mac-Note-YYYY-MM-DD-HH-MM-SS
      const now = new Date();
      const dateTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
      const noteTitle = title || `Mac-Note-${dateTime}`;

      // Sanitize filename (remove invalid characters)
      const sanitizedTitle = noteTitle.replace(/[<>:"/\\|?*]/g, '-');
      const fileName = `${sanitizedTitle}.md`;
      const filePath = path.join(vaultPath, fileName);

      // Prepare note content with optional title as heading
      let noteContent = body;
      if (title) {
        noteContent = `# ${title}\n\n${body}`;
      }

      // Write the file
      fs.writeFileSync(filePath, noteContent, 'utf8');

      hideWindow();
      return { success: true, filePath };
    } catch (error) {
      console.error('Failed to save note:', error);
      return { success: false, error: error.message };
    }
  });

  // Handle vault path operations
  ipcMain.handle('get-vault-path', () => {
    const settings = readSettingsFromDisk();
    return settings.vaultPath;
  });

  ipcMain.handle('set-vault-path', async (event, vaultPath) => {
    try {
      // Validate path
      if (!vaultPath || typeof vaultPath !== 'string') {
        return { success: false, error: 'Invalid path' };
      }

      // Create directory if it doesn't exist
      if (!fs.existsSync(vaultPath)) {
        fs.mkdirSync(vaultPath, { recursive: true });
      }

      persistSettings({ vaultPath });
      return { success: true, vaultPath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('select-vault-directory', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select folder to save notes',
      buttonLabel: 'Select Folder'
    });

    if (result.canceled) {
      return { success: false, canceled: true };
    }

    const vaultPath = result.filePaths[0];
    persistSettings({ vaultPath });
    return { success: true, vaultPath };
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
