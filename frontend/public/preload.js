const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // File dialogs
  showSaveDialog: () => ipcRenderer.invoke('show-save-dialog'),
  showOpenDialog: () => ipcRenderer.invoke('show-open-dialog'),
  
  // Menu events
  onMenuNewExam: (callback) => {
    ipcRenderer.on('menu-new-exam', callback);
    return () => ipcRenderer.removeListener('menu-new-exam', callback);
  },
  
  // Platform info
  platform: process.platform,
  
  // App events
  onAppReady: (callback) => {
    ipcRenderer.on('app-ready', callback);
    return () => ipcRenderer.removeListener('app-ready', callback);
  }
});

// Expose a limited set of Node.js APIs
contextBridge.exposeInMainWorld('nodeAPI', {
  platform: process.platform,
  arch: process.arch,
  versions: process.versions
});

console.log('Preload script loaded successfully');
