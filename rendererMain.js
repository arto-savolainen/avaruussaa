const activityElement = document.getElementById('activity')
const activityAll = document.getElementById('activity-all')
const intervalInput = document.getElementById('interval-input')
const tresholdInput = document.getElementById('treshold-input')
const timerElement = document.getElementById('timer')
const toggleInput = document.getElementById('toggle-input')
const settingsIcon = document.getElementById('settings-icon')
const trayInput = document.getElementById('tray-input')

const mainDiv = document.getElementById('main')
const settingsDiv = document.getElementById('settings')
settingsDiv.style.display = 'none'

let notificationInterval
let notificationTreshold
let timer
let updateTime

// window.queryLocalFonts().then((x) => {
//   console.log('fonts', x)
// }).catch((x) => {
//   console.log('error')
// })


// ------------------ UI UPDATE FUNCTIONS ------------------


// Receive updated activity value from main process and display it in the main window
const updateActivityColor = () => {
  const activity = activityElement.innerText

  // If activity is at or above treshold, color the displayed value red
  if (activity >= notificationTreshold) {
    activityAll.style.color = 'rgb(235, 53, 53)'
  }
  else {
    // If activity is below alert treshold, color it blue
    activityAll.style.color = 'rgb(23, 23, 252)'
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

  timerElement.innerText = `Next update in ${minutes}:${seconds}`
}


// ------------------ IPC RECEIVER FUNCTIONS FOR RENDERER ------------------


// Receive UI configuration data from main process and initialize values
window.electronAPI.onSetUIConfiguration((event, config) => {
  notificationInterval = config.notificationInterval
  notificationTreshold = config.notificationTreshold
  intervalInput.value = notificationInterval
  tresholdInput.value = notificationTreshold
  trayInput.checked = config.minimizeToTray
  toggleInput.checked = config.notificationToggleChecked
  
})

// Receive updated activity value from main process
window.electronAPI.onUpdateActivity((event, activity) => {
  activityElement.innerText = `${activity}`
  updateActivityColor()
})

// Receive time to next activity update from main process and run the timer updating UI
window.electronAPI.onSetNextUpdateTimer((event, timeMs) => {
  updateTime = Date.now() + timeMs

  if (timer) {
    clearInterval(timer)
    timer = null
  }

  updateTimerDisplay(timeMs)
  
  timer = setInterval(() => {
    updateTimerDisplay(updateTime - Date.now())
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
    updateActivityColor()
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
  // If in main window mode, switch to settings display
  if (settingsDiv.style.display === 'none') {
    mainDiv.style.display = 'none'
    settingsDiv.style.display = 'block'
    settingsIcon.src = 'arrow.png'
  }
  // If in settings display, switch back to main window
  else {
    settingsDiv.style.display = 'none'
    mainDiv.style.display = 'block'
    settingsIcon.src = 'bars.png'
  }
})