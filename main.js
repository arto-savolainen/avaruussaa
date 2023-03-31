const { app, BrowserWindow, Menu, ipcMain } = require('electron')
const path = require('path')
const axios = require('axios')

let mainWindow, workerWindow

const getData = async () => {
  const alertTreshold = 0.001 // Test value, final value maybe 0.5?

  var response
  try {
    response = await axios.get('https://www.ilmatieteenlaitos.fi/revontulet-ja-avaruussaa', {
      //Query URL without using browser cache
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error(`Error: ${error.message}`)
  }

  const responseBody = response.data // html+javascript response which includes the data we want
  var data = responseBody.split('NUR\\\":{\\\"dataSeries\\\":') // Split response string starting from the position where the data we are interested in begins
  data = data[1].split('},', 1) // Split again where the data we want ends, discarding everything after it
  data = JSON.parse(data[0]) // Transform string to a javascript object. Now we have our data in an array.

  // var time = formatTime(data[data.length - 1][0]) // if we need to display time
  const time = new Date(data[data.length - 1][0]) //temp
  const activity = data[data.length - 1][1]
  console.log(data[data.length - 1])
  console.log(time, activity)

  // does waiting in main process lock up the app?
  console.log('sleeping for 5 seconds...')
  await sleep(5000)
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
console.log('done sleeping')

  return activity

  // if (activity >= alertTreshold) {
  //   const notificationText = `Revontulet todennäköisiä. Aktiivisuus ${activity} nT`
  //   console.log(notificationText)
  // }
}

const sendActivityToMainWindow = async () => {
  console.log('update call received!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
  const activity = await getData()
  mainWindow.webContents.send('update-activity', activity)
}

const createWindow = async () => {
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
          click: () => sendActivityToMainWindow(),
          label: 'Update'
        }
      ]
    }
  ])
  Menu.setApplicationMenu(menu)

  mainWindow.loadFile('index.html')
  
  setTimeout(sendActivityToMainWindow, 10000)
}

app.whenReady().then(() => {
  createWindow()

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