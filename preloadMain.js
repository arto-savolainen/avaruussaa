const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  onUpdateActivity: (callback) => ipcRenderer.on('update-activity', callback)
})