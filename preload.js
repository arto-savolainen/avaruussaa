const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  onSetUIConfiguration: (config) => ipcRenderer.on('set-config', config),
  onShowError: (error) => ipcRenderer.on('show-error', error),
  onUpdateActivity: (newData) => ipcRenderer.on('update-activity', newData),
  onSetUpdateTimer: (timeMs) => ipcRenderer.on('set-next-update-timer', timeMs),
  setNotificationInterval: (newInterval) => ipcRenderer.send('set-interval', newInterval),
  setNotificationThreshold: (newThreshold) => ipcRenderer.send('set-threshold', newThreshold),
  setNotificationToggle: (checked) => ipcRenderer.send('set-toggle', checked),
  setTrayToggle: (checked) => ipcRenderer.send('set-tray-toggle', checked),
  setStation: (newStation) => ipcRenderer.send('set-station', newStation)
})