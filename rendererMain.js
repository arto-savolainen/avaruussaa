const activityElement = document.getElementById('activity')
const intervalInput = document.getElementById('interval-input')
const paska = document.getElementById('paska')

let notificationTreshold = 0
let validInterval = 0 // This is used to hold the last valid value of the notification interval input field, to cancel invalid input

// Receive UI configuration data from main process and initialize values
window.electronAPI.onSetUIConfiguration((event, config) => {
  console.log('in onSetUIConfiguration, config:', config)
  notificationTreshold = config.notificationTreshold
  validInterval = config.notificationInterval
  intervalInput.value = validInterval
})

// Receive updated activity value from main process
window.electronAPI.onUpdateActivity((event, activity) => {
  console.log('in onUpdateActivity, activity:', activity)
  activityElement.innerText = activity

    // If activity is above treshold, color the displayed value red
    if (activity >= notificationTreshold) {
      activityElement.style.color = 'rgb(235, 53, 53)'
    }
    else {
      // Else color it blue
      activityElement.style.color = 'rgb(23, 23, 252)'
    }
})

// Clear input box when user clicks on it
intervalInput.addEventListener('click', (event) => {
  intervalInput.value = ''
})

// Save last valid input when user clicks outside of the interval input element
intervalInput.addEventListener('focusout', (event) => {
  intervalInput.value = validInterval
})

// Limit length of text in interval input to 4 characters and prevent whitespace
intervalInput.addEventListener('input', (event) => {
  intervalInput.value = event.target.value.trim()

  if (event.target.value.length > 4) {
    intervalInput.value = event.target.value.substr(0, 4)
  }
})

// Validate that user input for the interval input element is a number
intervalInput.addEventListener('change', (event) => {
  if (isNaN(event.target.value) || isNaN(parseFloat(event.target.value))) {
    intervalInput.value = validInterval
  }
  else {
    validInterval = event.target.value.trim()
    window.electronAPI.setNotificationInterval(validInterval)
  }
})

// Lose focus on interval input if user presses enter or esc.
intervalInput.addEventListener("keydown", (event) => {
  if (event.key === 'Enter' || event.key === 'Escape') {
    intervalInput.blur()
  }
})

// If end up having more than one input field with identical validation, do helper