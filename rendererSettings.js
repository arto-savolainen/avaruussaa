const intervalInput = document.getElementById('interval-input')
const tresholdInput = document.getElementById('treshold-input')
const toggleInput = document.getElementById('toggle-input')
const arrowIcon = document.getElementById('arrow-icon')

// toggleInput.checked = true get from main somehow

let notificationInterval
let notificationTreshold

// ------------------ IPC RECEIVER FUNCTIONS FOR RENDERER ------------------


// // Receive UI configuration data from main process and initialize values
// window.electronAPI.onSetUIConfiguration((event, config) => {
//   notificationInterval = config.notificationInterval
//   notificationTreshold = config.notificationTreshold
//   intervalInput.value = notificationInterval
//   tresholdInput.value = notificationTreshold
// })

// // Receive updated activity value from main process
// window.electronAPI.onUpdateActivity((event, activity) => {
//   activityElement.innerText = `${activity}`
//   updateActivityColor()
// })

// // Receive time to next activity update from main process and run the timer updating UI
// window.electronAPI.onSetNextUpdateTimer((event, timeMs) => {
//   updateTime = Date.now() + timeMs

//   if (timer) {
//     clearInterval(timer)
//     timer = null
//   }

//   updateTimerDisplay(timeMs)
  
//   timer = setInterval(() => {
//     updateTimerDisplay(updateTime - Date.now())
//   }, 1000);
// })


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


toggleInput.addEventListener('click', (event) => {
  window.electronAPI.setNotificationToggle(toggleInput.checked)
})


// ------------------ EVENT LISTENERS FOR arrow-icon -------------------

arrowIcon.addEventListener('click', (event) => {
  window.electronAPI.closeSettings()
})