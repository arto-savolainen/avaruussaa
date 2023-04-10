const activityElement = document.getElementById('activity')
const intervalInput = document.getElementById('interval-input')
const tresholdInput = document.getElementById('treshold-input')
const timerElement = document.getElementById('timer')
const toggleInput = document.getElementById('toggle-input')
const settingsIcon = document.getElementById('settings-icon')
const trayInput = document.getElementById('tray-input')
const stationElement = document.getElementById('station')
const stationIcon = document.getElementById('station-icon')
const stationsTable = document.getElementById('stations-table')

const mainDiv = document.getElementById('main-page')
const settingsDiv = document.getElementById('settings-page')
const stationsDiv = document.getElementById('stations-page')
mainDiv.style.display = 'block'
settingsDiv.style.display = 'none' // For some reason these are null when set with CSS only, though they display correctly
stationsDiv.style.display = 'none'
// "What you have in your CSS stylesheets has little to do with the style property of your element.
// The style property only includes inline styles." < selitys miksi style.* on null. getComputedStyle() toimii jos tarvii

const bodyStyle = getComputedStyle(document.getElementById('body'))
const defaultFontColor = bodyStyle.color
const defaultFontSize = bodyStyle.fontSize

let notificationInterval
let notificationTreshold
let stations
let timer
let nextUpdateTime


// ------------------ UI UPDATE FUNCTIONS ------------------


// Receive updated activity value from main process and display it in the main window
const updateActivityStyle = () => {
  activityElement.style.opacity = 1
  const activity = activityElement.innerText

  // If station data is not available, style the message differently
  if (isNaN(activity)) {
    activityElement.style.color = defaultFontColor // Use default font color when displaying 'data not found' message
    activityElement.style.fontSize = defaultFontSize // And default font size
    activityElement.style.marginTop = '20px'
    activityElement.style.marginBottom = '20px'
    return
  }

  // Fix activity style from previous not found message, use default styles copied from css at the creation of the renderer
  // Settings a style property to null reverts it back to CSS stylesheet definitions
  activityElement.style.fontSize = null
  activityElement.style.marginTop = null
  activityElement.style.marginBottom = null

  // If activity is at or above treshold, color the displayed value red
  if (activity >= notificationTreshold) {
    activityElement.style.color = 'rgb(235, 53, 53)'
  }
  else {
    // If activity is below alert treshold, color it blue
    activityElement.style.color = 'rgb(23, 23, 252)'
  }
}

// Update the display showing to the user how much time left until the next time activity is updated
const updateTimerDisplay = (time) => {
  time = Math.ceil(time / 1000) // Processing delay is also subtracted in the previous step, round up to fix this

  // Freeze time display at 00:00:00 (or whatever it last was) if something goes wrong
  if (time < 0) {
    return
  }

  let minutes = Math.floor(time / 60)
  let seconds = time - minutes * 60

  // Format the time display to look a little nicer - prepend zeroes if necessary
  minutes = minutes < 10 ? `0${minutes}` : minutes
  seconds = seconds < 10 ? `0${seconds}` : seconds

  timerElement.innerText = `Seuraava päivitys: ${minutes}:${seconds}`
}

// Construct a table showing available observatories for the user to select
const buildStationsTable = () => {
  const buildCell = (row, cellIndex, stationIndex) => {
    const station =  stations[stationIndex]
    const cell = row.insertCell(cellIndex)
    cell.innerText = station.name
    cell.dataset.code = station.code
  }

  const rows = Math.ceil(stations.length / 2)

  for (let i = 0; i < rows; i++) {
    const row = stationsTable.insertRow(i)
    buildCell(row, 0, i * 2)

    // Avoid array out of bounds after the last cell
    if (i * 2 + 1 < stations.length) {
      buildCell(row, 1, i * 2 + 1)
    }
  }
}


// ------------------ IPC RECEIVER FUNCTIONS FOR RENDERER ------------------


// Receive UI configuration data from main process and initialize values
window.electronAPI.onSetUIConfiguration((event, config) => {
  notificationInterval = config.notificationInterval
  notificationTreshold = config.notificationTreshold
  stations = config.STATIONS

  intervalInput.value = notificationInterval
  tresholdInput.value = notificationTreshold
  trayInput.checked = config.minimizeToTray
  toggleInput.checked = config.notificationToggleChecked
  stationElement.innerText = config.currentStation.name // config.station also includes station.code

  buildStationsTable() // Initialize the station select page
})

// Receive updated activity value from main process
window.electronAPI.onUpdateActivity((event, newActivity) => {
  activityElement.innerText = newActivity
  updateActivityStyle()
})

// Receive time to next activity update from main process and run the timer updating UI
window.electronAPI.onSetNextUpdateTimer((event, timeMs) => {
  nextUpdateTime = Date.now() + timeMs

  if (timer) {
    clearInterval(timer)
    timer = null
  }

  updateTimerDisplay(timeMs)

  timer = setInterval(() => {
    updateTimerDisplay(nextUpdateTime - Date.now())
  }, 1000);
})


// ------------------ EVENT LISTENERS FOR interval-input -------------------


// Save last valid input when user clicks outside of the interval input element
intervalInput.addEventListener('focusout', (event) => {
  intervalInput.value = notificationInterval
})

// Validate that user input for the interval input element is a number
intervalInput.addEventListener('change', (event) => {
  if (isNaN(event.target.value) || isNaN(parseFloat(event.target.value))  || event.target.value < 0) {
    intervalInput.value = notificationInterval
  }
  else {
    notificationInterval = event.target.value.trim()
    window.electronAPI.setNotificationInterval(notificationInterval)
  }
})


// ------------------ EVENT LISTENERS FOR treshold-input -------------------


// Save last valid input when user clicks outside of the interval input element
tresholdInput.addEventListener('focusout', (event) => {
  tresholdInput.value = notificationTreshold
})


// Validate that user input for the interval input element is a positive number
tresholdInput.addEventListener('change', (event) => {
  if (isNaN(event.target.value) || isNaN(parseFloat(event.target.value)) || event.target.value < 0) {
    tresholdInput.value = notificationTreshold
  }
  else {
    notificationTreshold = event.target.value.trim()
    window.electronAPI.setNotificationTreshold(notificationTreshold)
    updateActivityStyle()
  }
})


// -------- SHARED EVENT LISTENERS FOR interval-input AND treshold-input --------


const setSharedEventListeners = (element) => {

  // Clear input box when user clicks on it
  element.addEventListener('click', (event) => {
    element.value = ''
  })

  // Limit length of text in input box to 5 characters and prevent whitespace
  element.addEventListener('input', (event) => {
    element.value = event.target.value.trim()

    if (event.target.value.length > 5) {
      element.value = event.target.value.substr(0, 5)
    }
  })

  // Lose focus on element if user presses enter or esc.
  element.addEventListener("keydown", (event) => {
    if (event.key === 'Enter' || event.key === 'Escape') {
      element.blur()
    }
  })
}

setSharedEventListeners(intervalInput)
setSharedEventListeners(tresholdInput)


// ------------------ EVENT LISTENERS FOR toggle-input -------------------


// When user clicks the toggle to enable or disable notifications
toggleInput.addEventListener('click', (event) => {
  window.electronAPI.setNotificationToggle(toggleInput.checked)
})


// ------------------ EVENT LISTENERS FOR tray-input -------------------


// When user clicks the toggle to enable or disable minimize to tray
trayInput.addEventListener('click', (event) => {
  window.electronAPI.setTrayToggle(trayInput.checked)
})


// ------------------ EVENT LISTENERS FOR settings-icon -------------------


// When user clicks the settings icon
settingsIcon.addEventListener('click', (event) => {
  // If in main page, switch to settings page
  if (mainDiv.style.display === 'block') {
    mainDiv.style.display = 'none'
    settingsDiv.style.display = 'block'
    settingsIcon.src = 'arrow.png'
  }
  // If in settings or stations page, switch back to main page
  else {
    settingsDiv.style.display = 'none'
    stationsDiv.style.display = 'none'
    mainDiv.style.display = 'block'
    settingsIcon.src = 'bars.png'
  }
})


// ------------------ EVENT LISTENERS FOR station-icon -------------------


// When user clicks the station icon, hide main page and show the stations page
stationIcon.addEventListener('click', (event) => {
  mainDiv.style.display = 'none'
  stationsDiv.style.display = 'block'
  settingsIcon.src = 'arrow.png'
})


// ------------------ EVENT LISTENERS FOR stations-table -------------------


// When user clicks a cell in the stations table to select an observatory it's handled here
stationsTable.addEventListener('click', (event) => {
  const cell = event.target.closest('td')

  // Did not click on a cell but somewhere else in the table
  if (!cell) {
    return 
  }

  window.electronAPI.setStation({ name: cell.innerText, code: cell.dataset.code })
  stationElement.innerText = cell.innerText

  // Switch back to main page
  stationsDiv.style.display = 'none'
  mainDiv.style.display = 'block'
  settingsIcon.src = 'bars.png'
  activityElement.style.opacity = 0 // Start fade out transition for activity < doesn't actually fade out, dont know why
})