const { contextBridge, ipcRenderer } = require('electron')

// The electronApi object is exposed in the renderer script and grants access to Electron's
// IPC API, allowing the script to define handler functions for incoming events as well as
// send events to the main process
contextBridge.exposeInMainWorld('electronAPI', {
  onSetUIConfiguration: (eventHandler) => ipcRenderer.on('set-config', eventHandler),
  onShowError: (eventHandler) => ipcRenderer.on('show-error', eventHandler),
  onUpdateActivity: (eventHandler) => ipcRenderer.on('update-activity', eventHandler),
  onSetUpdateTimer: (eventHandler) => ipcRenderer.on('set-next-update-timer', eventHandler),
  setNotificationInterval: (newInterval) => ipcRenderer.send('set-interval', newInterval),
  setNotificationThreshold: (newThreshold) => ipcRenderer.send('set-threshold', newThreshold),
  setNotificationToggle: (checked) => ipcRenderer.send('set-toggle', checked),
  setTrayToggle: (checked) => ipcRenderer.send('set-tray-toggle', checked),
  setStation: (newStation) => ipcRenderer.send('set-station', newStation)
})