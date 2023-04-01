const { app, BrowserWindow, Menu, ipcMain } = require('electron')
const path = require('path')
const axios = require('axios')

const TEN_MINUTES_MS = 10 * 60 * 1000
let mainWindow

const fetchData = async () => {
  const alertTreshold = 0.001 // Test value, final value maybe 0.5?

  var response
  try {
    response = await axios.get('https://www.ilmatieteenlaitos.fi/revontulet-ja-avaruussaa', {
      // Query URL without using browser cache
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
  // console.log(data[data.length - 1])
  console.log(time, activity)

  return activity

  // if (activity >= alertTreshold) {
  //   const notificationText = `Revontulet todennäköisiä. Aktiivisuus ${activity} nT`
  //   console.log(notificationText)
  // }
}

const fetchDataAndSendToMainWindow = async () => {
  console.log('update call received!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
  const activity = await fetchData()
  mainWindow.webContents.send('update-activity', activity)
}

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
          click: () => fetchDataAndSendToMainWindow(),
          label: 'Update'
        },
        {
          click: () => app.quit(),
          label: 'Quit',
        }
      ]
    }
  ])
  Menu.setApplicationMenu(menu)

  mainWindow.loadFile('index.html')
}

app.whenReady().then(() => {
  createWindow()

  // When mainWindow has finished loading and is ready to display
  mainWindow.webContents.once('did-finish-load', () => {
    console.log('täällä ollaan mainWindow.webContents.once, ääkköset kusee electron konsolissa')
    // Get activity data and send it to the renderer
    fetchDataAndSendToMainWindow()

    // The website we get data from updates every ten minutes past the hour. Se we need to set a timer that triggers a data
    // fetching operation just after that update. However, the site can take a bit of time to update (up to some tens of seconds).
    // Here we get how many minutes until update happens from the present moment.
    time = new Date(Date.now())
    const offsetMinutes = 10 - (time.getMinutes() % 10)
    // How many seconds to a full minute? By adding this to offsetMinutes we give the site a 1 minute buffer to update
    const offsetSeconds = 60 - time.getSeconds()
    console.log('time:', time, 'minutes:', time.getMinutes(), 'offset:', offsetMinutes)
    // Time in milliseconds until the clock is 11 minutes past, 21 past, etc.
    const timerMs = offsetMinutes * 60 * 1000 + offsetSeconds * 1000

    // Set timer to trigger data fetching at the right time
    console.log('starting timer of', timerMs / 1000, 'seconds')
    setTimeout(() => {
      // Here time is about 1 minute after assumed site update. Now we set a timer that will run through the lifetime of the program
      // and call the data fetch function every 10 minutes.
      setInterval(() => {
        console.log('interval executing')
        var t = new Date(Date.now())
        console.log(`current time before data fetch: ${t.getHours()}:${t.getMinutes()}:${t.getSeconds()}:${t.getMilliseconds()}`)
        fetchDataAndSendToMainWindow()
        t = new Date(Date.now())
        console.log(`current time after data fetch: ${t.getHours()}:${t.getMinutes()}:${t.getSeconds()}:${t.getMilliseconds()}`)

      }, TEN_MINUTES_MS);

      // First datafetch at the assumed site update time, after this fetching will happen at 10 minute intervals
      fetchDataAndSendToMainWindow()
      console.log('end of timer, data sent?')
    }, timerMs);
  })

  // macOS stuff
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit() // Exclude macOS ('darwin')
})