const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  onSetUIConfiguration: (config) => ipcRenderer.on('set-config', config),
  onUpdateActivity: (activity) => ipcRenderer.on('update-activity', activity),
  setNotificationInterval: (interval) => ipcRenderer.send('set-interval', interval),
  setNotificationTreshold: (treshold) => ipcRenderer.send('set-treshold', treshold)
})