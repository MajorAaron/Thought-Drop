const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveNote: (data) => ipcRenderer.invoke('save-note', data),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  onClearForm: (callback) => ipcRenderer.on('clear-form', callback),
  getShortcut: () => ipcRenderer.invoke('get-shortcut'),
  setShortcut: (accelerator) => ipcRenderer.invoke('set-shortcut', accelerator),
  getVaultPath: () => ipcRenderer.invoke('get-vault-path'),
  setVaultPath: (vaultPath) => ipcRenderer.invoke('set-vault-path', vaultPath),
  selectVaultDirectory: () => ipcRenderer.invoke('select-vault-directory')
});
