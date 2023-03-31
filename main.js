const { app, BrowserWindow, Menu, ipcMain } = require('electron')
const path = require('path')
const axios = require('axios')

const getData = async () => {
  const alertTreshold = 0.001 // Test value, final value maybe 0.5?

  const response = await axios.get('https://www.ilmatieteenlaitos.fi/revontulet-ja-avaruussaa', {
    //Query URL without using browser cache
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  })
  
  const responseBody = response.data // html+javascript response which includes the data we want
  var data = responseBody.split('NUR\\\":{\\\"dataSeries\\\":') // Split response string starting from the position where the data we are interested in begins
  data = data[1].split('},', 1) // Split again where the data we want ends, discarding everything after it
  data = JSON.parse(data[0]) // Transform string to a javascript object. Now we have our data in an array.
  
  // var time = formatTime(data[data.length - 1][0]) // if we need to display time
  const activity = data[data.length - 1][1]
  console.log(data[data.length - 1])
  console.log(time, activity)

  if (activity >= alertTreshold) {
    const notificationText = `Revontulet todennäköisiä. Aktiivisuus ${activity} nT`
    console.log(notificationText)
  }
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 300,
    height: 200,
    title: 'Avaruussää',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
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

  mainWindow.webContents.openDevTools()
}

app.whenReady().then(() => {
  createWindow()

  // macOS stuff
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit() // Exclude macOS ('darwin')
})