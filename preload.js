const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  onSetUIConfiguration: (config) => ipcRenderer.on('set-config', config),
  onUpdateActivity: (newActivity) => ipcRenderer.on('update-activity', newActivity),
  onSetNextUpdateTimer: (timeMs) => ipcRenderer.on('set-next-update-timer', timeMs),
  setNotificationInterval: (newInterval) => ipcRenderer.send('set-interval', newInterval),
  setNotificationTreshold: (newTreshold) => ipcRenderer.send('set-treshold', newTreshold),
  setNotificationToggle: (checked) => ipcRenderer.send('set-toggle', checked),
  setTrayToggle: (checked) => ipcRenderer.send('set-tray-toggle', checked),
  setStation: (newStation) => ipcRenderer.send('set-station', newStation)
})