const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  onGetData: (callback) => ipcRenderer.send('get-data', callback)
})