const { app, BrowserWindow, Menu, ipcMain } = require('electron')
const path = require('path')

let mainWindow, workerWindow

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 300,
    height: 200,
    webPreferences: {
      preload: path.join(__dirname, 'preloadMain.js')
    }
  })

  // Menu demo, get rid of this if no other menu items
  const menu = Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        {
          click: () => app.quit(),
          label: 'Quit',
        },
        {
          click: () => mainWindow.webContents.send('update-activity', 1000),
          label: 'Update'
        }
      ]
    }
  ])
  Menu.setApplicationMenu(menu)

  mainWindow.loadFile('index.html')
}

const createWorkerWindow = () => {
  workerWindow = new BrowserWindow({
   // show: false,
    webPreferences: { 
      // nodeIntegration: true, // Doesn't seem to work as hoped, can't use require in renderer script
      preload: path.join(__dirname, 'preloadWorker.js')
    }
  })
  
  workerWindow.loadFile('worker.html')

  workerWindow.webContents.openDevTools() // debugging help
}

app.whenReady().then(() => {
  createWindow()

  // Create a hidden renderer for the data fetching background process
  createWorkerWindow()
  
  ipcMain.on('get-data', (event, activity) => {
    console.log('täällä')
    // Simple solution with a single value, expand in future
    mainWindow.webContents.send('update-activity', activity)
  })

  // macOS stuff
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit() // Exclude macOS ('darwin')
})