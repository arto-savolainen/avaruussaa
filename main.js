const { app, BrowserWindow, Menu, Notification, ipcMain, Tray, shell } = require('electron')
const path = require('path')
const axios = require('axios')

const WINDOW_WIDTH = 300
const WINDOW_HEIGHT = 250
const TEN_MINUTES_MS = 10 * 60 * 1000
const HOURS_TO_MS = 60 * 60 * 1000
let mainWindow
let appBackgroundColor = '#151515'
let appTextColor = '#404040'
let notificationTreshold = 0.4 // Test value, let user change this
let notificationInterval = 0 // Minimum time between notifications in hours
let intervalTimer
let intervalTimerStart
let suppressNotification = false
let firstAlert = true
let station = { name: 'Nurmijärvi', code: 'NUR' }
let tray = null

const startIntervalTimer = (time) => {
  if (intervalTimer) {
    console.log('clearing intervalTimer with clearTimeout()')
    clearTimeout(intervalTimer)
  }

  intervalTimer = setTimeout(() => {
    console.log('executing intervalTimer setTimeout: suppression end')
    suppressNotification = false
    intervalTimer = null
    intervalTimerStart = null
  }, time)
}

const showNotification = (activity) => {
  // Don't show notification if notificationInterval time has not elapsed since the last one
  if (suppressNotification && !firstAlert) {
    console.log('suppressing notification')
    return
  }

  firstAlert = false

  new Notification({
    title: 'Northern lights likely',
    body: `Magnetic activity at ${station.name}: ${activity} nT`,
  }).show()

  if (notificationInterval > 0) {
    suppressNotification = true
    console.log('setting notification timeout,', notificationInterval * 60 * 60, 'seconds')
    intervalTimerStart = new Date()
    startIntervalTimer(notificationInterval * HOURS_TO_MS)
  }
}

const fetchData = async () => {
  let response
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
  const splitString = `${station.code}\\\":{\\\"dataSeries\\\":` // Data starts after this string
  let data = responseBody.split(splitString) // Split response string where the data for our monitoring station begins
  data = data[1].split('},', 1) // Split again where the data we want ends, discarding everything after it
  data = JSON.parse(data[0]) // Transform string to a javascript object. Now we have our data in an array.
  const time = new Date(data[data.length - 1][0]) //temp
  const activity = data[data.length - 1][1]
  // console.dir(data, {'maxArrayLength': null})
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

const initializeUI = () => {
  console.log('initializeUI')
  mainWindow.webContents.send('set-config',
    {
      notificationTreshold, notificationInterval
    }
  )

  // Get activity data, show notification if needed and send data to the renderer
  updateData()
}

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    resizable: false,
    icon: 'icon.png',
    backgroundColor: appBackgroundColor,
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

const createTray = () => {
  let appIcon = new Tray(path.join(__dirname, "icon.png"))

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show', click: () => {
        mainWindow.show()
      }
    },
    {
      label: 'Quit', click: () => {
        app.quit()
      }
    }
  ])

  appIcon.on('double-click', (event) => {
    mainWindow.show()
  })

  appIcon.setToolTip('Avaruussää')
  appIcon.setContextMenu(contextMenu)

  return appIcon
}

app.whenReady().then(() => {
  createWindow()
  // mainWindow.webContents.openDevTools()

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
    time = new Date()
    // Calculate how many minutes to the next time minutes are divisible by 10 (ie. 00, 10, 20 etc.)
    let offsetMinutes = 10 - (time.getMinutes() % 10 === 0 ? 10 : time.getMinutes() % 10)
    // How many seconds to a full minute? By adding this to offsetMinutes we give the site a 1 minute buffer to update
    const offsetSeconds = 60 - time.getSeconds()
    console.log('time:', time, 'minutes:', time.getMinutes(), 'offset:', offsetMinutes)
    // Time in milliseconds until the clock is 11 minutes past, 21 past, etc.
    const timeMs = (offsetMinutes * 60 + offsetSeconds) * 1000

    // Set timer to trigger data fetching at the right time
    console.log('starting timer of', timeMs / 1000, 'seconds')
    setTimeout(() => {
      // Here time is about 1 minute after assumed site update. Now we set a timer that will run through the lifetime of the program
      // and call the data fetch function every 10 minutes.
      setInterval(() => {
        console.log('interval executing')
        var t = new Date()
        console.log(`current time before data fetch: ${t.getHours()}:${t.getMinutes()}:${t.getSeconds()}:${t.getMilliseconds()}`)
        updateData()
        t = new Date()
        console.log(`current time after data fetch: ${t.getHours()}:${t.getMinutes()}:${t.getSeconds()}:${t.getMilliseconds()}`)
        mainWindow.webContents.send('set-next-update-timer', TEN_MINUTES_MS)
      }, TEN_MINUTES_MS);

      // Datafetch at the assumed site update time, after this fetching will happen at 10 minute intervals
      updateData()
      mainWindow.webContents.send('set-next-update-timer', TEN_MINUTES_MS)
      console.log('end of timer, data sent?')
    }, timeMs)

    // Send update timer info to UI
    mainWindow.webContents.send('set-next-update-timer', timeMs)
  })


  // ------------------ USER ACTION HANDLERS ------------------


  mainWindow.on('minimize', (event) => {
    event.preventDefault()
    mainWindow.hide()
    tray = createTray()
  })

  mainWindow.on('restore', (event) => {
    mainWindow.show()
    tray.destroy()
  })

  mainWindow.webContents.on('will-navigate', (event, url) => {
    event.preventDefault()
    shell.openExternal(url)
  })


  // ------------------ IPC RECEIVER FUNCTIONS FOR MAIN ------------------


  ipcMain.on('set-interval', (event, newInterval) => {
    if (intervalTimerStart) {
      // With this the notification suppression timer behaves as if the old timer was started with the new interval
      const timeLeft = (intervalTimerStart.getTime() + newInterval * HOURS_TO_MS) - Date.now()
      console.log('timeLeft in minutes:', timeLeft / 1000 / 60)

      // If there's suppression time left with the new interval
      if (timeLeft > 0) {
        startIntervalTimer(timeLeft)
      }
      // If notification would have cleared already with the new interval
      else {
        clearTimeout(intervalTimer) // Not strictly necessary I guess, just clear redundant timer
        suppressNotification = false
        intervalTimer = null
        intervalTimerStart = null
      }
    }

    console.log('in main setting interval to:', newInterval)
    notificationInterval = newInterval
  })

  ipcMain.on('set-treshold', (event, newTreshold) => {
    console.log('in main setting treshold to:', newTreshold)
    notificationTreshold = newTreshold
  })

  // macOS stuff
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit() // Exclude macOS ('darwin')
})

app.on('quit', () => {
  if (tray) {
    tray.destroy()
  }
})