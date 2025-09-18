const { app, BrowserWindow, globalShortcut, ipcMain, shell } = require('electron');
const path = require('path');

let mainWindow;
let isVisible = false;

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

app.whenReady().then(() => {
  createWindow();

  // Register global shortcut (Cmd+Shift+Space)
  globalShortcut.register('CommandOrControl+Shift+Space', () => {
    toggleWindow();
  });

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

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});