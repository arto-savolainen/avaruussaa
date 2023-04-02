const { app, BrowserWindow, Menu, Notification, ipcMain } = require('electron')
const path = require('path')
const axios = require('axios')

const TEN_MINUTES_MS = 10 * 60 * 1000
let mainWindow
let appBackgroundColor = '#151515'
let appTextColor = '#404040'
let notificationTreshold = 0.001 // Test value, final value maybe 0.5? let user change this
let notificationInterval = 0.1 // Minimum time between notifications in hours
let notificationTimer
let suppressNotification = false

const showNotification = (activity) => {
  // Don't show notification if notificationInterval time has not elapsed since the last one
  if (suppressNotification) {
    console.log('suppressing notification')
    return
  }

  const NOTIFICATION_TITLE = 'Northern lights'
  const NOTIFICATION_BODY = `Are likely. Magnetic activity is ${activity} nT`

  new Notification({
    title: NOTIFICATION_TITLE,
    body: NOTIFICATION_BODY,
  }).show()

  if (notificationInterval > 0) {
    suppressNotification = true

    console.log('setting notification timeout,', notificationInterval * 60 * 60, 'seconds')
    notificationTimer = setTimeout(() => {
      suppressNotification = false
    }, notificationInterval * 60 * 60 * 1000)
  }
}

const fetchData = async () => {
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
}

const updateData = async () => {
  console.log('update call received in updateData()!!!!!!!!!!')
  const activity = await fetchData()

  // Show desktop notification about activity
  if (activity >= notificationTreshold) {
    showNotification(activity)
  }

  // Send updated activity value to UI
  mainWindow.webContents.send('update-activity', activity)
}

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 300,
    height: 200,
    resizable: false,
    backgroundColor: appBackgroundColor,
    // frame: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: appBackgroundColor,
      symbolColor: appTextColor,
      height: 30
    },
    webPreferences: {
      preload: path.join(__dirname, 'preloadMain.js')
    }
  })

  Menu.setApplicationMenu(null)
  
  mainWindow.loadFile('index.html')
}

const initializeUI = () => {
  console.log('initializeUI')
  mainWindow.webContents.send('set-config', { notificationTreshold, notificationInterval })

  // Get activity data, show notification if needed and send data to the renderer
  updateData()
}

app.whenReady().then(() => {
  createWindow()
  mainWindow.webContents.openDevTools()

  // When mainWindow has finished loading and is ready to display
  mainWindow.webContents.once('did-finish-load', () => {
    console.log('täällä ollaan mainWindow.webContents.once, ääkköset kusee electron konsolissa')
    initializeUI()
    
    // ----------------------------------
    // Set timers for data fetching below
    // ----------------------------------

    // The website we get data from updates every ten minutes past the hour. Se we need to set a timer that triggers a data
    // fetching operation just after that update. However, the site can take a bit of time to update (up to some tens of seconds).
    // Here we get how many minutes until update happens from the present moment.
    time = new Date(Date.now())
    const offsetMinutes = 10 - (time.getMinutes() % 10)
    // How many seconds to a full minute? By adding this to offsetMinutes we give the site a 1 minute buffer to update
    const offsetSeconds = 60 - time.getSeconds()
    console.log('time:', time, 'minutes:', time.getMinutes(), 'offset:', offsetMinutes)
    // Time in milliseconds until the clock is 11 minutes past, 21 past, etc.
    const timerMs = (offsetMinutes * 60 + offsetSeconds) * 1000

    // Set timer to trigger data fetching at the right time
    console.log('starting timer of', timerMs / 1000, 'seconds')
    setTimeout(() => {
      // Here time is about 1 minute after assumed site update. Now we set a timer that will run through the lifetime of the program
      // and call the data fetch function every 10 minutes.
      setInterval(() => {
        console.log('interval executing')
        var t = new Date(Date.now())
        console.log(`current time before data fetch: ${t.getHours()}:${t.getMinutes()}:${t.getSeconds()}:${t.getMilliseconds()}`)
        updateData()
        t = new Date(Date.now())
        console.log(`current time after data fetch: ${t.getHours()}:${t.getMinutes()}:${t.getSeconds()}:${t.getMilliseconds()}`)

      }, TEN_MINUTES_MS);

      // Datafetch at the assumed site update time, after this fetching will happen at 10 minute intervals
      updateData()
      console.log('end of timer, data sent?')
    }, timerMs);
  })

  ipcMain.on('set-interval', (event, interval) => {
    console.log('setting interval to:', interval)
    notificationInterval = interval


    // CHANGE THIS LOGIC 
    // so that notifications are suppressed for notificationInterval - time remaining on current noti timer
    // so in effect it behaves as if any existing notification timer is "changed" to obey the new interval

    clearTimeout(notificationTimer)

    suppressNotification = true

    notificationTimer = setTimeout(() => {
      suppressNotification = false
      console.log('zero second timeout executed')
      console.log('noti interval:', notificationInterval)
    }, notificationInterval * 60 * 60 * 1000);
  })

  // macOS stuff
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit() // Exclude macOS ('darwin')
})